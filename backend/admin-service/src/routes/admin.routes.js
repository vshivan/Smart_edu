const router = require('express').Router();
const svc = require('../services/admin.service');
const { authenticate, authorize } = require('../../../shared/middleware/auth');
const { sendSuccess, sendPaginated } = require('../../../shared/utils/response');

const admin = authorize('admin');

// Dashboard
router.get('/dashboard', authenticate, admin, async (req, res, next) => {
  try { sendSuccess(res, await svc.getDashboard()); } catch(e){next(e);}
});

// Users
router.get('/users', authenticate, admin, async (req, res, next) => {
  try { const r = await svc.getUsers(req.query); sendPaginated(res, r.users, r); } catch(e){next(e);}
});
router.put('/users/:id/ban',    authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.banUser(req.params.id, req.body.reason, req.user.id)); } catch(e){next(e);} });
router.put('/users/:id/unban',  authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.unbanUser(req.params.id, req.user.id)); } catch(e){next(e);} });
router.put('/users/:id/role',   authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.changeUserRole(req.params.id, req.body.role, req.user.id)); } catch(e){next(e);} });

// Tutor verification
router.get('/tutors/pending',       authenticate, admin, async (req, res, next) => { try { const r = await svc.getPendingTutors(req.query); sendPaginated(res, r.tutors, r); } catch(e){next(e);} });
router.put('/tutors/:id/approve',   authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.approveTutor(req.params.id, req.user.id)); } catch(e){next(e);} });
router.put('/tutors/:id/reject',    authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.rejectTutor(req.params.id, req.body.reason, req.user.id)); } catch(e){next(e);} });

// Courses
router.get('/courses',              authenticate, admin, async (req, res, next) => { try { const r = await svc.getAllCourses(req.query); sendPaginated(res, r.courses, r); } catch(e){next(e);} });
router.delete('/courses/:id',       authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.deleteCourse(req.params.id, req.user.id)); } catch(e){next(e);} });
router.put('/courses/:id/feature',  authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.featureCourse(req.params.id, req.body.featured, req.user.id)); } catch(e){next(e);} });

// Analytics
router.get('/analytics', authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.getAnalytics(req.query.period)); } catch(e){next(e);} });
router.get('/audit-log', authenticate, admin, async (req, res, next) => { try { sendSuccess(res, await svc.getAuditLog(req.query)); } catch(e){next(e);} });

module.exports = router;
