const pool = require('../config/db');
const { AppError } = require('../../../shared/utils/errors');
const paginate = require('../../../shared/utils/paginate');

const listCourses = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { subject, difficulty, search, is_free } = query;

  const conditions = ['c.is_published = true', 'c.is_deleted = false'];
  const params = [];
  let i = 1;

  if (subject)    { conditions.push(`c.subject ILIKE $${i++}`); params.push(`%${subject}%`); }
  if (difficulty) { conditions.push(`c.difficulty = $${i++}`);  params.push(difficulty); }
  if (is_free !== undefined) { conditions.push(`c.is_free = $${i++}`); params.push(is_free === 'true'); }
  if (search)     { conditions.push(`(c.title ILIKE $${i++} OR c.description ILIKE $${i++})`); params.push(`%${search}%`, `%${search}%`); i++; }

  const where = conditions.join(' AND ');

  const countResult = await pool.query(`SELECT COUNT(*) FROM courses c WHERE ${where}`, params);
  const total = parseInt(countResult.rows[0].count);

  const { rows } = await pool.query(
    `SELECT c.id, c.title, c.description, c.thumbnail_url, c.subject,
            c.difficulty, c.estimated_hours, c.price, c.is_free,
            c.rating, c.total_reviews, c.total_enrolled, c.tags,
            u.first_name || ' ' || u.last_name AS creator_name
     FROM courses c
     LEFT JOIN users u ON c.creator_id = u.id
     WHERE ${where}
     ORDER BY c.is_featured DESC, c.rating DESC, c.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    [...params, limit, offset]
  );

  return { courses: rows, total, page, limit };
};

const getCourseById = async (id, userId) => {
  const { rows } = await pool.query(
    `SELECT c.*, u.first_name || ' ' || u.last_name AS creator_name
     FROM courses c LEFT JOIN users u ON c.creator_id = u.id
     WHERE c.id = $1 AND c.is_deleted = false`,
    [id]
  );
  if (!rows.length) throw new AppError('Course not found', 404);

  const course = rows[0];

  // Check enrollment if user provided
  if (userId) {
    const enroll = await pool.query(
      'SELECT progress_pct FROM enrollments WHERE learner_id = $1 AND course_id = $2',
      [userId, id]
    );
    course.is_enrolled = enroll.rows.length > 0;
    course.progress_pct = enroll.rows[0]?.progress_pct || 0;
  }

  // Get modules
  const modules = await pool.query(
    `SELECT m.*, 
            json_agg(l ORDER BY l.order_index) AS lessons
     FROM course_modules m
     LEFT JOIN course_lessons l ON l.module_id = m.id
     WHERE m.course_id = $1
     GROUP BY m.id ORDER BY m.order_index`,
    [id]
  );
  course.modules = modules.rows;

  return course;
};

const createCourse = async (data, creatorId) => {
  const { title, description, subject, difficulty, estimated_hours, price, is_free, tags } = data;
  const { rows } = await pool.query(
    `INSERT INTO courses (title, description, subject, difficulty, estimated_hours, price, is_free, tags, creator_id, creator_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'tutor')
     RETURNING *`,
    [title, description, subject, difficulty, estimated_hours, price || 0, is_free ?? true, tags || [], creatorId]
  );
  return rows[0];
};

const updateCourse = async (id, data, userId, role) => {
  const { rows } = await pool.query('SELECT creator_id FROM courses WHERE id = $1', [id]);
  if (!rows.length) throw new AppError('Course not found', 404);
  if (role !== 'admin' && rows[0].creator_id !== userId) throw new AppError('Not authorized', 403);

  const fields = ['title','description','subject','difficulty','estimated_hours','price','is_free','tags','thumbnail_url'];
  const updates = [];
  const params = [];
  let i = 1;

  fields.forEach((f) => {
    if (data[f] !== undefined) { updates.push(`${f} = $${i++}`); params.push(data[f]); }
  });

  if (!updates.length) throw new AppError('No fields to update', 400);
  params.push(id);

  const { rows: updated } = await pool.query(
    `UPDATE courses SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
    params
  );
  return updated[0];
};

const enrollCourse = async (courseId, learnerId) => {
  const course = await pool.query('SELECT id, is_published FROM courses WHERE id = $1', [courseId]);
  if (!course.rows.length) throw new AppError('Course not found', 404);
  if (!course.rows[0].is_published) throw new AppError('Course not available', 400);

  const { rows } = await pool.query(
    `INSERT INTO enrollments (learner_id, course_id) VALUES ($1,$2)
     ON CONFLICT (learner_id, course_id) DO NOTHING RETURNING *`,
    [learnerId, courseId]
  );

  await pool.query('UPDATE courses SET total_enrolled = total_enrolled + 1 WHERE id = $1', [courseId]);
  return rows[0] || { message: 'Already enrolled' };
};

const completeLesson = async (lessonId, learnerId) => {
  const lesson = await pool.query('SELECT xp_reward, module_id FROM course_lessons WHERE id = $1', [lessonId]);
  if (!lesson.rows.length) throw new AppError('Lesson not found', 404);

  await pool.query(
    `INSERT INTO lesson_progress (learner_id, lesson_id, completed, completed_at)
     VALUES ($1,$2,true,NOW())
     ON CONFLICT (learner_id, lesson_id) DO UPDATE SET completed = true, completed_at = NOW()`,
    [learnerId, lessonId]
  );

  // Recalculate course progress
  const module = await pool.query('SELECT course_id FROM course_modules WHERE id = $1', [lesson.rows[0].module_id]);
  const courseId = module.rows[0].course_id;

  const progress = await pool.query(
    `SELECT 
       COUNT(l.id) FILTER (WHERE lp.completed = true) AS completed,
       COUNT(l.id) AS total
     FROM course_lessons l
     JOIN course_modules m ON l.module_id = m.id
     LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.learner_id = $1
     WHERE m.course_id = $2`,
    [learnerId, courseId]
  );

  const { completed, total } = progress.rows[0];
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  await pool.query(
    `UPDATE enrollments SET progress_pct = $1, last_lesson_id = $2
     WHERE learner_id = $3 AND course_id = $4`,
    [pct, lessonId, learnerId, courseId]
  );

  return { xp_earned: lesson.rows[0].xp_reward, progress_pct: pct, course_completed: pct === 100 };
};

module.exports = { listCourses, getCourseById, createCourse, updateCourse, enrollCourse, completeLesson };
