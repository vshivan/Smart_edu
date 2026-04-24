const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const paginate = require('../utils/paginate');
const { PLATFORM_FEE_PERCENT } = require('../constants');

const listTutors = async (query) => {
  const { page, limit, offset } = paginate(query);
  const { subject, min_rating, max_rate, search } = query;

  const conditions = ["tp.verification_status = 'approved'", 'tp.is_available = true'];
  const params = [];
  let i = 1;

  if (subject) {
    conditions.push('$' + i + ' = ANY(tp.skills)');
    params.push(subject);
    i++;
  }
  if (min_rating) {
    conditions.push('tp.rating >= $' + i);
    params.push(parseFloat(min_rating));
    i++;
  }
  if (max_rate) {
    conditions.push('tp.hourly_rate <= $' + i);
    params.push(parseFloat(max_rate));
    i++;
  }
  if (search) {
    conditions.push('(u.first_name ILIKE $' + i + ' OR u.last_name ILIKE $' + (i + 1) + ' OR tp.bio ILIKE $' + (i + 2) + ')');
    params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
    i += 3;
  }

  const where = conditions.join(' AND ');
  const limitIdx  = i;
  const offsetIdx = i + 1;

  const { rows } = await pool.query(
    'SELECT tp.id, tp.skills, tp.experience_years, tp.hourly_rate, tp.rating,' +
    '       tp.total_reviews, tp.total_sessions, tp.bio,' +
    '       u.id AS user_id, u.first_name, u.last_name, u.avatar_url' +
    ' FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id' +
    ' WHERE ' + where +
    ' ORDER BY tp.rating DESC, tp.total_sessions DESC' +
    ' LIMIT $' + limitIdx + ' OFFSET $' + offsetIdx,
    [...params, limit, offset]
  );

  const count = await pool.query(
    'SELECT COUNT(*) FROM tutor_profiles tp JOIN users u ON tp.user_id = u.id WHERE ' + where,
    params
  );
  return { tutors: rows, total: parseInt(count.rows[0].count), page, limit };
};

const getTutorProfile = async (tutorId) => {
  const { rows } = await pool.query(
    `SELECT tp.*, u.first_name, u.last_name, u.avatar_url, u.email,
            json_agg(DISTINCT td) FILTER (WHERE td.id IS NOT NULL) AS documents
     FROM tutor_profiles tp
     JOIN users u ON tp.user_id = u.id
     LEFT JOIN tutor_documents td ON td.tutor_id = tp.id
     WHERE tp.id = $1 GROUP BY tp.id, u.first_name, u.last_name, u.avatar_url, u.email`,
    [tutorId]
  );
  if (!rows.length) throw new AppError('Tutor not found', 404);
  return rows[0];
};

const updateAvailability = async (userId, is_available) => {
  const { rows } = await pool.query(
    'UPDATE tutor_profiles SET is_available = $1 WHERE user_id = $2 RETURNING id, is_available',
    [is_available, userId]
  );
  if (!rows.length) throw new AppError('Tutor profile not found', 404);
  return rows[0];
};

const addSlots = async (userId, slots) => {
  const { rows: profile } = await pool.query('SELECT id FROM tutor_profiles WHERE user_id = $1', [userId]);
  if (!profile.length) throw new AppError('Tutor profile not found', 404);
  const tutorId = profile[0].id;

  const inserted = [];
  for (const slot of slots) {
    const { rows } = await pool.query(
      'INSERT INTO tutor_slots (tutor_id, slot_start, slot_end) VALUES ($1,$2,$3) RETURNING *',
      [tutorId, slot.start, slot.end]
    );
    inserted.push(rows[0]);
  }
  return inserted;
};

const getAvailableSlots = async (tutorId, date) => {
  const start = date ? new Date(date) : new Date();
  const end   = new Date(start);
  end.setDate(end.getDate() + 14);

  const { rows } = await pool.query(
    `SELECT * FROM tutor_slots
     WHERE tutor_id = $1 AND is_booked = false
       AND slot_start >= $2 AND slot_start <= $3
     ORDER BY slot_start`,
    [tutorId, start, end]
  );
  return rows;
};

const bookSession = async (learnerId, { tutor_id, slot_id, subject, notes }) => {
  const slot = await pool.query(
    'SELECT * FROM tutor_slots WHERE id = $1 AND is_booked = false FOR UPDATE',
    [slot_id]
  );
  if (!slot.rows.length) throw new AppError('Slot not available', 409);

  const tutorProfile = await pool.query(
    'SELECT user_id, hourly_rate FROM tutor_profiles WHERE id = $1',
    [tutor_id]
  );
  if (!tutorProfile.rows.length) throw new AppError('Tutor not found', 404);

  const { hourly_rate, user_id: tutorUserId } = tutorProfile.rows[0];
  const amount        = parseFloat(hourly_rate);
  const platformFee   = parseFloat((amount * PLATFORM_FEE_PERCENT / 100).toFixed(2));
  const tutorEarnings = parseFloat((amount - platformFee).toFixed(2));

  await pool.query('UPDATE tutor_slots SET is_booked = true WHERE id = $1', [slot_id]);

  const { rows } = await pool.query(
    `INSERT INTO tutor_sessions
       (tutor_id, learner_id, slot_id, subject, scheduled_at, duration_min, amount, platform_fee, tutor_earnings, learner_notes)
     VALUES ($1,$2,$3,$4,$5,60,$6,$7,$8,$9) RETURNING *`,
    [tutorUserId, learnerId, slot_id, subject, slot.rows[0].slot_start, amount, platformFee, tutorEarnings, notes]
  );
  return rows[0];
};

const updateSessionStatus = async (sessionId, tutorId, status) => {
  const { rows } = await pool.query(
    `UPDATE tutor_sessions SET status = $1, updated_at = NOW()
     WHERE id = $2 AND tutor_id = $3 RETURNING *`,
    [status, sessionId, tutorId]
  );
  if (!rows.length) throw new AppError('Session not found or unauthorized', 404);
  return rows[0];
};

const getTutorEarnings = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(tutor_earnings), 0) AS total_earnings,
       COALESCE(SUM(tutor_earnings) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) AS earnings_30d,
       COUNT(*) AS total_sessions,
       COUNT(*) FILTER (WHERE status = 'completed') AS completed_sessions,
       json_agg(json_build_object(
         'id', id, 'subject', subject, 'scheduled_at', scheduled_at,
         'status', status, 'amount', amount, 'tutor_earnings', tutor_earnings
       ) ORDER BY scheduled_at DESC) AS recent_sessions
     FROM tutor_sessions WHERE tutor_id = $1`,
    [userId]
  );
  return rows[0];
};

module.exports = {
  listTutors, getTutorProfile, updateAvailability, addSlots,
  getAvailableSlots, bookSession, updateSessionStatus, getTutorEarnings,
};
