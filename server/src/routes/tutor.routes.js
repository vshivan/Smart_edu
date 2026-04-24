const router = require('express').Router();
const svc = require('../services/tutor.service');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try { const r = await svc.listTutors(req.query); sendPaginated(res, r.tutors, r); }
  catch (e) { next(e); }
});

// ── Tutor-specific routes (MUST come before /:id to avoid conflicts) ──────────
router.put('/availability', authenticate, authorize('tutor'), async (req, res, next) => {
  try { sendSuccess(res, await svc.updateAvailability(req.user.id, req.body.is_available)); }
  catch (e) { next(e); }
});

router.post('/slots', authenticate, authorize('tutor'), async (req, res, next) => {
  try { sendCreated(res, await svc.addSlots(req.user.id, req.body.slots)); }
  catch (e) { next(e); }
});

router.get('/earnings', authenticate, authorize('tutor'), async (req, res, next) => {
  try { sendSuccess(res, await svc.getTutorEarnings(req.user.id)); }
  catch (e) { next(e); }
});

router.put('/sessions/:id/status', authenticate, authorize('tutor'), async (req, res, next) => {
  try { sendSuccess(res, await svc.updateSessionStatus(req.params.id, req.user.id, req.body.status)); }
  catch (e) { next(e); }
});

// ── Learner actions ───────────────────────────────────────────────────────────
router.post('/sessions/book', authenticate, authorize('learner'), async (req, res, next) => {
  try { sendCreated(res, await svc.bookSession(req.user.id, req.body), 'Session booked'); }
  catch (e) { next(e); }
});

// ── Dynamic routes (MUST come last) ───────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try { sendSuccess(res, await svc.getTutorProfile(req.params.id)); }
  catch (e) { next(e); }
});

router.get('/:id/slots', authenticate, async (req, res, next) => {
  try { sendSuccess(res, await svc.getAvailableSlots(req.params.id, req.query.date)); }
  catch (e) { next(e); }
});

module.exports = router;
