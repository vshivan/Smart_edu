const router = require('express').Router();
const ctrl = require('../controllers/course.controller');
const { authenticate, authorize } = require('../../../shared/middleware/auth');

router.get('/',    ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/',   authenticate, authorize('tutor','admin'), ctrl.create);
router.put('/:id', authenticate, authorize('tutor','admin'), ctrl.update);
router.post('/:id/enroll',   authenticate, authorize('learner'), ctrl.enroll);
router.post('/:id/lessons/:lessonId/complete', authenticate, authorize('learner'), ctrl.complete);

module.exports = router;
