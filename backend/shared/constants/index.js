module.exports = {
  ROLES: { LEARNER: 'learner', TUTOR: 'tutor', ADMIN: 'admin' },

  XP: {
    LESSON_COMPLETE: 10,
    QUIZ_PASS: 50,
    QUIZ_PERFECT: 100,
    COURSE_COMPLETE: 500,
    DAILY_STREAK: 20,
    FIRST_LOGIN: 50,
  },

  LEVELS: [
    { level: 1, xp_required: 0,    title: 'Novice' },
    { level: 2, xp_required: 100,  title: 'Explorer' },
    { level: 3, xp_required: 300,  title: 'Learner' },
    { level: 4, xp_required: 600,  title: 'Scholar' },
    { level: 5, xp_required: 1000, title: 'Expert' },
    { level: 6, xp_required: 1500, title: 'Master' },
    { level: 7, xp_required: 2200, title: 'Champion' },
    { level: 8, xp_required: 3000, title: 'Legend' },
    { level: 9, xp_required: 4000, title: 'Grandmaster' },
    { level: 10, xp_required: 5500, title: 'Sage' },
  ],

  PLATFORM_FEE_PERCENT: 20,

  NOTIFICATION_TYPES: {
    COURSE_ENROLLED: 'course_enrolled',
    LESSON_COMPLETE: 'lesson_complete',
    QUIZ_RESULT: 'quiz_result',
    BADGE_EARNED: 'badge_earned',
    LEVEL_UP: 'level_up',
    SESSION_BOOKED: 'session_booked',
    SESSION_CONFIRMED: 'session_confirmed',
    TUTOR_APPROVED: 'tutor_approved',
    TUTOR_REJECTED: 'tutor_rejected',
    PAYMENT_SUCCESS: 'payment_success',
    ANNOUNCEMENT: 'announcement',
  },
};
