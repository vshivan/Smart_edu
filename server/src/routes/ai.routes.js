const router = require('express').Router();
const svc    = require('../services/ai.service');
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess, sendCreated } = require('../utils/response');
const { AppError } = require('../utils/errors');

// All AI routes require authentication (applied in index.js via authenticate middleware)

// ── POST /ai/generate-course ──────────────────────────────────────────────────
router.post('/generate-course', authorize('learner', 'admin'), async (req, res, next) => {
  try {
    sendCreated(res, await svc.generateCourse(req.body), 'Course outline generated');
  } catch (e) { next(e); }
});

// ── POST /ai/generate-and-save ────────────────────────────────────────────────
// Full flow: generate course outline + save to DB with modules/lessons + auto quizzes + enroll
router.post('/generate-and-save', authorize('learner', 'admin'), async (req, res, next) => {
  try {
    const { subject, topics = [], difficulty = 'beginner', estimated_hours = 10 } = req.body;
    if (!subject) throw new AppError('Subject is required', 400);

    // 1. Generate course outline with Gemini
    const outline = await svc.generateCourse({ subject, topics, difficulty, estimated_hours, audience: 'general learners' });

    // 2. Save course to DB
    const { rows: [course] } = await pool.query(
      `INSERT INTO courses (title, description, subject, difficulty, estimated_hours, is_free, is_published, tags, creator_id, creator_type)
       VALUES ($1,$2,$3,$4,$5,true,true,$6,$7,'ai')
       RETURNING *`,
      [outline.title, outline.description, subject, difficulty, estimated_hours, outline.tags || [], req.user.id]
    );

    // 3. Save modules + lessons
    let totalLessons = 0;
    for (let mi = 0; mi < (outline.modules || []).length; mi++) {
      const mod = outline.modules[mi];

      const { rows: [module] } = await pool.query(
        `INSERT INTO course_modules (course_id, title, description, order_index, is_locked)
         VALUES ($1,$2,$3,$4,false) RETURNING id`,
        [course.id, mod.title, mod.description || '', mi]
      );

      for (let li = 0; li < (mod.lessons || []).length; li++) {
        const lesson = mod.lessons[li];
        await pool.query(
          `INSERT INTO course_lessons (module_id, title, content_type, content_text, duration_min, order_index, xp_reward)
           VALUES ($1,$2,'text',$3,$4,$5,$6)`,
          [
            module.id,
            lesson.title,
            `This lesson covers: ${lesson.title}. ${(lesson.key_concepts || []).join(', ')}`,
            lesson.estimated_minutes || lesson.duration_min || 10,
            li,
            lesson.xp_reward || 10,
          ]
        );
        totalLessons++;
      }

      // 4. Auto-generate a quiz for each module (non-blocking — don't fail if quiz gen fails)
      try {
        const quizData = await svc.generateQuiz({
          topic: mod.title,
          difficulty,
          num_questions: 5,
          course_context: `Course: ${outline.title}. Module: ${mod.title}`,
        });

        const { rows: [quiz] } = await pool.query(
          `INSERT INTO quizzes (course_id, title, quiz_type, pass_score, max_attempts, xp_reward, xp_perfect)
           VALUES ($1,$2,'mcq',70,3,50,100) RETURNING id`,
          [course.id, quizData.title || `${mod.title} Quiz`]
        );

        for (let qi = 0; qi < (quizData.questions || []).length; qi++) {
          const q = quizData.questions[qi];
          await pool.query(
            `INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, explanation, order_index, points)
             VALUES ($1,$2,'mcq',$3,$4,$5,$6,10)`,
            [
              quiz.id,
              q.question,
              JSON.stringify(q.options || []),
              q.correct_answer || 'A',
              q.explanation || '',
              qi,
            ]
          );
        }
      } catch (quizErr) {
        // Quiz generation failure is non-fatal
        console.warn(`Quiz gen failed for module ${mod.title}:`, quizErr.message);
      }
    }

    // 5. Auto-enroll the learner
    await pool.query(
      `INSERT INTO enrollments (learner_id, course_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, course.id]
    );

    // 6. Award XP for generating a course
    await pool.query(
      `UPDATE learner_profiles SET xp_total = xp_total + 25 WHERE user_id = $1`,
      [req.user.id]
    );

    sendCreated(res, {
      course,
      modules_count: outline.modules?.length || 0,
      lessons_count: totalLessons,
      quizzes_count: outline.modules?.length || 0,
      enrolled: true,
      xp_earned: 25,
      message: `Course created with ${outline.modules?.length} modules, ${totalLessons} lessons, and ${outline.modules?.length} quizzes!`,
    }, 'Course generated and saved!');

  } catch (e) { next(e); }
});

// ── POST /ai/generate-quiz ────────────────────────────────────────────────────
router.post('/generate-quiz', authorize('tutor', 'admin'), async (req, res, next) => {
  try { sendCreated(res, await svc.generateQuiz(req.body), 'Quiz generated'); }
  catch (e) { next(e); }
});

// ── POST /ai/chat ─────────────────────────────────────────────────────────────
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

// ── POST /ai/summarize ────────────────────────────────────────────────────────
router.post('/summarize', authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, { summary: await svc.summarizeLesson(req.body) }); }
  catch (e) { next(e); }
});

// ── POST /ai/recommendations ──────────────────────────────────────────────────
router.post('/recommendations', authorize('learner'), async (req, res, next) => {
  try { sendSuccess(res, await svc.getRecommendations({ ...req.body, level: req.user.level })); }
  catch (e) { next(e); }
});

module.exports = router;
