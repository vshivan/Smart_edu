const router  = require('express').Router();
const passport = require('passport');
const Joi      = require('joi');
const svc      = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendSuccess, sendCreated } = require('../utils/response');

// ─── Validation schemas ───────────────────────────────────────────────────────

const schemas = {
  register: {
    body: Joi.object({
      email:      Joi.string().email().required(),
      password:   Joi.string().min(8).max(72).required(),
      first_name: Joi.string().min(1).max(100).required(),
      last_name:  Joi.string().min(1).max(100).required(),
      role:       Joi.string().valid('learner', 'tutor').default('learner'),
    }),
  },
  login: {
    body: Joi.object({
      email:    Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  },
  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  },
  resetPassword: {
    body: Joi.object({
      token:    Joi.string().required(),
      password: Joi.string().min(8).max(72).required(),
    }),
  },
};

// ─── Routes ───────────────────────────────────────────────────────────────────

// Register
router.post('/register', validate(schemas.register), async (req, res, next) => {
  try { sendCreated(res, await svc.registerUser(req.body), 'Registration successful'); }
  catch (e) { next(e); }
});

// Login
router.post('/login', validate(schemas.login), async (req, res, next) => {
  try { sendSuccess(res, await svc.loginUser(req.body), 'Login successful'); }
  catch (e) { next(e); }
});

// Refresh access token
router.post('/refresh', async (req, res, next) => {
  try { sendSuccess(res, await svc.refreshAccessToken(req.body.refreshToken), 'Token refreshed'); }
  catch (e) { next(e); }
});

// Logout
router.post('/logout', authenticate, async (req, res, next) => {
  try { await svc.logoutUser(req.user.id); sendSuccess(res, null, 'Logged out'); }
  catch (e) { next(e); }
});

// Forgot password — sends reset email
router.post('/forgot-password', validate(schemas.forgotPassword), async (req, res, next) => {
  try {
    await svc.forgotPassword(req.body.email);
    // Always return the same message — prevents user enumeration
    sendSuccess(res, null, 'If that email is registered, a reset link has been sent.');
  } catch (e) { next(e); }
});

// Reset password — consumes the token and sets new password
router.post('/reset-password', validate(schemas.resetPassword), async (req, res, next) => {
  try {
    await svc.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, 'Password reset successful. Please log in with your new password.');
  } catch (e) { next(e); }
});

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  (req, res, next) => {
    try {
      const tokens = svc.generateTokens(req.user);
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`
      );
    } catch (e) { next(e); }
  }
);

// Current user
router.get('/me', authenticate, (req, res) => sendSuccess(res, req.user));

// Change password (authenticated — different from reset-password which uses a token)
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) throw new (require('../utils/errors').AppError)('Both passwords required', 400);
    if (new_password.length < 8) throw new (require('../utils/errors').AppError)('New password must be at least 8 characters', 400);

    const bcrypt = require('bcryptjs');
    const { pool } = require('../config/db');

    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) throw new (require('../utils/errors').AppError)('User not found', 404);
    if (!rows[0].password_hash) throw new (require('../utils/errors').AppError)('Account uses Google sign-in — no password to change', 400);

    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) throw new (require('../utils/errors').AppError)('Current password is incorrect', 401);

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);

    sendSuccess(res, null, 'Password changed successfully');
  } catch (e) { next(e); }
});

module.exports = router;
