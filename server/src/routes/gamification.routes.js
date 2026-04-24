const router = require('express').Router();
const svc = require('../services/gamification.service');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');

router.get('/profile', authenticate, authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, await svc.getGamificationProfile(req.user.id)); }
  catch (e) { next(e); }
});

router.get('/leaderboard', authenticate, async (req, res, next) => {
  try { sendSuccess(res, await svc.getLeaderboard(parseInt(req.query.limit) || 20)); }
  catch (e) { next(e); }
});

router.post('/streak', authenticate, authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, await svc.checkStreak(req.user.id)); }
  catch (e) { next(e); }
});

router.post('/xp', authenticate, async (req, res, next) => {
  try { sendSuccess(res, await svc.awardXP(req.user.id, req.body.amount, req.body.reason)); }
  catch (e) { next(e); }
});

module.exports = router;
