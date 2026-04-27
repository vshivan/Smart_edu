const axios  = require('axios');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

// ─── Gemini via direct HTTP (avoids SDK version/model issues) ────────────────
const GEMINI_ENDPOINTS = [
  { model: 'gemini-2.0-flash',   api: 'v1beta' },
  { model: 'gemini-1.5-flash',   api: 'v1beta' },
  { model: 'gemini-1.5-pro',     api: 'v1beta' },
  { model: 'gemini-2.0-flash',   api: 'v1' },
  { model: 'gemini-pro',         api: 'v1beta' },
];

const geminiRequest = async (prompt, { jsonMode = false, maxTokens = 4096 } = {}) => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new AppError('GEMINI_API_KEY is not configured in Render environment variables.', 503);

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  let lastError;
  for (const { model, api } of GEMINI_ENDPOINTS) {
    try {
      const url = `https://generativelanguage.googleapis.com/${api}/models/${model}:generateContent?key=${key}`;
      const { data } = await axios.post(url, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      });
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const errMsg = err.response?.data?.error?.message || '';
      // 404 = model not found, try next
      // 429 = quota exceeded on this model, try next
      if (status !== 404 && status !== 429) break;
    }
  }

  const errMsg = lastError?.response?.data?.error?.message || lastError?.message || 'Gemini API error';
  // Check if it's a quota issue
  if (errMsg.includes('quota') || errMsg.includes('Quota')) {
    throw new AppError('AI quota exceeded. Please get a new Gemini API key from aistudio.google.com', 429);
  }
  throw new AppError(`AI generation failed: ${errMsg}`, 502);
};

// ─── Chat session helpers ─────────────────────────────────────────────────────
const loadSession = async (sessionId) => {
  if (!sessionId) return null;
  const { rows } = await pool.query('SELECT * FROM chat_sessions WHERE id = $1', [sessionId]);
  return rows[0] || null;
};

const createSession = async (learnerId, courseId) => {
  const { rows } = await pool.query(
    `INSERT INTO chat_sessions (learner_id, course_id, messages) VALUES ($1,$2,'[]'::jsonb) RETURNING *`,
    [learnerId, courseId || null]
  );
  return rows[0];
};

const appendMessages = async (sessionId, newMessages) => {
  await pool.query(
    `UPDATE chat_sessions SET messages = messages || $1::jsonb, updated_at = NOW() WHERE id = $2`,
    [JSON.stringify(newMessages), sessionId]
  );
};

// ─── Course generation ────────────────────────────────────────────────────────
const generateCourse = async ({ subject, topics = [], difficulty = 'beginner', estimated_hours = 10, audience = 'general learners' }) => {
  const prompt = `You are an expert curriculum designer. Generate a structured course outline as valid JSON only.

Subject: ${subject}
Topics: ${topics.join(', ') || 'General overview'}
Difficulty: ${difficulty}
Estimated Hours: ${estimated_hours}
Audience: ${audience}

Return ONLY valid JSON (no markdown, no explanation):
{
  "title": "string",
  "description": "string",
  "learning_outcomes": ["string"],
  "prerequisites": ["string"],
  "modules": [
    {
      "title": "string",
      "description": "string",
      "lessons": [
        { "title": "string", "content_type": "text", "estimated_minutes": 10, "xp_reward": 10, "key_concepts": ["string"] }
      ]
    }
  ],
  "tags": ["string"]
}

Rules: 4-6 modules, 3-5 lessons each.`;

  const raw = await geminiRequest(prompt, { jsonMode: true, maxTokens: 4096 });

  // Extract JSON from response
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch {}
    }
  }

  if (!parsed?.title || !parsed?.modules) {
    throw new AppError('AI returned invalid response. Please try again.', 500);
  }
  return parsed;
};

// ─── Quiz generation ──────────────────────────────────────────────────────────
const generateQuiz = async ({ topic, difficulty = 'intermediate', num_questions = 5, course_context = '' }) => {
  const prompt = `Generate a quiz as valid JSON only.

Topic: ${topic}
Difficulty: ${difficulty}
Questions: ${num_questions}
${course_context ? `Context: ${course_context}` : ''}

Return ONLY valid JSON:
{
  "title": "string",
  "questions": [
    {
      "question": "string",
      "type": "mcq",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A",
      "explanation": "string",
      "points": 10
    }
  ]
}`;

  const raw = await geminiRequest(prompt, { jsonMode: true, maxTokens: 2000 });

  let parsed;
  try { parsed = JSON.parse(raw); } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) try { parsed = JSON.parse(match[0]); } catch {}
  }

  if (!parsed?.questions) throw new AppError('AI returned invalid quiz data', 500);
  return parsed;
};

// ─── AI Chat tutor ────────────────────────────────────────────────────────────
const chat = async ({ session_id, message, course_id, learner_id, learner_name, level }) => {
  let session = await loadSession(session_id);
  if (!session) session = await createSession(learner_id, course_id);

  const recentMessages = (session.messages || []).slice(-10);
  const history = recentMessages.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');

  const prompt = `You are an expert AI tutor for SmartEduLearn.
Student: ${learner_name} (Level ${level}).
Be concise, encouraging, and educational.

${history ? `Conversation so far:\n${history}\n` : ''}
Student: ${message}
Tutor:`;

  const reply = await geminiRequest(prompt, { maxTokens: 512 });

  await appendMessages(session.id, [
    { role: 'user',      content: message, timestamp: new Date().toISOString() },
    { role: 'assistant', content: reply,   timestamp: new Date().toISOString() },
  ]);

  return { session_id: session.id, reply, message_count: (session.messages || []).length + 2 };
};

// ─── Lesson summarizer ────────────────────────────────────────────────────────
const summarizeLesson = async ({ title, content }) => {
  const prompt = `Summarize this lesson in bullet points (max 150 words).
Lesson: ${title}
Content: ${content}`;
  return geminiRequest(prompt, { maxTokens: 400 });
};

// ─── Recommendations ──────────────────────────────────────────────────────────
const getRecommendations = async ({ completed_subjects = [], interests = [], level = 1 }) => {
  const prompt = `Recommend 5 learning topics. Return ONLY JSON:
{ "recommendations": [{ "subject": "string", "reason": "string", "difficulty": "beginner|intermediate|advanced" }] }

Level: ${level}/10, Completed: ${completed_subjects.join(', ') || 'None'}, Interests: ${interests.join(', ') || 'General'}`;

  const raw = await geminiRequest(prompt, { jsonMode: true, maxTokens: 800 });
  try { return JSON.parse(raw); } catch {
    throw new AppError('AI returned invalid recommendations', 500);
  }
};

module.exports = { generateCourse, generateQuiz, chat, summarizeLesson, getRecommendations };
