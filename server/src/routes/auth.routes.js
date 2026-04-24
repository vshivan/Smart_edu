const router = require('express').Router();
const passport = require('passport');
const svc = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendSuccess, sendCreated } = require('../utils/response');
const Joi = require('joi');

const schemas = {
  register: {
    body: Joi.object({
      email:      Joi.string().email().required(),
      password:   Joi.string().min(8).required(),
      first_name: Joi.string().required(),
      last_name:  Joi.string().required(),
      role:       Joi.string().valid('learner', 'tutor').default('learner'),
    }),
  },
  login: {
    body: Joi.object({
      email:    Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  },
  reset: {
    body: Joi.object({
      token:    Joi.string().required(),
      password: Joi.string().min(8).required(),
    }),
  },
};

router.post('/register', validate(schemas.register), async (req, res, next) => {
  try { sendCreated(res, await svc.registerUser(req.body), 'Registration successful'); }
  catch (e) { next(e); }
});

router.post('/login', validate(schemas.login), async (req, res, next) => {
  try { sendSuccess(res, await svc.loginUser(req.body), 'Login successful'); }
  catch (e) { next(e); }
});

router.post('/refresh', async (req, res, next) => {
  try { sendSuccess(res, await svc.refreshAccessToken(req.body.refreshToken), 'Token refreshed'); }
  catch (e) { next(e); }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try { await svc.logoutUser(req.user.id); sendSuccess(res, null, 'Logged out'); }
  catch (e) { next(e); }
});

router.post('/forgot-password', (req, res) => {
  sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
});

router.post('/reset-password', validate(schemas.reset), (req, res) => {
  sendSuccess(res, null, 'Password reset successful');
});

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

router.get('/me', authenticate, (req, res) => sendSuccess(res, req.user));

module.exports = router;
