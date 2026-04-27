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

// ── Notes — save/get per lesson ───────────────────────────────────────────────
router.put('/:id/lessons/:lessonId/notes', authenticate, authorize('learner'), async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const { notes } = req.body;
    await pool.query(
      `INSERT INTO lesson_progress (learner_id, lesson_id, notes)
       VALUES ($1,$2,$3)
       ON CONFLICT (learner_id, lesson_id)
       DO UPDATE SET notes = $3`,
      [req.user.id, req.params.lessonId, notes || '']
    );
    const { sendSuccess } = require('../utils/response');
    sendSuccess(res, null, 'Notes saved');
  } catch (e) { next(e); }
});

router.get('/:id/lessons/:lessonId/notes', authenticate, async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const { rows } = await pool.query(
      'SELECT notes FROM lesson_progress WHERE learner_id = $1 AND lesson_id = $2',
      [req.user.id, req.params.lessonId]
    );
    sendSuccess(res, { notes: rows[0]?.notes || '' });
  } catch (e) { next(e); }
});

// ── Course rating ─────────────────────────────────────────────────────────────
router.post('/:id/rate', authenticate, authorize('learner'), async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return next(new (require('../utils/errors').AppError)('Rating must be 1-5', 400));
    }
    // Upsert review
    await pool.query(
      `INSERT INTO reviews (reviewer_id, target_type, target_id, rating, comment)
       VALUES ($1,'course',$2,$3,$4)
       ON CONFLICT (reviewer_id, target_type, target_id)
       DO UPDATE SET rating=$3, comment=$4`,
      [req.user.id, req.params.id, rating, comment || '']
    );
    // Update course average rating
    await pool.query(
      `UPDATE courses SET
         rating = (SELECT AVG(rating) FROM reviews WHERE target_type='course' AND target_id=$1),
         total_reviews = (SELECT COUNT(*) FROM reviews WHERE target_type='course' AND target_id=$1)
       WHERE id = $1`,
      [req.params.id]
    );
    sendSuccess(res, null, 'Rating submitted');
  } catch (e) { next(e); }
});

// ── Certificate generation ────────────────────────────────────────────────────
router.post('/:id/certificate', authenticate, authorize('learner'), async (req, res, next) => {
  try {
    const { pool } = require('../config/db');
    const crypto = require('crypto');

    // Verify course is 100% complete
    const { rows: enroll } = await pool.query(
      'SELECT progress_pct FROM enrollments WHERE learner_id=$1 AND course_id=$2',
      [req.user.id, req.params.id]
    );
    if (!enroll.length) throw new (require('../utils/errors').AppError)('Not enrolled', 403);
    if (parseFloat(enroll[0].progress_pct) < 100) {
      throw new (require('../utils/errors').AppError)('Complete all lessons first', 400);
    }

    // Get course + user info
    const { rows: [course] } = await pool.query('SELECT title, subject FROM courses WHERE id=$1', [req.params.id]);
    const { rows: [user] }   = await pool.query('SELECT first_name, last_name FROM users WHERE id=$1', [req.user.id]);

    // Generate unique cert hash
    const certHash = crypto.createHash('sha256')
      .update(`${req.user.id}:${req.params.id}:${Date.now()}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    // Upsert certificate record
    await pool.query(
      `INSERT INTO certificates (learner_id, course_id, cert_hash)
       VALUES ($1,$2,$3)
       ON CONFLICT (learner_id, course_id) DO UPDATE SET cert_hash = EXCLUDED.cert_hash`,
      [req.user.id, req.params.id, certHash]
    );

    sendSuccess(res, {
      cert_hash:    certHash,
      learner_name: `${user.first_name} ${user.last_name}`,
      course_title: course.title,
      course_subject: course.subject,
      issued_at:    new Date().toISOString(),
    }, 'Certificate generated');
  } catch (e) { next(e); }
});

module.exports = router;
