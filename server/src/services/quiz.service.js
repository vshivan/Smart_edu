const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

const getQuiz = async (quizId, learnerId) => {
  const { rows } = await pool.query(
    `SELECT q.*, json_agg(qq ORDER BY qq.order_index) AS questions
     FROM quizzes q
     LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
     WHERE q.id = $1 GROUP BY q.id`,
    [quizId]
  );
  if (!rows.length) throw new AppError('Quiz not found', 404);

  const quiz = rows[0];

  const attempts = await pool.query(
    'SELECT COUNT(*) AS count FROM quiz_attempts WHERE quiz_id = $1 AND learner_id = $2',
    [quizId, learnerId]
  );
  quiz.attempts_used      = parseInt(attempts.rows[0].count);
  quiz.attempts_remaining = Math.max(0, quiz.max_attempts - quiz.attempts_used);

  // Strip correct answers before sending
  quiz.questions = (quiz.questions || []).map(({ correct_answer, ...q }) => q);

  return quiz;
};

const submitQuiz = async (quizId, learnerId, { answers, time_taken_s }) => {
  const attemptCount = await pool.query(
    'SELECT COUNT(*) AS count FROM quiz_attempts WHERE quiz_id = $1 AND learner_id = $2',
    [quizId, learnerId]
  );
  const quiz = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
  if (!quiz.rows.length) throw new AppError('Quiz not found', 404);

  const { max_attempts, pass_score, xp_reward, xp_perfect } = quiz.rows[0];
  const used = parseInt(attemptCount.rows[0].count);
  if (used >= max_attempts) throw new AppError(`Maximum ${max_attempts} attempts reached`, 400);

  const { rows: questions } = await pool.query(
    'SELECT id, correct_answer, points FROM quiz_questions WHERE quiz_id = $1',
    [quizId]
  );

  let earned = 0;
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const gradedAnswers = answers.map((a) => {
    const q = questions.find((q) => q.id === a.question_id);
    const correct = q && a.answer?.toString().trim().toUpperCase() === q.correct_answer?.toString().trim().toUpperCase();
    if (correct) earned += q.points;
    return { ...a, correct, correct_answer: q?.correct_answer };
  });

  const scorePercent = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;
  const passed       = scorePercent >= pass_score;
  const isPerfect    = scorePercent === 100;
  const xpEarned     = passed ? (isPerfect ? xp_perfect : xp_reward) : 0;

  const { rows: attempt } = await pool.query(
    `INSERT INTO quiz_attempts (quiz_id, learner_id, score, max_score, passed, answers, time_taken_s, xp_earned, attempt_num)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [quizId, learnerId, scorePercent, maxScore, passed, JSON.stringify(gradedAnswers), time_taken_s, xpEarned, used + 1]
  );

  return {
    attempt_id:        attempt[0].id,
    score:             scorePercent,
    max_score:         maxScore,
    passed,
    is_perfect:        isPerfect,
    xp_earned:         xpEarned,
    answers:           gradedAnswers,
    attempts_remaining: max_attempts - used - 1,
  };
};

const getAttemptResult = async (attemptId, learnerId) => {
  const { rows } = await pool.query(
    `SELECT qa.*, q.title, q.pass_score,
            json_agg(qq ORDER BY qq.order_index) AS questions
     FROM quiz_attempts qa
     JOIN quizzes q ON qa.quiz_id = q.id
     JOIN quiz_questions qq ON qq.quiz_id = q.id
     WHERE qa.id = $1 AND qa.learner_id = $2
     GROUP BY qa.id, q.title, q.pass_score`,
    [attemptId, learnerId]
  );
  if (!rows.length) throw new AppError('Attempt not found', 404);
  return rows[0];
};

module.exports = { getQuiz, submitQuiz, getAttemptResult };
