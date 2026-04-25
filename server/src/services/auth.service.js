const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./email.service');
const { createClient } = require('redis');

const RESET_TOKEN_EXPIRY_MINUTES = 15;

// ─── Redis ───────────────────────────────────────────────────────────────────
let redis;
const getRedis = async () => {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  }
  return redis;
};

// ─── Token helpers ───────────────────────────────────────────────────────────

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  return {
    accessToken:  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }),
    refreshToken: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }),
  };
};

/** SHA-256 hash of a raw token — what we store in the DB */
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

// ─── Register ────────────────────────────────────────────────────────────────

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

  // Send welcome email — non-blocking, failure doesn't break registration
  sendWelcomeEmail(email, first_name).catch(() => {});

  return { user, ...tokens };
};

// ─── Login ───────────────────────────────────────────────────────────────────

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

// ─── Google OAuth ────────────────────────────────────────────────────────────

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
    // Welcome email for new Google sign-ups
    sendWelcomeEmail(email, profile.name.givenName).catch(() => {});
  } else if (!rows[0].google_id) {
    await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, rows[0].id]);
  }

  return rows[0];
};

// ─── Token refresh ───────────────────────────────────────────────────────────

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

// ─── Logout ──────────────────────────────────────────────────────────────────

const logoutUser = async (userId) => {
  const r = await getRedis();
  await r.del(`session:${userId}`);
};

// ─── Forgot Password ─────────────────────────────────────────────────────────

/**
 * Generate a secure reset token, store its hash in the DB, send email.
 * Always returns the same success message regardless of whether the email
 * exists — prevents user enumeration attacks.
 */
const forgotPassword = async (email) => {
  const { rows } = await pool.query(
    'SELECT id, first_name, email FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  // Silently succeed if email not found — don't leak user existence
  if (!rows.length) return;

  const user = rows[0];

  // Invalidate any existing unused tokens for this user
  await pool.query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [user.id]
  );

  // Generate a cryptographically secure random token (32 bytes = 64 hex chars)
  const rawToken  = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, tokenHash, expiresAt]
  );

  // Send email — non-blocking so DB transaction isn't held open
  await sendPasswordResetEmail(user.email, user.first_name, rawToken);
};

// ─── Reset Password ──────────────────────────────────────────────────────────

/**
 * Verify the reset token, update the password, invalidate the token,
 * and invalidate all active sessions (force re-login everywhere).
 */
const resetPassword = async (rawToken, newPassword) => {
  if (!rawToken)    throw new AppError('Reset token is required', 400);
  if (!newPassword) throw new AppError('New password is required', 400);

  const tokenHash = hashToken(rawToken);

  // Find a valid, unused, non-expired token
  const { rows } = await pool.query(
    `SELECT prt.id, prt.user_id, u.email, u.first_name
     FROM password_reset_tokens prt
     JOIN users u ON prt.user_id = u.id
     WHERE prt.token_hash = $1
       AND prt.used_at IS NULL
       AND prt.expires_at > NOW()`,
    [tokenHash]
  );

  if (!rows.length) {
    throw new AppError('Reset link is invalid or has expired. Please request a new one.', 400);
  }

  const { id: tokenId, user_id, email } = rows[0];

  // Hash the new password
  const password_hash = await bcrypt.hash(newPassword, 12);

  // Update password and mark token as used — both in one transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, user_id]
    );

    await client.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
      [tokenId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Invalidate all active sessions (force re-login on all devices)
  const r = await getRedis();
  await r.del(`session:${user_id}`);
};

module.exports = {
  registerUser,
  loginUser,
  findOrCreateGoogleUser,
  refreshAccessToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  generateTokens,
};
