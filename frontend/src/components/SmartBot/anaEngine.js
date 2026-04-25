/**
 * Ana — AI Professor Engine
 * Handles intent detection, mode parsing, and response generation
 */

import { PAGE_KNOWLEDGE, FAQ } from './botKnowledge';

// ── Mode detection ────────────────────────────────────────────────────────────
export const MODES = {
  EXPLAIN_SIMPLE: 'explain_simple',   // "explain like I'm 15"
  EXAM:           'exam',             // "exam mode"
  SHORT_NOTE:     'short_note',       // "short note"
  DEEP_DIVE:      'deep_dive',        // "deep dive"
  QUIZ:           'quiz',             // "quiz me"
  REVISE:         'revise',           // "revise"
  NORMAL:         'normal',
};

export function detectMode(text) {
  const t = text.toLowerCase();
  if (t.includes("explain like") || t.includes("eli5") || t.includes("simple") || t.includes("15"))
    return MODES.EXPLAIN_SIMPLE;
  if (t.includes("exam mode") || t.includes("exam answer") || t.includes("exam ready"))
    return MODES.EXAM;
  if (t.includes("short note") || t.includes("5 mark") || t.includes("brief note"))
    return MODES.SHORT_NOTE;
  if (t.includes("deep dive") || t.includes("in detail") || t.includes("detailed"))
    return MODES.DEEP_DIVE;
  if (t.includes("quiz me") || t.includes("test me") || t.includes("ask me"))
    return MODES.QUIZ;
  if (t.includes("revise") || t.includes("revision") || t.includes("quick summary"))
    return MODES.REVISE;
  return MODES.NORMAL;
}

// ── Intent detection ──────────────────────────────────────────────────────────
export function detectIntent(text) {
  const t = text.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|namaste|hii|helo)\b/.test(t))
    return 'greeting';

  // Thanks
  if (t.includes('thank') || t.includes('thanks') || t.includes('thx'))
    return 'thanks';

  // Platform navigation
  if (t.includes('xp') || t.includes('experience point'))  return 'platform_xp';
  if (t.includes('streak'))                                  return 'platform_streak';
  if (t.includes('badge') || t.includes('achievement'))     return 'platform_badge';
  if (t.includes('level') && !t.includes('level up'))       return 'platform_level';
  if (t.includes('level up'))                               return 'platform_levelup';
  if (t.includes('leaderboard') || t.includes('rank'))      return 'platform_leaderboard';
  if (t.includes('generate') && t.includes('course'))       return 'platform_generate';
  if (t.includes('book') && t.includes('tutor'))            return 'platform_book_tutor';
  if (t.includes('quiz'))                                    return 'platform_quiz';
  if (t.includes('enroll') || t.includes('join course'))    return 'platform_enroll';

  // Teaching topics — CS / Tech
  if (t.includes('machine learning') || t.includes('ml'))   return 'teach_ml';
  if (t.includes('deep learning') || t.includes('neural'))  return 'teach_dl';
  if (t.includes('python'))                                  return 'teach_python';
  if (t.includes('javascript') || t.includes('js'))         return 'teach_js';
  if (t.includes('react'))                                   return 'teach_react';
  if (t.includes('database') || t.includes('sql'))          return 'teach_db';
  if (t.includes('api') || t.includes('rest'))              return 'teach_api';
  if (t.includes('algorithm') || t.includes('data structure')) return 'teach_dsa';
  if (t.includes('cloud') || t.includes('aws') || t.includes('docker')) return 'teach_cloud';
  if (t.includes('git') || t.includes('version control'))   return 'teach_git';

  // Teaching topics — General
  if (t.includes('what is') || t.includes('explain') || t.includes('define') || t.includes('tell me about'))
    return 'teach_general';
  if (t.includes('how does') || t.includes('how do') || t.includes('how to'))
    return 'teach_howto';
  if (t.includes('difference between') || t.includes('vs ') || t.includes('compare'))
    return 'teach_compare';
  if (t.includes('example') || t.includes('give me'))
    return 'teach_example';

  // Page help
  if (t.includes('this page') || t.includes('current page') || t.includes('where am i'))
    return 'page_help';

  // Help
  if (t.includes('help') || t.includes('what can you') || t.includes('what do you'))
    return 'help';

  return 'teach_general';
}

// ── Response generator ────────────────────────────────────────────────────────
export function generateResponse(userText, intent, mode, pageInfo, user, quizState) {
  const name = user?.first_name || 'there';
  const t = userText.toLowerCase();

  // ── Greetings ───────────────────────────────────────────────────────────────
  if (intent === 'greeting') {
    const greetings = [
      `Hello, ${name}! 👋 I'm Ana, your AI professor. Ready to learn something amazing today? Ask me anything — a concept, a topic, or just say "quiz me"!`,
      `Hey ${name}! Great to see you. 😊 What shall we explore today? I can explain topics, create study notes, quiz you, or help you navigate the platform.`,
      `Good to have you here, ${name}! 🎓 I'm Ana — think of me as your personal professor. What would you like to learn or understand today?`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // ── Thanks ──────────────────────────────────────────────────────────────────
  if (intent === 'thanks') {
    return `You're very welcome, ${name}! 😊 That's what I'm here for. Keep that curiosity alive — it's your greatest learning tool. Anything else you'd like to explore?`;
  }

  // ── Help ────────────────────────────────────────────────────────────────────
  if (intent === 'help') {
    return `I'm Ana, your AI professor! 🎓 Here's what I can do:\n\n📚 **Teach** any topic — just ask "explain machine learning"\n🎯 **Quiz you** — say "quiz me on Python"\n📝 **Study notes** — say "short note on React"\n🔍 **Deep dive** — say "deep dive into neural networks"\n📋 **Exam answers** — say "exam mode: what is SQL?"\n🔄 **Revise** — say "revise XP system"\n💡 **Page tips** — I know every page on this platform!\n\nWhat would you like to start with?`;
  }

  // ── Page help ───────────────────────────────────────────────────────────────
  if (intent === 'page_help' && pageInfo) {
    return `You're currently on the **${pageInfo.title}** page. ${pageInfo.description}\n\n📌 **Key things to know:**\n${pageInfo.tips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nWant me to simplify this further or give you an exam-ready answer?`;
  }

  // ── Platform intents ────────────────────────────────────────────────────────
  const platformResponses = {
    platform_xp: `**XP (Experience Points)** is your learning currency on SmartEduLearn! 🌟\n\nHere's how you earn it:\n• ✅ Complete a lesson → **+10 XP**\n• 🎯 Pass a quiz → **+50 XP**\n• 💯 Perfect quiz score → **+100 XP**\n• 📚 Complete a course → **+500 XP**\n• 🔥 Daily streak → **+20 XP/day**\n\nXP fills your level bar. Reach enough XP and you level up — from Novice all the way to Sage! 🧙‍♀️\n\nWant me to simplify this further or give you an exam-ready answer?`,

    platform_streak: `**Streaks** are your daily login consistency tracker! 🔥\n\nHere's how it works:\n• Log in **every day** → streak count goes up\n• Miss a day → streak resets to 0\n• You get a **48-hour grace window** (so missing one day won't always break it)\n• Each streak day earns you **+20 XP**\n\n🏅 Streak milestones unlock special badges:\n• 7-day streak → First Week badge\n• 30-day streak → Dedicated Learner badge\n\nThink of it like a gym habit — consistency is everything! 💪`,

    platform_badge: `**Badges** are achievement medals you earn for hitting milestones! 🏆\n\nCategories:\n• 🔥 **Streak badges** — 7-day, 30-day login streaks\n• 📈 **Level badges** — Reach Level 5, Level 10\n• 📚 **Course badges** — Complete 1, 5 courses\n• 🎯 **Quiz badges** — Perfect score, pass 10 quizzes\n\nEach badge also gives **bonus XP** when earned. Check your Achievements page to see all available badges and what you need to unlock them!\n\nWant me to simplify this further or give you an exam-ready answer?`,

    platform_level: `**Levels** represent your mastery progression! 🗺️\n\nThere are **10 levels** in total:\n1. 🌱 Novice (0 XP)\n2. 🔍 Explorer (100 XP)\n3. 📚 Learner (300 XP)\n4. 🎓 Scholar (600 XP)\n5. ⚡ Expert (1,000 XP)\n6. 🏆 Master (1,500 XP)\n7. 👑 Champion (2,200 XP)\n8. 🌟 Legend (3,000 XP)\n9. 💎 Grandmaster (4,000 XP)\n10. 🔮 Sage (5,500 XP)\n\nCheck your **Roadmap** page to see your current position visually!`,

    platform_generate: `**AI Course Generation** is one of the most powerful features here! ⚡\n\nHere's the process:\n1. Go to **AI Course Generator** in the sidebar\n2. Select a **subject** from the dropdown (30+ subjects)\n3. Pick **topics** from the suggested list\n4. Set **difficulty** and **estimated hours**\n5. Click **Generate** — Gemini AI builds the full curriculum!\n6. Review the modules and lessons\n7. Click **Save Course** to start learning\n\n💡 Tip: You need a free Gemini API key from aistudio.google.com\n\nWant me to simplify this further or give you an exam-ready answer?`,

    platform_quiz: `**Quizzes** test your knowledge and reward you with XP! 🎯\n\nHow they work:\n• Each quiz has multiple-choice questions\n• You have a **limited number of attempts** (usually 3)\n• Pass score is typically **70%**\n• Passing earns **+50 XP**, perfect score earns **+100 XP**\n• A timer may be active — watch the clock!\n\n📌 Strategy: Read all options before answering. If unsure, eliminate wrong answers first.\n\nWant me to simplify this further or give you an exam-ready answer?`,
  };

  if (platformResponses[intent]) return platformResponses[intent];

  // ── Teaching responses with modes ───────────────────────────────────────────
  const topic = extractTopic(userText);

  if (mode === MODES.EXAM) {
    return buildExamAnswer(topic, userText);
  }
  if (mode === MODES.SHORT_NOTE) {
    return buildShortNote(topic, userText);
  }
  if (mode === MODES.REVISE) {
    return buildRevision(topic, userText);
  }
  if (mode === MODES.EXPLAIN_SIMPLE) {
    return buildSimpleExplanation(topic, userText);
  }
  if (mode === MODES.DEEP_DIVE) {
    return buildDeepDive(topic, userText);
  }
  if (mode === MODES.QUIZ) {
    return buildQuizQuestion(topic, userText);
  }

  // ── Topic-specific teaching ─────────────────────────────────────────────────
  if (intent === 'teach_ml') {
    return `**Machine Learning** — let me break this down for you! 🤖\n\nAt its core, ML is about teaching computers to **learn from data** without being explicitly programmed.\n\n**3 Main Types:**\n1. **Supervised Learning** — You give labeled examples (like showing a child pictures of cats and dogs)\n2. **Unsupervised Learning** — The model finds patterns on its own (like grouping similar customers)\n3. **Reinforcement Learning** — The model learns by trial and error (like training a game-playing AI)\n\n**Real-world examples:**\n• Netflix recommendations → ML\n• Email spam filter → ML\n• Face recognition → ML\n\n💡 Think of ML as: *"Instead of writing rules, you show examples and let the computer figure out the rules."*\n\nWant me to simplify this further or give you an exam-ready answer?`;
  }

  if (intent === 'teach_python') {
    return `**Python** is one of the most beginner-friendly yet powerful programming languages! 🐍\n\n**Why Python?**\n• Reads almost like English\n• Huge library ecosystem (NumPy, Pandas, TensorFlow)\n• Used in AI, web dev, automation, data science\n\n**Quick example:**\n\`\`\`python\n# Hello World\nprint("Hello, World!")\n\n# Variables\nname = "Ana"\nage = 25\nprint(f"I am {name}, age {age}")\n\`\`\`\n\n**Key concepts to learn first:**\n1. Variables & Data Types\n2. Loops (for, while)\n3. Functions\n4. Lists & Dictionaries\n5. File handling\n\nWant me to simplify this further or give you an exam-ready answer?`;
  }

  if (intent === 'teach_js') {
    return `**JavaScript** is the language of the web! 🌐\n\nEvery interactive website you've used runs JavaScript in the browser.\n\n**What it does:**\n• Makes web pages dynamic and interactive\n• Handles button clicks, form validation, animations\n• Can also run on servers (Node.js)\n\n**Quick example:**\n\`\`\`javascript\n// Variables\nconst name = "Ana";\nlet age = 25;\n\n// Function\nfunction greet(person) {\n  return \`Hello, \${person}!\`;\n}\n\nconsole.log(greet(name)); // Hello, Ana!\n\`\`\`\n\n**Learning path:**\n1. Variables, Data Types\n2. Functions & Scope\n3. DOM Manipulation\n4. Async/Await\n5. React (framework)\n\nWant me to simplify this further or give you an exam-ready answer?`;
  }

  if (intent === 'teach_dsa') {
    return `**Data Structures & Algorithms** — the backbone of computer science! 🧠\n\n**Data Structures** = Ways to organize data\n• Array, Linked List, Stack, Queue\n• Tree, Graph, Hash Table\n\n**Algorithms** = Step-by-step problem-solving methods\n• Sorting: Bubble, Merge, Quick Sort\n• Searching: Binary Search, BFS, DFS\n\n**Why it matters:**\n• Interviews at top companies (Google, Amazon) focus heavily on DSA\n• Efficient code = faster applications\n\n**Simple analogy:**\nThink of a **library**:\n• Books = Data\n• Shelves = Data Structure (how books are organized)\n• Finding a book = Algorithm (how you search)\n\nWant me to simplify this further or give you an exam-ready answer?`;
  }

  if (intent === 'teach_compare') {
    return buildComparison(userText);
  }

  // ── General teaching fallback ───────────────────────────────────────────────
  return buildGeneralTeach(topic, userText, name);
}

// ── Helper builders ───────────────────────────────────────────────────────────

function extractTopic(text) {
  const cleaned = text
    .replace(/explain like i.m \d+/gi, '')
    .replace(/exam mode[:\s]*/gi, '')
    .replace(/short note[:\s]*/gi, '')
    .replace(/deep dive[:\s]*/gi, '')
    .replace(/quiz me on/gi, '')
    .replace(/revise[:\s]*/gi, '')
    .replace(/what is|explain|define|tell me about|how does|how do|how to/gi, '')
    .trim();
  return cleaned || text;
}

function buildExamAnswer(topic, original) {
  return `📋 **EXAM MODE — ${topic.toUpperCase()}**\n\n**📌 Definition:**\n${topic} refers to [a key concept in its domain that involves structured knowledge and application].\n\n**📖 Explanation:**\nAt its core, ${topic} works by applying fundamental principles to solve real-world problems. It involves understanding the underlying theory and being able to apply it in practical scenarios.\n\n**🔑 Key Points:**\n• Point 1: Core concept and its significance\n• Point 2: How it works in practice\n• Point 3: Real-world applications\n• Point 4: Advantages and limitations\n• Point 5: Relationship to related concepts\n\n**💡 Example:**\nConsider a real-world scenario where ${topic} is applied — this demonstrates its practical value and helps solidify understanding.\n\n**✅ Conclusion:**\n${topic} is an essential concept because it forms the foundation for more advanced topics and has direct applications in industry.\n\n---\n*💬 Tip: For a more specific exam answer, tell me the exact topic — e.g., "exam mode: what is machine learning?"*\n\nWant me to simplify this further or give you an exam-ready answer?`;
}

function buildShortNote(topic, original) {
  return `📝 **SHORT NOTE — ${topic.toUpperCase()}** *(5-mark format)*\n\n**Introduction:**\n${topic} is a fundamental concept that plays a key role in its domain.\n\n**Key Points:**\n1. **Definition** — Core meaning and scope\n2. **Working** — How it functions or operates\n3. **Types/Categories** — Main classifications (if applicable)\n4. **Applications** — Where it is used in practice\n5. **Importance** — Why it matters in the field\n\n**Conclusion:**\nIn summary, ${topic} is significant because it enables efficient problem-solving and forms the basis for advanced concepts.\n\n---\n*For a precise short note, specify the topic — e.g., "short note on neural networks"*\n\nWant me to simplify this further or give you an exam-ready answer?`;
}

function buildRevision(topic, original) {
  return `🔄 **QUICK REVISION — ${topic.toUpperCase()}**\n\n• 📌 **What:** Core definition in one line\n• ⚙️ **How:** Main working principle\n• 🎯 **Why:** Primary purpose/use case\n• 📦 **Types:** Key categories (if any)\n• 💡 **Example:** One real-world instance\n• ⚠️ **Remember:** Most important exam point\n\n---\n*Say "deep dive" for full explanation or "exam mode" for structured answer!*`;
}

function buildSimpleExplanation(topic, original) {
  return `🧒 **SIMPLE EXPLANATION — ${topic}**\n\nOkay, imagine you're 15 and someone asks you about ${topic}...\n\n**The Simple Version:**\nThink of it like this — ${topic} is basically like [a relatable everyday analogy]. Just like how you [familiar action], ${topic} does something similar but in the world of [domain].\n\n**Real-life example:**\nYou know how [everyday example]? That's exactly what ${topic} does, but for [technical context].\n\n**In one sentence:**\n"${topic} is a way to [simple description] so that [benefit]." ✅\n\n---\n*Want the full technical version? Just say "deep dive" or "exam mode"!*\n\nWant me to simplify this further or give you an exam-ready answer?`;
}

function buildDeepDive(topic, original) {
  return `🔬 **DEEP DIVE — ${topic.toUpperCase()}**\n\n**1. Conceptual Foundation**\n${topic} is rooted in [core theory]. Understanding it requires grasping [prerequisite concepts].\n\n**2. How It Works (Step by Step)**\n→ Step 1: [Initial process]\n→ Step 2: [Core operation]\n→ Step 3: [Output/Result]\n\n**3. Mathematical/Technical Basis**\nThe underlying logic involves [key formula or principle]. This is important because [reason].\n\n**4. Types & Variants**\n• Type A — [description]\n• Type B — [description]\n• Type C — [description]\n\n**5. Real-World Applications**\n• Industry 1: [use case]\n• Industry 2: [use case]\n• Industry 3: [use case]\n\n**6. Advantages & Limitations**\n✅ Pros: [key benefits]\n❌ Cons: [key limitations]\n\n**7. Related Concepts**\nTo fully master ${topic}, also study: [related topics]\n\n---\n*For a specific deep dive, mention the exact topic — e.g., "deep dive into transformers in NLP"*\n\nWant me to simplify this further or give you an exam-ready answer?`;
}

function buildQuizQuestion(topic, original) {
  const questions = [
    { q: `What is the primary purpose of ${topic}?`, opts: ['A) To store data', 'B) To solve a specific class of problems efficiently', 'C) To display information', 'D) To connect networks'], ans: 'B' },
    { q: `Which of the following best describes ${topic}?`, opts: ['A) A hardware component', 'B) A systematic approach to problem-solving', 'C) A type of database', 'D) A network protocol'], ans: 'B' },
    { q: `${topic} is most commonly used in which domain?`, opts: ['A) Physical sciences only', 'B) Computer science and engineering', 'C) Only in mathematics', 'D) Only in biology'], ans: 'B' },
  ];
  const q = questions[Math.floor(Math.random() * questions.length)];
  return `🎯 **QUIZ TIME!**\n\n**Question:**\n${q.q}\n\n${q.opts.join('\n')}\n\n---\n*Type your answer (A, B, C, or D) and I'll evaluate it!*\n\n*(For a topic-specific quiz, say "quiz me on Python basics" or "quiz me on machine learning")*`;
}

function buildComparison(text) {
  const match = text.match(/(\w[\w\s]+?)\s+(?:vs|versus|and|or)\s+(\w[\w\s]+)/i);
  const a = match?.[1]?.trim() || 'Concept A';
  const b = match?.[2]?.trim() || 'Concept B';
  return `⚖️ **${a.toUpperCase()} vs ${b.toUpperCase()}**\n\n| Feature | ${a} | ${b} |\n|---------|${'-'.repeat(a.length + 2)}|${'-'.repeat(b.length + 2)}|\n| Definition | Core meaning of ${a} | Core meaning of ${b} |\n| Purpose | Primary use of ${a} | Primary use of ${b} |\n| Complexity | [Level] | [Level] |\n| Use Case | When to use ${a} | When to use ${b} |\n| Example | ${a} example | ${b} example |\n\n**Key Takeaway:**\nChoose **${a}** when [condition]. Choose **${b}** when [condition].\n\n---\n*For a precise comparison, specify — e.g., "compare SQL vs NoSQL"*\n\nWant me to simplify this further or give you an exam-ready answer?`;
}

function buildGeneralTeach(topic, original, name) {
  const faqMatch = FAQ.find(f =>
    original.toLowerCase().includes(f.q.toLowerCase().split(' ').slice(1, 4).join(' ').toLowerCase())
  );
  if (faqMatch) return faqMatch.a + '\n\nWant me to simplify this further or give you an exam-ready answer?';

  return `Great question, ${name}! Let me teach you about **${topic}**. 🎓\n\nHere's how I'd explain it:\n\n**The Core Idea:**\n${topic} is a concept that involves understanding [key principle] and applying it to [domain/context].\n\n**Why It Matters:**\nLearning ${topic} helps you [benefit 1] and [benefit 2]. It's widely used in [field/industry].\n\n**A Simple Example:**\nImagine [relatable scenario] — that's essentially what ${topic} does in practice.\n\n**Next Steps:**\nTo go deeper, explore: [related concept 1], [related concept 2]\n\n---\n💡 *Pro tip: Try these modes for better answers:*\n• *"Explain like I'm 15: ${topic}"*\n• *"Exam mode: ${topic}"*\n• *"Deep dive: ${topic}"*\n\nWant me to simplify this further or give you an exam-ready answer?`;
}
