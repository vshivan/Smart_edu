const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pinecone } = require('@pinecone-database/pinecone');
const { pool } = require('../config/db');
const { AppError } = require('../utils/errors');

// ─── GEMINI CLIENT ───────────────────────────────────────────────────────────
let genAI;
const getGenAI = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new AppError('GEMINI_API_KEY is not configured. Please add it to your Render environment variables.', 503);
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getModel = () =>
  getGenAI().getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

const geminiChat = async (messages, { jsonMode = false, maxTokens = 2048 } = {}) => {
  const model = getModel();
  const systemMsg = messages.find((m) => m.role === 'system');
  const convo     = messages.filter((m) => m.role !== 'system');

  const history = convo.slice(0, -1).map((m) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMsg  = convo[convo.length - 1];
  const userText = systemMsg
    ? `${systemMsg.content}\n\n---\n\n${lastMsg.content}`
    : lastMsg.content;

  const chat = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.7,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  });

  const result = await chat.sendMessage(userText);
  return result.response.text();
};

const geminiEmbed = async (text) => {
  const model  = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

// ─── PINECONE ────────────────────────────────────────────────────────────────
let pinecone;
const getPinecone = () => {
  if (!pinecone) pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pinecone;
};

// ─── CHAT SESSION HELPERS (PostgreSQL JSONB — no MongoDB) ────────────────────

/**
 * Load a chat session from PostgreSQL.
 * Returns { id, learner_id, course_id, messages[] } or null.
 */
const loadSession = async (sessionId) => {
  if (!sessionId) return null;
  const { rows } = await pool.query(
    'SELECT * FROM chat_sessions WHERE id = $1',
    [sessionId]
  );
  return rows[0] || null;
};

/**
 * Create a new chat session in PostgreSQL.
 */
const createSession = async (learnerId, courseId) => {
  const { rows } = await pool.query(
    `INSERT INTO chat_sessions (learner_id, course_id, messages)
     VALUES ($1, $2, '[]'::jsonb)
     RETURNING *`,
    [learnerId, courseId || null]
  );
  return rows[0];
};

/**
 * Append messages to a session and update updated_at.
 */
const appendMessages = async (sessionId, newMessages) => {
  await pool.query(
    `UPDATE chat_sessions
     SET messages   = messages || $1::jsonb,
         updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(newMessages), sessionId]
  );
};

// ─── COURSE GENERATION ───────────────────────────────────────────────────────
const generateCourse = async ({ subject, topics = [], difficulty = 'beginner', estimated_hours = 10, audience = 'general' }) => {
  const prompt = `You are an expert curriculum designer. Generate a structured course outline as valid JSON only.

Subject: ${subject}
Custom Topics: ${topics.join(', ') || 'None specified'}
Difficulty: ${difficulty}
Estimated Hours: ${estimated_hours}
Target Audience: ${audience}

Return ONLY this JSON (no markdown fences, no explanation):
{
  "title": "string",
  "description": "string (2-3 sentences)",
  "learning_outcomes": ["string"],
  "prerequisites": ["string"],
  "modules": [
    {
      "title": "string",
      "description": "string",
      "lessons": [
        { "title": "string", "content_type": "text|video|quiz", "estimated_minutes": number, "xp_reward": number }
      ]
    }
  ],
  "tags": ["string"]
}`;

  const raw = await geminiChat([{ role: 'user', content: prompt }], { jsonMode: true, maxTokens: 4096 });
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.title || !parsed.modules) {
      throw new Error('Invalid structure');
    }
    return parsed;
  } catch {
    // Try to extract JSON from response if it has extra text
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    throw new AppError('AI returned invalid response. Please try again.', 500);
  }
};

// ─── QUIZ GENERATION ─────────────────────────────────────────────────────────
const generateQuiz = async ({ topic, difficulty = 'intermediate', num_questions = 10, course_context = '' }) => {
  const prompt = `Generate a quiz as valid JSON only.

Topic: ${topic}
Difficulty: ${difficulty}
Number of Questions: ${num_questions}
${course_context ? `Course Context: ${course_context}` : ''}

Return ONLY this JSON:
{
  "title": "string",
  "questions": [
    {
      "question": "string",
      "type": "mcq",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correct_answer": "A",
      "explanation": "string",
      "points": number
    }
  ]
}`;

  const raw = await geminiChat([{ role: 'user', content: prompt }], { jsonMode: true, maxTokens: 3000 });
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError('AI returned invalid JSON for quiz generation', 500);
  }
};

// ─── AI CHAT TUTOR ───────────────────────────────────────────────────────────
const chat = async ({ session_id, message, course_id, learner_id, learner_name, level }) => {
  // Load or create session — stored in PostgreSQL, not MongoDB
  let session = await loadSession(session_id);
  if (!session) {
    session = await createSession(learner_id, course_id);
  }

  // RAG: fetch relevant context from Pinecone if configured
  let ragContext = '';
  if (process.env.PINECONE_API_KEY && course_id) {
    try {
      const pc      = getPinecone();
      const index   = pc.index(process.env.PINECONE_INDEX || 'smartedulear-courses');
      const embed   = await geminiEmbed(message);
      const results = await index.query({ vector: embed, topK: 3, filter: { course_id }, includeMetadata: true });
      ragContext = results.matches.map((m) => m.metadata?.text || '').join('\n\n');
    } catch {
      // Pinecone is optional — continue without RAG context
    }
  }

  const systemPrompt = `You are an expert AI tutor for SmartEduLearn.
Student: ${learner_name} (Level ${level}).
${ragContext ? `Relevant course content:\n${ragContext}\n` : ''}
Be concise, encouraging, and educational. Use examples when helpful.`;

  // Keep last 10 messages for context window efficiency
  const recentMessages = (session.messages || []).slice(-10);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const reply = await geminiChat(messages, { maxTokens: 1024 });

  // Persist new messages to PostgreSQL
  await appendMessages(session.id, [
    { role: 'user',      content: message, timestamp: new Date().toISOString() },
    { role: 'assistant', content: reply,   timestamp: new Date().toISOString() },
  ]);

  return {
    session_id:    session.id,
    reply,
    message_count: (session.messages || []).length + 2,
  };
};

// ─── LESSON SUMMARIZER ───────────────────────────────────────────────────────
const summarizeLesson = async ({ title, content }) => {
  const prompt = `Summarize this lesson concisely for a student. Include key points as bullet points.

Lesson: ${title}
Content: ${content}`;

  return geminiChat([{ role: 'user', content: prompt }], { maxTokens: 512 });
};

// ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────
const getRecommendations = async ({ completed_subjects = [], interests = [], level = 1 }) => {
  const prompt = `Recommend 5 learning topics for a student.

Level: ${level}/10
Completed: ${completed_subjects.join(', ') || 'None'}
Interests: ${interests.join(', ') || 'General'}

Return ONLY JSON: { "recommendations": [{ "subject": "string", "reason": "string", "difficulty": "beginner|intermediate|advanced" }] }`;

  const raw = await geminiChat([{ role: 'user', content: prompt }], { jsonMode: true, maxTokens: 1024 });
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError('AI returned invalid JSON for recommendations', 500);
  }
};

module.exports = { generateCourse, generateQuiz, chat, summarizeLesson, getRecommendations };
