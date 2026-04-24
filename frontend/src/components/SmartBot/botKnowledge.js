/**
 * SmartBot Page Knowledge Base
 * Each entry maps a URL pattern to page-specific help content
 */

export const PAGE_KNOWLEDGE = {
  // ── Landing ────────────────────────────────────────────────────────────────
  '/': {
    title: 'Welcome to SmartEduLearn!',
    emoji: '🎓',
    description: 'AI-powered personalized learning platform',
    tips: [
      'Click "Start Learning Free" to create your account',
      'Browse courses without signing up',
      'Choose between Learner or Tutor role when registering',
    ],
    quickActions: [
      { label: 'Create Account', path: '/register' },
      { label: 'Browse Courses', path: '/courses' },
      { label: 'Sign In', path: '/login' },
    ],
  },

  // ── Auth ───────────────────────────────────────────────────────────────────
  '/login': {
    title: 'Signing In',
    emoji: '🔐',
    description: 'Access your SmartEduLearn account',
    tips: [
      'Use your email and password to sign in',
      'Click "Continue with Google" for one-click login',
      'Forgot your password? Use the "Forgot password?" link',
    ],
    quickActions: [
      { label: 'Create Account', path: '/register' },
    ],
  },
  '/register': {
    title: 'Creating Your Account',
    emoji: '✨',
    description: 'Join thousands of learners on SmartEduLearn',
    tips: [
      'Choose "Learner" to take courses and earn XP',
      'Choose "Tutor" to teach and earn from sessions',
      'Password must be at least 8 characters',
      'You can sign up with Google for faster access',
    ],
    quickActions: [
      { label: 'Already have account?', path: '/login' },
    ],
  },

  // ── Learner Dashboard ──────────────────────────────────────────────────────
  '/dashboard': {
    title: 'Your Dashboard',
    emoji: '🏠',
    description: 'Your learning command center',
    tips: [
      'See your XP, level, and streak at a glance',
      'Continue where you left off in active courses',
      'Click "Generate Course" to create an AI course instantly',
      'Your XP bar shows progress to the next level',
    ],
    quickActions: [
      { label: 'Generate AI Course', path: '/generate' },
      { label: 'Browse Courses', path: '/courses' },
      { label: 'View Roadmap', path: '/roadmap' },
    ],
  },

  // ── AI Course Generator ────────────────────────────────────────────────────
  '/generate': {
    title: 'AI Course Generator',
    emoji: '🤖',
    description: 'Create a full course with AI in seconds',
    tips: [
      'Step 1: Select a subject from the dropdown (30+ subjects available)',
      'Step 2: Pick topics from the suggested list or add custom ones',
      'Step 3: Set difficulty, hours, and target audience',
      'Click "Generate Course" — AI builds the full curriculum!',
      'After generation, click "Save Course" to start learning',
      'Requires a Gemini API key — get one free at aistudio.google.com',
    ],
    quickActions: [
      { label: 'Browse Existing Courses', path: '/courses' },
    ],
  },

  // ── Courses ────────────────────────────────────────────────────────────────
  '/courses': {
    title: 'Course Catalog',
    emoji: '📚',
    description: 'Explore all available courses',
    tips: [
      'Filter by difficulty: Beginner, Intermediate, or Advanced',
      'Search by keyword to find specific topics',
      'Free courses are marked with a green "Free" badge',
      'Click any course to see full details and enroll',
    ],
    quickActions: [
      { label: 'Generate AI Course', path: '/generate' },
    ],
  },

  // ── Course Learn ───────────────────────────────────────────────────────────
  '/learn': {
    title: 'Course Viewer',
    emoji: '📖',
    description: 'Learn at your own pace',
    tips: [
      'Use the left sidebar to navigate between lessons',
      'Click "Mark Complete" after finishing each lesson to earn XP',
      'Green checkmarks show completed lessons',
      'Your progress percentage updates automatically',
      'Completed lessons earn you XP toward leveling up',
    ],
    quickActions: [
      { label: 'Ask AI Tutor', path: '/chat' },
    ],
  },

  // ── Roadmap ────────────────────────────────────────────────────────────────
  '/roadmap': {
    title: 'Learning Roadmap',
    emoji: '🗺️',
    description: 'Your skill progression journey',
    tips: [
      'There are 10 levels from Novice to Sage',
      'Earn XP by completing lessons, quizzes, and daily streaks',
      'Green nodes = completed levels, Blue = current level',
      'Each level unlocks new achievements and badges',
      'XP needed: 100 → 300 → 600 → 1000 → 1500 → 2200 → 3000 → 4000 → 5500',
    ],
    quickActions: [
      { label: 'View Achievements', path: '/achievements' },
      { label: 'Check Leaderboard', path: '/leaderboard' },
    ],
  },

  // ── AI Chat ────────────────────────────────────────────────────────────────
  '/chat': {
    title: 'AI Tutor Chat',
    emoji: '💬',
    description: 'Your personal AI learning assistant',
    tips: [
      'Ask anything about your courses or any topic',
      'The AI remembers your conversation context',
      'Use suggestion chips for quick questions',
      'Ask for explanations, examples, or summaries',
      'The AI adapts to your current level',
    ],
    quickActions: [
      { label: 'Generate a Course', path: '/generate' },
    ],
  },

  // ── Quiz ───────────────────────────────────────────────────────────────────
  '/quiz': {
    title: 'Quiz Time!',
    emoji: '🎯',
    description: 'Test your knowledge and earn XP',
    tips: [
      'Read each question carefully before answering',
      'Use the progress bar to track your position',
      'You can go back to previous questions',
      'Submit only when you\'ve answered all questions',
      'Pass the quiz to earn XP — perfect score earns bonus XP!',
      'You have limited attempts — use them wisely',
    ],
    quickActions: [],
  },

  // ── Achievements ───────────────────────────────────────────────────────────
  '/achievements': {
    title: 'Achievements & Badges',
    emoji: '🏆',
    description: 'Your earned badges and milestones',
    tips: [
      'Earn badges by completing challenges and milestones',
      'Locked badges show what you need to unlock them',
      'Each badge awards bonus XP when earned',
      'Streak badges: log in 7 or 30 days in a row',
      'Level badges: reach Level 5 or Level 10',
    ],
    quickActions: [
      { label: 'Check Leaderboard', path: '/leaderboard' },
      { label: 'View Roadmap', path: '/roadmap' },
    ],
  },

  // ── Leaderboard ────────────────────────────────────────────────────────────
  '/leaderboard': {
    title: 'Global Leaderboard',
    emoji: '🥇',
    description: 'See how you rank against other learners',
    tips: [
      'Rankings are based on total XP earned',
      'Leaderboard updates in real-time',
      'Your position is highlighted in blue',
      'Earn more XP by completing lessons and quizzes',
      'Daily streaks give +20 XP every day',
    ],
    quickActions: [
      { label: 'Earn More XP', path: '/generate' },
    ],
  },

  // ── Tutors ─────────────────────────────────────────────────────────────────
  '/tutors': {
    title: 'Tutor Marketplace',
    emoji: '👨‍🏫',
    description: 'Find and book expert tutors',
    tips: [
      'Search tutors by subject or name',
      'Filter by minimum rating or maximum hourly rate',
      'Only verified tutors appear in the marketplace',
      'Click a tutor to see their full profile and book a session',
      'Sessions are 1-on-1 and scheduled at your convenience',
    ],
    quickActions: [],
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  '/settings': {
    title: 'Account Settings',
    emoji: '⚙️',
    description: 'Manage your account and preferences',
    tips: [
      'Profile tab: Update your name and bio',
      'Security tab: Change your password',
      'Notifications tab: Control email and in-app alerts',
      'Appearance tab: Customize the look and feel',
      'Email address cannot be changed after registration',
    ],
    quickActions: [],
  },

  // ── Tutor Dashboard ────────────────────────────────────────────────────────
  '/tutor/dashboard': {
    title: 'Tutor Dashboard',
    emoji: '📊',
    description: 'Manage your tutoring business',
    tips: [
      'Toggle availability to start accepting bookings',
      'Add time slots so learners can book sessions',
      'Track your earnings and completed sessions',
      'Your profile appears in the marketplace when available',
      'Platform takes 20% commission on each session',
    ],
    quickActions: [
      { label: 'View Marketplace', path: '/tutors' },
    ],
  },

  // ── Admin ──────────────────────────────────────────────────────────────────
  '/admin': {
    title: 'Admin Dashboard',
    emoji: '🛡️',
    description: 'Platform control center',
    tips: [
      'Monitor real-time platform metrics',
      'View user signups and enrollment trends',
      'Track platform revenue and earnings',
      'Quick access to all management sections',
    ],
    quickActions: [
      { label: 'Manage Users', path: '/admin/users' },
      { label: 'Verify Tutors', path: '/admin/tutors' },
    ],
  },
  '/admin/users': {
    title: 'User Management',
    emoji: '👥',
    description: 'Manage all platform users',
    tips: [
      'Search users by name or email',
      'Filter by role: Learner, Tutor, or Admin',
      'Ban users who violate platform rules',
      'Banned users cannot log in until unbanned',
      'You cannot ban other admin accounts',
    ],
    quickActions: [],
  },
  '/admin/tutors': {
    title: 'Tutor Verification',
    emoji: '✅',
    description: 'Review and approve tutor applications',
    tips: [
      'Review submitted documents before approving',
      'Approved tutors appear in the marketplace',
      'Rejected tutors receive a reason for rejection',
      'Pending applications are sorted oldest first',
    ],
    quickActions: [],
  },
  '/admin/courses': {
    title: 'Course Management',
    emoji: '📋',
    description: 'Moderate all platform courses',
    tips: [
      'Feature courses to highlight them in the catalog',
      'Delete courses that violate content policies',
      'AI-generated courses are marked with 🤖',
      'Tutor-created courses are marked with 👨‍🏫',
    ],
    quickActions: [],
  },
  '/admin/analytics': {
    title: 'Analytics & Reports',
    emoji: '📈',
    description: 'Platform performance insights',
    tips: [
      'Switch between 7-day, 30-day, and 90-day views',
      'User Signups chart shows growth trends',
      'Enrollments chart shows course popularity',
      'Quiz Pass Rate shows learning effectiveness',
      'Revenue section shows total and platform earnings',
    ],
    quickActions: [],
  },
};

// ── Onboarding flows ──────────────────────────────────────────────────────────
export const ONBOARDING_FLOWS = {
  learner: [
    {
      step: 1,
      title: 'Welcome! 🎉',
      message: "Hello! I'm **Ana**, your AI professor and personal study assistant on SmartEduLearn.\n\nI'm not just a guide — I can **teach** any topic, **quiz** you, create **study notes**, and give **exam-ready answers**. Let me show you around!",
      action: null,
    },
    {
      step: 2,
      title: 'Generate Your First Course',
      message: "The most powerful feature here is **AI Course Generation**. 🤖\n\nSelect a subject, pick topics, and our AI builds a complete curriculum in seconds. Think of it as having a professor design a course just for you!",
      action: { label: 'Try AI Course Generator', path: '/generate' },
    },
    {
      step: 3,
      title: 'Earn XP & Level Up',
      message: "Every lesson you complete earns **XP (Experience Points)**. 🌟\n\nYou start as a **Novice** and can reach **Sage** (Level 10). It's like a game — but the reward is real knowledge!\n\nCheck your Roadmap to see your full progression path.",
      action: { label: 'View Roadmap', path: '/roadmap' },
    },
    {
      step: 4,
      title: 'AI Tutor Chat',
      message: "Stuck on a concept? Use the **AI Tutor Chat**. 💬\n\nAsk it to explain topics, give examples, or summarize lessons. It adapts to your level and remembers your conversation context.",
      action: { label: 'Open AI Tutor', path: '/chat' },
    },
    {
      step: 5,
      title: "You're All Set! 🚀",
      message: "You're ready to start learning! 🎓\n\nAnd remember — I'm **Ana**, always here in the bottom-right corner. Ask me to:\n• **Explain** any concept\n• **Quiz** you on any topic\n• **Create study notes**\n• **Give exam-ready answers**\n\nLet's learn something great today!",
      action: { label: 'Go to Dashboard', path: '/dashboard' },
    },
  ],
  tutor: [
    {
      step: 1,
      title: 'Welcome, Tutor! 🎉',
      message: "Hello! I'm **Ana**, your AI professor assistant on SmartEduLearn.\n\nAs a tutor, your expertise can help thousands of learners. Let me walk you through getting started!",
      action: null,
    },
    {
      step: 2,
      title: 'Set Your Availability',
      message: "First things first — toggle your **availability to ON** so learners can find and book you. 📅\n\nThen add your available **time slots**. Learners will see these when booking sessions.",
      action: { label: 'Go to Dashboard', path: '/tutor/dashboard' },
    },
    {
      step: 3,
      title: 'Your Profile is Your Brand',
      message: "Learners judge you by your **rating, skills, and bio**. ⭐\n\nA complete, professional profile attracts more bookings. Think of it as your academic CV — make it count!\n\nThe platform takes a **20% commission** on each session.",
      action: { label: 'View Marketplace', path: '/tutors' },
    },
    {
      step: 4,
      title: "You're All Set! 🚀",
      message: "You're ready to start teaching! 🎓\n\nI'm **Ana** — click my face anytime for help navigating the platform or understanding any feature. Good luck with your sessions!",
      action: { label: 'Go to Dashboard', path: '/tutor/dashboard' },
    },
  ],
};

// ── Quick FAQ ─────────────────────────────────────────────────────────────────
export const FAQ = [
  { q: 'How do I earn XP?', a: 'Complete lessons (+10 XP each), pass quizzes (+50 XP), get perfect scores (+100 XP), complete courses (+500 XP), and maintain daily streaks (+20 XP/day).' },
  { q: 'What is a streak?', a: 'A streak counts consecutive days you log in. Check in daily to keep it going! Streaks earn bonus XP and unlock special badges.' },
  { q: 'How does AI course generation work?', a: 'Select a subject, pick topics, set difficulty and hours, then click Generate. Our AI (Google Gemini) builds a full curriculum with modules and lessons in seconds!' },
  { q: 'How do I book a tutor?', a: 'Go to Find Tutors, browse verified tutors, click on one you like, and click "Book a Session". Choose an available time slot to confirm.' },
  { q: 'What are badges?', a: 'Badges are achievements you earn for milestones like 7-day streaks, reaching Level 5, completing courses, or getting perfect quiz scores. Each badge gives bonus XP!' },
  { q: 'How do I level up?', a: 'Earn XP through learning activities. You start at Level 1 (Novice) and can reach Level 10 (Sage). Check your Roadmap to see XP requirements for each level.' },
  { q: 'Is it free?', a: 'Yes! Creating an account and accessing AI-generated courses is free. Some tutor sessions have hourly rates set by the tutors themselves.' },
  { q: 'How do I become a tutor?', a: 'Register with the "Tutor" role, complete your profile, and wait for admin verification. Once approved, you\'ll appear in the tutor marketplace.' },
];
