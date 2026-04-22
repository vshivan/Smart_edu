const pool = require('../config/db');
const { createClient } = require('redis');
const { AppError } = require('../../../shared/utils/errors');
const { LEVELS, XP } = require('../../../shared/constants');

let redis;
const getRedis = async () => {
  if (!redis) { redis = createClient({ url: process.env.REDIS_URL }); await redis.connect(); }
  return redis;
};

// ─── XP & LEVEL ─────────────────────────────────────────────────────────────

const getLevelForXP = (xp) => {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp_required) current = lvl;
    else break;
  }
  return current;
};

const awardXP = async (userId, amount, reason) => {
  const { rows } = await pool.query(
    `UPDATE learner_profiles SET xp_total = xp_total + $1 WHERE user_id = $2
     RETURNING xp_total, level`,
    [amount, userId]
  );
  if (!rows.length) throw new AppError('Learner profile not found', 404);

  const { xp_total } = rows[0];
  const newLevel = getLevelForXP(xp_total);
  const leveledUp = newLevel.level > rows[0].level;

  if (leveledUp) {
    await pool.query('UPDATE learner_profiles SET level = $1 WHERE user_id = $2', [newLevel.level, userId]);
    await checkAndAwardBadges(userId, { level: newLevel.level });
  }

  // Update Redis leaderboard
  const r = await getRedis();
  await r.zAdd('leaderboard:global', [{ score: xp_total, value: userId }]);

  return { xp_total, level: newLevel, leveled_up: leveledUp };
};

// ─── STREAKS ─────────────────────────────────────────────────────────────────

const checkStreak = async (userId) => {
  const r = await getRedis();
  const key = `streak:${userId}`;
  const stored = await r.get(key);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (stored) {
    const { count, lastDate } = JSON.parse(stored);
    if (lastDate === todayStr) return { streak: count, xp_earned: 0, already_checked: true };

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const newCount = lastDate === yesterdayStr ? count + 1 : 1;
    await r.setEx(key, 48 * 3600, JSON.stringify({ count: newCount, lastDate: todayStr }));
    await pool.query('UPDATE learner_profiles SET streak_days = $1, longest_streak = GREATEST(longest_streak, $1) WHERE user_id = $2', [newCount, userId]);

    const xpEarned = XP.DAILY_STREAK;
    await awardXP(userId, xpEarned, 'daily_streak');
    await checkAndAwardBadges(userId, { streak_days: newCount });

    return { streak: newCount, xp_earned: xpEarned };
  }

  // First check today
  await r.setEx(key, 48 * 3600, JSON.stringify({ count: 1, lastDate: todayStr }));
  await pool.query('UPDATE learner_profiles SET streak_days = 1 WHERE user_id = $1', [userId]);
  return { streak: 1, xp_earned: XP.DAILY_STREAK };
};

// ─── BADGES ──────────────────────────────────────────────────────────────────

const checkAndAwardBadges = async (userId, context) => {
  const { rows: allBadges } = await pool.query('SELECT * FROM badges WHERE is_active = true');
  const { rows: earned } = await pool.query('SELECT badge_id FROM user_badges WHERE user_id = $1', [userId]);
  const earnedIds = new Set(earned.map((e) => e.badge_id));

  const newBadges = [];

  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue;
    const criteria = badge.criteria;

    let qualifies = false;
    if (criteria.streak_days && context.streak_days >= criteria.streak_days) qualifies = true;
    if (criteria.level && context.level >= criteria.level) qualifies = true;
    if (criteria.lessons_completed && context.lessons_completed >= criteria.lessons_completed) qualifies = true;
    if (criteria.courses_completed && context.courses_completed >= criteria.courses_completed) qualifies = true;
    if (criteria.perfect_score && context.perfect_score) qualifies = true;

    if (qualifies) {
      await pool.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, badge.id]);
      if (badge.xp_value > 0) await awardXP(userId, badge.xp_value, `badge_${badge.name}`);
      newBadges.push(badge);
    }
  }

  return newBadges;
};

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────

const getLeaderboard = async (limit = 20) => {
  const r = await getRedis();
  const entries = await r.zRangeWithScores('leaderboard:global', 0, limit - 1, { REV: true });

  if (!entries.length) {
    // Fallback to DB
    const { rows } = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.avatar_url, lp.xp_total, lp.level
       FROM learner_profiles lp JOIN users u ON lp.user_id = u.id
       ORDER BY lp.xp_total DESC LIMIT $1`,
      [limit]
    );
    return rows;
  }

  return entries.map((e, i) => ({ rank: i + 1, user_id: e.value, xp: e.score }));
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────

const getGamificationProfile = async (userId) => {
  const { rows } = await pool.query(
    `SELECT lp.xp_total, lp.level, lp.streak_days, lp.longest_streak,
            json_agg(json_build_object('badge', b, 'earned_at', ub.earned_at)) AS badges
     FROM learner_profiles lp
     LEFT JOIN user_badges ub ON ub.user_id = lp.user_id
     LEFT JOIN badges b ON b.id = ub.badge_id
     WHERE lp.user_id = $1
     GROUP BY lp.xp_total, lp.level, lp.streak_days, lp.longest_streak`,
    [userId]
  );
  if (!rows.length) throw new AppError('Profile not found', 404);

  const profile = rows[0];
  profile.level_info = getLevelForXP(profile.xp_total);
  const nextLevel = LEVELS.find((l) => l.level === profile.level + 1);
  profile.xp_to_next_level = nextLevel ? nextLevel.xp_required - profile.xp_total : 0;

  return profile;
};

module.exports = { awardXP, checkStreak, checkAndAwardBadges, getLeaderboard, getGamificationProfile };
