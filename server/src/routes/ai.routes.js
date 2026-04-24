const router = require('express').Router();
const svc = require('../services/ai.service');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess, sendCreated } = require('../utils/response');

// All AI routes require authentication (applied in index.js)
router.post('/generate-course', authorize('learner', 'admin'), async (req, res, next) => {
  try { sendCreated(res, await svc.generateCourse(req.body), 'Course outline generated'); }
  catch (e) { next(e); }
});

router.post('/generate-quiz', authorize('tutor', 'admin'), async (req, res, next) => {
  try { sendCreated(res, await svc.generateQuiz(req.body), 'Quiz generated'); }
  catch (e) { next(e); }
});

router.post('/chat', authorize('learner'), async (req, res, next) => {
  try {
    sendSuccess(res, await svc.chat({
      ...req.body,
      learner_id:   req.user.id,
      learner_name: req.user.first_name || 'Learner',
      level:        req.user.level || 1,
    }));
  } catch (e) { next(e); }
});

router.post('/summarize', authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, { summary: await svc.summarizeLesson(req.body) }); }
  catch (e) { next(e); }
});

router.post('/recommendations', authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, await svc.getRecommendations({ ...req.body, level: req.user.level })); }
  catch (e) { next(e); }
});

module.exports = router;
