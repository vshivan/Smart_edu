const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const Joi = require('joi');
const validate = require('../middleware/validate');

// ── GET /users/learner/progress ───────────────────────────────────────────────
router.get('/learner/progress', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.course_id, e.progress_pct, e.enrolled_at, e.completed_at,
              c.title, c.subject, c.difficulty, c.estimated_hours, c.thumbnail_url,
              c.creator_type,
              TO_CHAR(e.enrolled_at, 'Mon DD') AS last_active
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       WHERE e.learner_id = $1
       ORDER BY e.enrolled_at DESC`,
      [req.user.id]
    );
    sendSuccess(res, rows);
  } catch (e) { next(e); }
});

// ── GET /users/check-email?email=... ─────────────────────────────────────────
// Real-time email availability check (no auth needed)
router.get('/check-email', async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ available: false });
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    res.json({ available: rows.length === 0 });
  } catch (e) { next(e); }
});

// ── GET /users/profile ────────────────────────────────────────────────────────router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.role,
              u.created_at,
              lp.xp_total, lp.level, lp.streak_days, lp.longest_streak, lp.bio,
              lp.learning_goals
       FROM users u
       LEFT JOIN learner_profiles lp ON lp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows.length) throw new AppError('User not found', 404);
    sendSuccess(res, rows[0]);
  } catch (e) { next(e); }
});

// ── PUT /users/profile ────────────────────────────────────────────────────────
const profileSchema = {
  body: Joi.object({
    first_name:     Joi.string().min(1).max(100),
    last_name:      Joi.string().min(1).max(100),
    bio:            Joi.string().max(500).allow(''),
    learning_goals: Joi.array().items(Joi.string()),
  }),
};

router.put('/profile', authenticate, validate(profileSchema), async (req, res, next) => {
  try {
    const { first_name, last_name, bio, learning_goals } = req.body;

    // Update users table
    if (first_name || last_name) {
      const updates = [];
      const params = [];
      let i = 1;
      if (first_name) { updates.push(`first_name = $${i++}`); params.push(first_name); }
      if (last_name)  { updates.push(`last_name = $${i++}`);  params.push(last_name); }
      params.push(req.user.id);
      await pool.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i}`,
        params
      );
    }

    // Update learner_profiles if learner
    if (req.user.role === 'learner' && (bio !== undefined || learning_goals)) {
      const updates = [];
      const params = [];
      let i = 1;
      if (bio !== undefined)   { updates.push(`bio = $${i++}`);             params.push(bio); }
      if (learning_goals)      { updates.push(`learning_goals = $${i++}`);  params.push(learning_goals); }
      if (updates.length) {
        params.push(req.user.id);
        await pool.query(
          `UPDATE learner_profiles SET ${updates.join(', ')} WHERE user_id = $${i}`,
          params
        );
      }
    }

    // Return updated profile
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url, u.role,
              lp.xp_total, lp.level, lp.streak_days, lp.bio
       FROM users u
       LEFT JOIN learner_profiles lp ON lp.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    sendSuccess(res, rows[0], 'Profile updated');
  } catch (e) { next(e); }
});

// ── GET /users/learner/achievements ──────────────────────────────────────────
router.get('/learner/achievements', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.*, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [req.user.id]
    );
    sendSuccess(res, rows);
  } catch (e) { next(e); }
});

module.exports = router;
