const router = require('express').Router();
const passport = require('passport');
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../../../shared/middleware/auth');
const validate = require('../../../shared/middleware/validate');
const Joi = require('joi');

const schemas = {
  register: { body: Joi.object({ email: Joi.string().email().required(), password: Joi.string().min(8).required(), first_name: Joi.string().required(), last_name: Joi.string().required(), role: Joi.string().valid('learner','tutor').default('learner') }) },
  login:    { body: Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() }) },
  reset:    { body: Joi.object({ token: Joi.string().required(), password: Joi.string().min(8).required() }) },
};

router.post('/register', validate(schemas.register), ctrl.register);
router.post('/login',    validate(schemas.login),    ctrl.login);
router.post('/refresh',  ctrl.refreshToken);
router.post('/logout',   authenticate, ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  validate(schemas.reset), ctrl.resetPassword);
router.get('/google', passport.authenticate('google', { scope: ['profile','email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }), ctrl.googleCallback);
router.get('/me', authenticate, ctrl.getMe);

module.exports = router;
