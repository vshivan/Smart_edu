const router = require('express').Router();
const svc = require('../services/quiz.service');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess } = require('../utils/response');

router.get('/:id', authenticate, async (req, res, next) => {
  try { sendSuccess(res, await svc.getQuiz(req.params.id, req.user.id)); }
  catch (e) { next(e); }
});

router.post('/:id/attempt', authenticate, authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, await svc.submitQuiz(req.params.id, req.user.id, req.body)); }
  catch (e) { next(e); }
});

router.get('/attempts/:attemptId', authenticate, async (req, res, next) => {
  try { sendSuccess(res, await svc.getAttemptResult(req.params.attemptId, req.user.id)); }
  catch (e) { next(e); }
});

module.exports = router;
