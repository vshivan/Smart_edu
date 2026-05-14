const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const { LEVELS, XP } = require('../constants');
const { getRedis } = require('../config/redis');

// ─── Redis helpers — graceful fallback if Redis is unavailable ────────────────
const redisZAdd = async (key, items) => {
  try { const r = await getRedis(); await r.zAdd(key, items); } catch {}
};
const redisZRangeWithScores = async (key, start, stop, opts) => {
  try { const r = await getRedis(); return await r.zRangeWithScores(key, start, stop, opts); } catch { return []; }
};
const redisSetEx = async (key, ttl, value) => {
  try { const r = await getRedis(); await r.setEx(key, ttl, value); } catch {}
};
const redisGet = async (key) => {
  try { const r = await getRedis(); return await r.get(key); } catch { return null; }
};

// ─── Level helpers ────────────────────────────────────────────────────────────
const getLevelForXP = (xp) => {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xp_required) current = lvl;
    else break;
  }
  return current;
};

// ─── Award XP ─────────────────────────────────────────────────────────────────
const awardXP = async (userId, amount, reason) => {
  const { rows } = await pool.query(
    `UPDATE learner_profiles SET xp_total = xp_total + $1 WHERE user_id = $2
     RETURNING xp_total, level`,
    [amount, userId]
  );
  if (!rows.length) throw new AppError('Learner profile not found', 404);

  const { xp_total } = rows[0];
  const newLevel  = getLevelForXP(xp_total);
  const leveledUp = newLevel.level > rows[0].level;

  if (leveledUp) {
    await pool.query('UPDATE learner_profiles SET level = $1 WHERE user_id = $2', [newLevel.level, userId]);
    await checkAndAwardBadges(userId, { level: newLevel.level });
  }

  // Update leaderboard in Redis (non-blocking)
  await redisZAdd('leaderboard:global', [{ score: xp_total, value: userId }]);

  const nextLevel = LEVELS.find((l) => l.level === newLevel.level + 1);
  const xp_to_next_level = nextLevel ? nextLevel.xp_required - xp_total : 0;

  return { xp_total, level: newLevel, leveled_up: leveledUp, xp_to_next_level };
};

// ─── Check streak ─────────────────────────────────────────────────────────────
const checkStreak = async (userId) => {
  const key    = `streak:${userId}`;
  const stored = await redisGet(key);
  const now    = new Date();
  const today  = now.toISOString().split('T')[0];

  if (stored) {
    const { count, lastDate } = JSON.parse(stored);
    if (lastDate === today) return { streak: count, xp_earned: 0, already_checked: true };

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const newCount = lastDate === yesterdayStr ? count + 1 : 1;
    await redisSetEx(key, 48 * 3600, JSON.stringify({ count: newCount, lastDate: today }));
    await pool.query(
      'UPDATE learner_profiles SET streak_days = $1, longest_streak = GREATEST(longest_streak, $1) WHERE user_id = $2',
      [newCount, userId]
    );
    await awardXP(userId, XP.DAILY_STREAK, 'daily_streak');
    await checkAndAwardBadges(userId, { streak_days: newCount });
    return { streak: newCount, xp_earned: XP.DAILY_STREAK };
  }

  await redisSetEx(key, 48 * 3600, JSON.stringify({ count: 1, lastDate: today }));
  await pool.query('UPDATE learner_profiles SET streak_days = 1 WHERE user_id = $1', [userId]);
  return { streak: 1, xp_earned: XP.DAILY_STREAK };
};

// ─── Badge checking ───────────────────────────────────────────────────────────
const checkAndAwardBadges = async (userId, context) => {
  const { rows: allBadges } = await pool.query('SELECT * FROM badges WHERE is_active = true');
  const { rows: earned }    = await pool.query('SELECT badge_id FROM user_badges WHERE user_id = $1', [userId]);
  const earnedIds = new Set(earned.map((e) => e.badge_id));

  const newBadges = [];
  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue;
    const c = badge.criteria;
    let qualifies = false;
    if (c.streak_days       && context.streak_days       >= c.streak_days)       qualifies = true;
    if (c.level             && context.level             >= c.level)             qualifies = true;
    if (c.lessons_completed && context.lessons_completed >= c.lessons_completed) qualifies = true;
    if (c.courses_completed && context.courses_completed >= c.courses_completed) qualifies = true;
    if (c.perfect_score     && context.perfect_score)                            qualifies = true;

    if (qualifies) {
      await pool.query('INSERT INTO user_badges (user_id, badge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userId, badge.id]);
      if (badge.xp_value > 0) await awardXP(userId, badge.xp_value, `badge_${badge.name}`);
      newBadges.push(badge);
    }
  }
  return newBadges;
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────
const getLeaderboard = async (limit = 20) => {
  const entries = await redisZRangeWithScores('leaderboard:global', 0, limit - 1, { REV: true });

  // Fall back to DB if Redis is empty or unavailable
  if (!entries.length) {
    const { rows } = await pool.query(
      `SELECT u.id AS user_id, u.first_name, u.last_name, u.avatar_url,
              lp.xp_total AS xp, lp.level
       FROM learner_profiles lp JOIN users u ON lp.user_id = u.id
       ORDER BY lp.xp_total DESC LIMIT $1`,
      [limit]
    );
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  // Enrich Redis entries with user names + levels from DB
  const userIds = entries.map(e => e.value);
  const { rows: users } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.avatar_url, lp.level
     FROM users u LEFT JOIN learner_profiles lp ON lp.user_id = u.id
     WHERE u.id = ANY($1::uuid[])`,
    [userIds]
  );
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  return entries.map((e, i) => ({
    rank:       i + 1,
    user_id:    e.value,
    xp:         e.score,
    first_name: userMap[e.value]?.first_name || null,
    last_name:  userMap[e.value]?.last_name  || null,
    avatar_url: userMap[e.value]?.avatar_url || null,
    level:      userMap[e.value]?.level      || 1,
  }));
};

// ─── Gamification profile ─────────────────────────────────────────────────────
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
