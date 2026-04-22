const svc = require('../services/auth.service');
const { sendSuccess, sendCreated } = require('../../../shared/utils/response');

const register = async (req, res, next) => {
  try { sendCreated(res, await svc.registerUser(req.body), 'Registration successful'); }
  catch (e) { next(e); }
};

const login = async (req, res, next) => {
  try { sendSuccess(res, await svc.loginUser(req.body), 'Login successful'); }
  catch (e) { next(e); }
};

const googleCallback = (req, res, next) => {
  try {
    const tokens = svc.generateTokens(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${tokens.accessToken}&refresh=${tokens.refreshToken}`);
  } catch (e) { next(e); }
};

const refreshToken = async (req, res, next) => {
  try { sendSuccess(res, await svc.refreshAccessToken(req.body.refreshToken), 'Token refreshed'); }
  catch (e) { next(e); }
};

const logout = async (req, res, next) => {
  try { await svc.logoutUser(req.user.id); sendSuccess(res, null, 'Logged out'); }
  catch (e) { next(e); }
};

const forgotPassword = async (req, res, next) => {
  try {
    // TODO: generate reset token, send email
    sendSuccess(res, null, 'If that email exists, a reset link has been sent.');
  } catch (e) { next(e); }
};

const resetPassword = async (req, res, next) => {
  try {
    // TODO: verify token, update password_hash
    sendSuccess(res, null, 'Password reset successful');
  } catch (e) { next(e); }
};

const getMe = (req, res) => sendSuccess(res, req.user);

module.exports = { register, login, googleCallback, refreshToken, logout, forgotPassword, resetPassword, getMe };
