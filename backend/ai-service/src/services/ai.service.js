const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pinecone } = require('@pinecone-database/pinecone');
const ChatSession = require('../models/ChatSession');
const { AppError } = require('../../../shared/utils/errors');

// ─── GEMINI CLIENT ───────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () =>
  genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

/**
 * Unified chat helper — accepts OpenAI-style messages array.
 * Handles system prompt injection and Gemini history format.
 */
const geminiChat = async (messages, { jsonMode = false, maxTokens = 2048 } = {}) => {
  const model = getModel();

  const systemMsg = messages.find(m => m.role === 'system');
  const convo = messages.filter(m => m.role !== 'system');

  // All messages except the last become history
  const history = convo.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const lastMsg = convo[convo.length - 1];
  // Prepend system prompt to the first user message
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

/**
 * Embed text using Gemini text-embedding-004.
 * Returns a float array suitable for Pinecone.
 */
const geminiEmbed = async (text) => {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

// ─── PINECONE ────────────────────────────────────────────────────────────────
let pinecone;
const getPinecone = () => {
  if (!pinecone) pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return pinecone;
};

// ─── PROMPTS ─────────────────────────────────────────────────────────────────

const COURSE_GEN_PROMPT = (subject, topics, difficulty, hours, audience) => `
You are an expert curriculum designer. Generate a structured course outline as valid JSON only.

Subject: ${subject}
Custom Topics: ${topics.join(', ') || 'None specified'}
Difficulty: ${difficulty}
Estimated Hours: ${hours}
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
      "estimated_hours": number,
      "subtopics": ["string"],
      "learning_objectives": ["string"],
      "lessons": [
        {
          "title": "string",
          "content_type": "video|text|quiz|coding",
          "duration_min": number,
          "key_concepts": ["string"],
          "xp_reward": number
        }
      ]
    }
  ]
}

Rules: 4-8 modules, 3-6 lessons each, at least one quiz lesson per module.
`;

const QUIZ_GEN_PROMPT = (lessonTitle, content, numQ, difficulty) => `
You are an expert assessment designer. Generate quiz questions as valid JSON only.

Lesson: ${lessonTitle}
Content: ${content.substring(0, 2000)}
Number of Questions: ${numQ}
Difficulty: ${difficulty}

Return ONLY a JSON array (no markdown fences):
[
  {
    "question_text": "string",
    "question_type": "mcq",
    "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
    "correct_answer": "A|B|C|D",
    "explanation": "string",
    "difficulty": "easy|medium|hard",
    "points": number
  }
]

Rules: plausible distractors, educational explanations, mix 40% easy / 40% medium / 20% hard.
`;

const CHAT_SYSTEM_PROMPT = (learnerName, courseTitle, lessonTitle, level) => `
You are SmartEduLearn's AI tutor — expert, patient, and encouraging.

Learner: ${learnerName} | Level: ${level}
Current Course: ${courseTitle || 'General'}
Current Lesson: ${lessonTitle || 'General'}

Rules:
- Answer questions about the current lesson and course
- Use analogies and real-world examples
- Break complex concepts into digestible steps
- NEVER give direct quiz answers — guide the learner instead
- Keep responses under 200 words unless a longer explanation is truly needed
- Be warm and encouraging
`;

// ─── COURSE GENERATION ───────────────────────────────────────────────────────

const generateCourse = async ({
  subject,
  custom_topics = [],
  difficulty = 'beginner',
  estimated_hours = 10,
  target_audience = 'General learners',
}) => {
  if (!subject) throw new AppError('Subject is required', 400);

  const prompt = COURSE_GEN_PROMPT(subject, custom_topics, difficulty, estimated_hours, target_audience);
  const raw = await geminiChat(
    [{ role: 'user', content: prompt }],
    { jsonMode: true, maxTokens: 4096 }
  );

  return JSON.parse(raw);
};

// ─── QUIZ GENERATION ─────────────────────────────────────────────────────────

const generateQuiz = async ({
  lesson_title,
  lesson_content,
  num_questions = 5,
  difficulty = 'medium',
}) => {
  const prompt = QUIZ_GEN_PROMPT(lesson_title, lesson_content || '', num_questions, difficulty);
  const raw = await geminiChat(
    [{ role: 'user', content: prompt }],
    { jsonMode: true, maxTokens: 2048 }
  );

  const parsed = JSON.parse(raw);
  // Gemini may return { questions: [...] } or a direct array
  return Array.isArray(parsed) ? parsed : parsed.questions || parsed;
};

// ─── AI CHAT TUTOR ───────────────────────────────────────────────────────────

const chat = async ({
  learner_id,
  session_id,
  message,
  course_id,
  learner_name = 'Learner',
  course_title,
  lesson_title,
  level = 1,
}) => {
  // Load or create session
  let session = session_id ? await ChatSession.findById(session_id) : null;
  if (!session) {
    session = await ChatSession.create({ learner_id, course_id: course_id || null, messages: [] });
  }

  // RAG context (non-fatal if Pinecone not configured)
  let ragContext = '';
  if (course_id) ragContext = await retrieveCourseContext(message, course_id);

  const systemPrompt = CHAT_SYSTEM_PROMPT(learner_name, course_title, lesson_title, level);
  const contextNote = ragContext ? `\n\nRelevant course content:\n${ragContext}` : '';

  // Keep last 10 messages for context window
  const recentMessages = session.messages.slice(-10);

  const messages = [
    { role: 'system', content: systemPrompt + contextNote },
    ...recentMessages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const reply = await geminiChat(messages, { maxTokens: 512 });

  // Persist to MongoDB
  session.messages.push({ role: 'user', content: message });
  session.messages.push({ role: 'assistant', content: reply });
  await session.save();

  return { session_id: session._id, reply };
};

// ─── RAG: RETRIEVE COURSE CONTEXT ────────────────────────────────────────────

const retrieveCourseContext = async (query, courseId) => {
  try {
    const pc = getPinecone();
    const index = pc.index(process.env.PINECONE_INDEX || 'smartedulear-courses');

    // Embed query with Gemini
    const queryVector = await geminiEmbed(query);

    const results = await index.query({
      vector: queryVector,
      topK: 3,
      filter: { course_id: courseId },
      includeMetadata: true,
    });

    if (!results.matches?.length) return '';
    return results.matches.map(m => m.metadata?.text || '').filter(Boolean).join('\n\n');
  } catch {
    // RAG is optional — fall back to pure LLM if Pinecone not set up
    return '';
  }
};

// ─── SUMMARIZE LESSON ────────────────────────────────────────────────────────

const summarizeLesson = async ({ lesson_title, content }) => {
  return geminiChat([{
    role: 'user',
    content: `Summarize this lesson for a learner. Keep it under 150 words.

Lesson: ${lesson_title}
Content: ${content?.substring(0, 3000) || 'No content provided'}

Format your response exactly like this:
**Key Takeaways** (3-5 bullets)
**Core Concept** (1-2 sentences)
**Remember This** (one analogy or mnemonic)`,
  }], { maxTokens: 512 });
};

// ─── RECOMMENDATIONS ─────────────────────────────────────────────────────────

const getRecommendations = async ({ completed_courses, interests, level, goal }) => {
  const raw = await geminiChat([{
    role: 'user',
    content: `You are a course recommendation engine. Suggest 5 course topics.

Completed courses: ${completed_courses?.join(', ') || 'None'}
Interests: ${interests?.join(', ') || 'General'}
Current level: ${level}
Learning goal: ${goal || 'General learning'}

Return ONLY this JSON (no markdown fences):
{ "recommendations": [{ "topic": "string", "reason": "string", "difficulty": "beginner|intermediate|advanced" }] }`,
  }], { jsonMode: true, maxTokens: 800 });

  return JSON.parse(raw);
};

module.exports = { generateCourse, generateQuiz, chat, summarizeLesson, getRecommendations };
