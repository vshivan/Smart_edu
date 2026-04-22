const router = require('express').Router();
const ctrl = require('../controllers/ai.controller');
const { authorize } = require('../../../shared/middleware/auth');

router.post('/generate-course',  authorize('learner','admin'), ctrl.generateCourse);
router.post('/generate-quiz',    authorize('tutor','admin'),   ctrl.generateQuiz);
router.post('/chat',             authorize('learner'),         ctrl.chat);
router.post('/summarize',        authorize('learner'),         ctrl.summarize);
router.post('/recommendations',  authorize('learner'),         ctrl.recommendations);

module.exports = router;
