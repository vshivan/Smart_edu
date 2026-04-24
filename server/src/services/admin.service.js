const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const paginate = require('../utils/paginate');

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const getDashboard = async () => {
  const [users, courses, revenue, engagement] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE role = 'learner') AS learners,
        COUNT(*) FILTER (WHERE role = 'tutor')   AS tutors,
        COUNT(*) FILTER (WHERE last_login_at > NOW() - INTERVAL '7 days') AS active_7d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS new_30d
      FROM users WHERE is_banned = false`),

    pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE is_published = true) AS published,
        COUNT(*) FILTER (WHERE creator_type = 'ai') AS ai_generated,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS new_30d
      FROM courses WHERE is_deleted = false`),

    pool.query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_revenue,
        COALESCE(SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) AS revenue_30d,
        COALESCE(SUM(platform_fee), 0) AS platform_earnings
      FROM tutor_sessions WHERE status = 'completed'`),

    pool.query(`
      SELECT
        COALESCE(AVG(progress_pct), 0) AS avg_completion,
        COUNT(*) AS total_enrollments,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL) AS completed_enrollments
      FROM enrollments`),
  ]);

  return {
    users:      users.rows[0],
    courses:    courses.rows[0],
    revenue:    revenue.rows[0],
    engagement: engagement.rows[0],
  };
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
const getUsers = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { role, search, is_banned } = query;

  const conditions = ['1=1'];
  const params = [];
  let i = 1;

  if (role) {
    conditions.push('role = $' + i);
    params.push(role);
    i++;
  }
  if (is_banned !== undefined) {
    conditions.push('is_banned = $' + i);
    params.push(is_banned === 'true');
    i++;
  }
  if (search) {
    conditions.push('(email ILIKE $' + i + ' OR first_name ILIKE $' + (i + 1) + ' OR last_name ILIKE $' + (i + 2) + ')');
    params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
    i += 3;
  }

  const where = conditions.join(' AND ');
  const countRes = await pool.query('SELECT COUNT(*) FROM users WHERE ' + where, params);
  const { rows } = await pool.query(
    'SELECT id, email, first_name, last_name, role, is_active, is_banned, ban_reason, last_login_at, created_at' +
    ' FROM users WHERE ' + where +
    ' ORDER BY created_at DESC LIMIT $' + i + ' OFFSET $' + (i + 1),
    [...params, limit, offset]
  );

  return { users: rows, total: parseInt(countRes.rows[0].count), page, limit };
};

const banUser = async (userId, reason, adminId) => {
  const { rows } = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (!rows.length) throw new AppError('User not found', 404);
  if (rows[0].role === 'admin') throw new AppError('Cannot ban an admin', 403);

  await pool.query(
    'UPDATE users SET is_banned = true, ban_reason = $1, banned_at = NOW(), banned_by = $2 WHERE id = $3',
    [reason, adminId, userId]
  );
  await logAdminAction(adminId, 'ban_user', 'user', userId, { reason });
  return { message: 'User banned successfully' };
};

const unbanUser = async (userId, adminId) => {
  await pool.query('UPDATE users SET is_banned = false, ban_reason = NULL, banned_at = NULL WHERE id = $1', [userId]);
  await logAdminAction(adminId, 'unban_user', 'user', userId, {});
  return { message: 'User unbanned successfully' };
};

const changeUserRole = async (userId, role, adminId) => {
  if (!['learner', 'tutor', 'admin'].includes(role)) throw new AppError('Invalid role', 400);
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
  await logAdminAction(adminId, 'change_role', 'user', userId, { new_role: role });
  return { message: 'Role updated to ' + role };
};

// ─── TUTOR VERIFICATION ──────────────────────────────────────────────────────
const getPendingTutors = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT tp.*, u.email, u.first_name, u.last_name, u.avatar_url,
            json_agg(td) AS documents
     FROM tutor_profiles tp
     JOIN users u ON tp.user_id = u.id
     LEFT JOIN tutor_documents td ON td.tutor_id = tp.id
     WHERE tp.verification_status = 'pending'
     GROUP BY tp.id, u.email, u.first_name, u.last_name, u.avatar_url
     ORDER BY tp.created_at ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const count = await pool.query("SELECT COUNT(*) FROM tutor_profiles WHERE verification_status = 'pending'");
  return { tutors: rows, total: parseInt(count.rows[0].count), page, limit };
};

const approveTutor = async (tutorId, adminId) => {
  await pool.query(
    "UPDATE tutor_profiles SET verification_status = 'approved', verified_at = NOW(), verified_by = $1 WHERE id = $2",
    [adminId, tutorId]
  );
  await logAdminAction(adminId, 'approve_tutor', 'tutor', tutorId, {});
  return { message: 'Tutor approved' };
};

const rejectTutor = async (tutorId, reason, adminId) => {
  await pool.query(
    "UPDATE tutor_profiles SET verification_status = 'rejected', rejection_reason = $1 WHERE id = $2",
    [reason, tutorId]
  );
  await logAdminAction(adminId, 'reject_tutor', 'tutor', tutorId, { reason });
  return { message: 'Tutor rejected' };
};

// ─── COURSE MANAGEMENT ───────────────────────────────────────────────────────
const getAllCourses = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT c.*, u.first_name || ' ' || u.last_name AS creator_name
     FROM courses c LEFT JOIN users u ON c.creator_id = u.id
     WHERE c.is_deleted = false
     ORDER BY c.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const count = await pool.query('SELECT COUNT(*) FROM courses WHERE is_deleted = false');
  return { courses: rows, total: parseInt(count.rows[0].count), page, limit };
};

const deleteCourse = async (courseId, adminId) => {
  await pool.query('UPDATE courses SET is_deleted = true WHERE id = $1', [courseId]);
  await logAdminAction(adminId, 'delete_course', 'course', courseId, {});
  return { message: 'Course deleted' };
};

const featureCourse = async (courseId, featured, adminId) => {
  await pool.query('UPDATE courses SET is_featured = $1 WHERE id = $2', [featured, courseId]);
  await logAdminAction(adminId, featured ? 'feature_course' : 'unfeature_course', 'course', courseId, {});
  return { message: 'Course ' + (featured ? 'featured' : 'unfeatured') };
};

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
const getAnalytics = async (period) => {
  const interval = period === '7d' ? '7 days' : period === '90d' ? '90 days' : '30 days';

  const [signups, enrollments, quizStats, revenue] = await Promise.all([
    pool.query(
      "SELECT DATE(created_at) AS date, COUNT(*) AS count FROM users" +
      " WHERE created_at > NOW() - INTERVAL '" + interval + "'" +
      " GROUP BY DATE(created_at) ORDER BY date"
    ),
    pool.query(
      "SELECT DATE(enrolled_at) AS date, COUNT(*) AS count FROM enrollments" +
      " WHERE enrolled_at > NOW() - INTERVAL '" + interval + "'" +
      " GROUP BY DATE(enrolled_at) ORDER BY date"
    ),
    pool.query(
      "SELECT AVG(score) AS avg_score, COUNT(*) AS total_attempts," +
      " COUNT(*) FILTER (WHERE passed = true) AS passed" +
      " FROM quiz_attempts WHERE attempted_at > NOW() - INTERVAL '" + interval + "'"
    ),
    pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total," +
      " COALESCE(SUM(platform_fee), 0) AS platform_fee" +
      " FROM tutor_sessions WHERE status = 'completed'" +
      " AND created_at > NOW() - INTERVAL '" + interval + "'"
    ),
  ]);

  return {
    signups:     signups.rows,
    enrollments: enrollments.rows,
    quiz_stats:  quizStats.rows[0],
    revenue:     revenue.rows[0],
  };
};

// ─── AUDIT LOG ───────────────────────────────────────────────────────────────
const logAdminAction = async (adminId, action, targetType, targetId, details) => {
  await pool.query(
    'INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details) VALUES ($1,$2,$3,$4,$5)',
    [adminId, action, targetType, targetId, JSON.stringify(details)]
  );
};

const getAuditLog = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { rows } = await pool.query(
    `SELECT al.*, u.first_name || ' ' || u.last_name AS admin_name
     FROM admin_audit_log al JOIN users u ON al.admin_id = u.id
     ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

module.exports = {
  getDashboard, getUsers, banUser, unbanUser, changeUserRole,
  getPendingTutors, approveTutor, rejectTutor,
  getAllCourses, deleteCourse, featureCourse,
  getAnalytics, getAuditLog,
};
