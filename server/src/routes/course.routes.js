const router = require('express').Router();
const svc = require('../services/course.service');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');

router.get('/', async (req, res, next) => {
  try { const r = await svc.listCourses(req.query); sendPaginated(res, r.courses, r); }
  catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { sendSuccess(res, await svc.getCourseById(req.params.id, req.user?.id)); }
  catch (e) { next(e); }
});

router.post('/', authenticate, authorize('tutor', 'admin'), async (req, res, next) => {
  try { sendCreated(res, await svc.createCourse(req.body, req.user.id)); }
  catch (e) { next(e); }
});

router.put('/:id', authenticate, authorize('tutor', 'admin'), async (req, res, next) => {
  try { sendSuccess(res, await svc.updateCourse(req.params.id, req.body, req.user.id, req.user.role)); }
  catch (e) { next(e); }
});

router.post('/:id/enroll', authenticate, authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, await svc.enrollCourse(req.params.id, req.user.id), 'Enrolled successfully'); }
  catch (e) { next(e); }
});

router.post('/:id/lessons/:lessonId/complete', authenticate, authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, await svc.completeLesson(req.params.lessonId, req.user.id), 'Lesson completed'); }
  catch (e) { next(e); }
});

module.exports = router;
