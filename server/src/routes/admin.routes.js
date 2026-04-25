const router = require('express').Router();
const svc = require('../services/admin.service');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess, sendPaginated } = require('../utils/response');

const admin = [authenticate, authorize('admin')];

// Dashboard
router.get('/dashboard', ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.getDashboard()); } catch (e) { next(e); }
});

// Users
router.get('/users', ...admin, async (req, res, next) => {
  try { const r = await svc.getUsers(req.query); sendPaginated(res, r.users, r); } catch (e) { next(e); }
});
router.put('/users/:id/ban',  ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.banUser(req.params.id, req.body.reason, req.user.id)); } catch (e) { next(e); }
});
router.put('/users/:id/unban', ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.unbanUser(req.params.id, req.user.id)); } catch (e) { next(e); }
});
router.put('/users/:id/role', ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.changeUserRole(req.params.id, req.body.role, req.user.id)); } catch (e) { next(e); }
});

// Tutor verification
router.get('/tutors/pending',     ...admin, async (req, res, next) => {
  try { const r = await svc.getPendingTutors(req.query); sendPaginated(res, r.tutors, r); } catch (e) { next(e); }
});
router.put('/tutors/:id/approve', ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.approveTutor(req.params.id, req.user.id)); } catch (e) { next(e); }
});
router.put('/tutors/:id/reject',  ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.rejectTutor(req.params.id, req.body.reason, req.user.id)); } catch (e) { next(e); }
});

// Courses
router.get('/courses',             ...admin, async (req, res, next) => {
  try { const r = await svc.getAllCourses(req.query); sendPaginated(res, r.courses, r); } catch (e) { next(e); }
});
router.delete('/courses/:id',      ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.deleteCourse(req.params.id, req.user.id)); } catch (e) { next(e); }
});
router.put('/courses/:id/feature', ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.featureCourse(req.params.id, req.body.featured, req.user.id)); } catch (e) { next(e); }
});

// Analytics & Audit
router.get('/analytics', ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.getAnalytics(req.query.period)); } catch (e) { next(e); }
});
router.get('/audit-log', ...admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.getAuditLog(req.query)); } catch (e) { next(e); }
});

module.exports = router;
