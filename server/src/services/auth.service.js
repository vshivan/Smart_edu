const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const { createClient } = require('redis');

let redis;
const getRedis = async () => {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  }
  return redis;
};

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  return {
    accessToken:  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }),
    refreshToken: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }),
  };
};

const registerUser = async ({ email, password, first_name, last_name, role = 'learner' }) => {
  const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length) throw new AppError('Email already registered', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const id = uuidv4();

  const { rows } = await pool.query(
    `INSERT INTO users (id, email, password_hash, first_name, last_name, role)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, email, first_name, last_name, role`,
    [id, email, password_hash, first_name, last_name, role]
  );

  const user = rows[0];

  if (role === 'learner') {
    await pool.query('INSERT INTO learner_profiles (user_id) VALUES ($1)', [id]);
  } else if (role === 'tutor') {
    await pool.query('INSERT INTO tutor_profiles (user_id) VALUES ($1)', [id]);
  }

  const tokens = generateTokens(user);
  const r = await getRedis();
  await r.setEx(`session:${id}`, 7 * 86400, tokens.refreshToken);

  return { user, ...tokens };
};

const loginUser = async ({ email, password }) => {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, first_name, last_name, role,
            is_active, is_banned, ban_reason
     FROM users WHERE email = $1`,
    [email]
  );
  const user = rows[0];
  if (!user) throw new AppError('Invalid email or password', 401);
  if (user.is_banned)  throw new AppError(`Account suspended: ${user.ban_reason || 'Contact support'}`, 403);
  if (!user.is_active) throw new AppError('Please verify your email first', 403);
  if (!user.password_hash) throw new AppError('Please sign in with Google', 400);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  const tokens = generateTokens(user);
  const r = await getRedis();
  await r.setEx(`session:${user.id}`, 7 * 86400, tokens.refreshToken);

  const { password_hash, ...safeUser } = user;
  return { user: safeUser, ...tokens };
};

const findOrCreateGoogleUser = async (profile) => {
  const email    = profile.emails[0].value;
  const googleId = profile.id;

  let { rows } = await pool.query(
    'SELECT id, email, first_name, last_name, role FROM users WHERE google_id = $1 OR email = $2',
    [googleId, email]
  );

  if (!rows.length) {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO users (id, email, google_id, first_name, last_name, avatar_url, role, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,'learner',true)
       RETURNING id, email, first_name, last_name, role`,
      [id, email, googleId, profile.name.givenName, profile.name.familyName, profile.photos?.[0]?.value]
    );
    rows = result.rows;
    await pool.query('INSERT INTO learner_profiles (user_id) VALUES ($1)', [id]);
  } else if (!rows[0].google_id) {
    await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, rows[0].id]);
  }

  return rows[0];
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError('No refresh token', 401);
  let decoded;
  try { decoded = jwt.verify(refreshToken, process.env.JWT_SECRET); }
  catch { throw new AppError('Invalid refresh token', 401); }

  const r = await getRedis();
  const stored = await r.get(`session:${decoded.id}`);
  if (stored !== refreshToken) throw new AppError('Session expired, please login again', 401);

  const { rows } = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.id]);
  if (!rows.length) throw new AppError('User not found', 404);

  const tokens = generateTokens(rows[0]);
  await r.setEx(`session:${rows[0].id}`, 7 * 86400, tokens.refreshToken);
  return tokens;
};

const logoutUser = async (userId) => {
  const r = await getRedis();
  await r.del(`session:${userId}`);
};

module.exports = {
  registerUser, loginUser, findOrCreateGoogleUser,
  refreshAccessToken, logoutUser, generateTokens,
};
