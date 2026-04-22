# SmartEduLearn — Requirements Breakdown

## Module 1: Auth System
### Features
- Email/password registration with role selection (Learner / Tutor)
- Google OAuth 2.0 login
- JWT access token (15min) + refresh token (7d) stored in Redis
- Role-based route guards (Learner / Tutor / Admin)
- Email verification on register
- Forgot/reset password via email token
- Account ban/suspend by Admin

### User Flows
1. Register → verify email → login → dashboard
2. Google OAuth → auto-create profile → dashboard
3. Forgot password → email link → reset → login

### Edge Cases
- Duplicate email registration
- Google account linked to existing email account
- Expired/invalid reset tokens
- Banned user attempting login
- Token refresh after expiry

---

## Module 2: AI Course Generator
### Features
- Learner inputs: subject, custom topics, difficulty, target hours
- AI generates: structured modules, subtopics, learning objectives, estimated duration
- Generated course saved to DB and linked to learner
- Tutor can also create manual courses
- Course thumbnail auto-generated or uploaded

### User Flows
1. Learner fills form → AI generates outline → preview → save/enroll
2. Tutor creates course manually → adds modules/lessons → publishes

### Edge Cases
- AI timeout / rate limit → graceful fallback message
- Empty or nonsensical input → validation before AI call
- Duplicate course generation → dedup check

---

## Module 3: Gamified Roadmap Engine
### Features
- Skill-tree UI with locked/unlocked levels
- XP points awarded per lesson, quiz, streak
- Level progression (10 levels, each with XP threshold)
- Daily streak tracking (Redis TTL)
- Badges auto-awarded on criteria (first lesson, 7-day streak, course complete, etc.)
- Global + per-course leaderboard (Redis sorted set)
- Adaptive difficulty: AI adjusts next lesson difficulty based on quiz scores

### User Flows
1. Complete lesson → earn XP → check level up → unlock next node
2. Login daily → streak increments → streak badge at 7/30/100 days
3. Complete course → certificate issued → leaderboard updated

### Edge Cases
- Streak reset if user misses a day (grace period: midnight UTC)
- XP overflow at max level → cosmetic rewards only
- Leaderboard tie-breaking by time achieved

---

## Module 4: AI Tutor Chat
### Features
- Context-aware chat (knows current course, module, lesson)
- RAG pipeline: answers grounded in course content via Pinecone
- Chat history persisted per session in MongoDB
- Summarize lesson on demand
- Explain concept with examples
- Never gives direct quiz answers — guides instead

### User Flows
1. Learner opens chat → asks question → AI responds with course context
2. Learner asks for summary → AI returns bullet-point summary
3. Learner asks off-topic → AI redirects politely

### Edge Cases
- Very long chat history → summarize older messages, keep last 10 in context
- Course content not yet indexed → fallback to general LLM knowledge
- OpenAI API failure → retry once, then return friendly error

---

## Module 5: Quiz Engine
### Features
- AI-generated quizzes per lesson (MCQ, case-based, coding)
- Timer-based mode (configurable per quiz)
- Auto-evaluation with score + per-question feedback
- XP awarded on pass; bonus XP for perfect score
- Retry allowed (max 3 attempts, best score kept)
- Quiz results stored with full answer breakdown

### User Flows
1. Learner opens lesson → takes quiz → submits → sees score + feedback
2. Failed quiz → retry → improved score → XP updated
3. Tutor creates custom quiz for their course

### Edge Cases
- Timer expiry → auto-submit with answers filled so far
- Coding question evaluation → basic test-case matching
- All 3 attempts failed → lesson marked as "needs review"

---

## Module 6: Tutor Marketplace
### Features
- Tutors register with: skills, experience, hourly rate, bio
- Document upload: certificate, resume, ID proof (S3)
- Admin verification workflow (approve/reject)
- Public tutor profiles with ratings, reviews, availability
- Search/filter tutors by subject, rating, price, availability
- Availability toggle + time slot scheduling

### User Flows
1. Tutor registers → uploads docs → pending verification
2. Admin reviews docs → approves → tutor goes live
3. Learner searches tutors → views profile → books session

### Edge Cases
- Tutor submits fake documents → Admin flags + rejects
- Tutor goes offline mid-booking → session cancelled, learner refunded
- Rating manipulation → one review per completed session

---

## Module 7: Booking System
### Features
- Learner books available time slot
- Tutor accepts/rejects within 24h (auto-reject if no response)
- Zoom/Meet link generated on confirmation
- Session reminders (24h + 1h before)
- Post-session: both parties leave review
- Earnings tracked per session (platform takes 20% commission)

### User Flows
1. Learner picks slot → pays → booking pending
2. Tutor confirms → meeting link sent to both
3. Session completes → review prompt → earnings credited

### Edge Cases
- Double-booking prevention (slot locked on payment)
- Cancellation policy (full refund >24h, 50% <24h)
- No-show handling (admin dispute resolution)

---

## Module 8: Learner Dashboard
### Features
- Course progress (% complete, last lesson)
- XP, level, streak display
- Time spent learning (daily/weekly chart)
- Upcoming tutor sessions
- AI recommendations (next course)
- Achievements (badges earned)
- Leaderboard rank

### User Flows
1. Learner logs in → sees dashboard → resumes last course
2. Checks achievements → views badge collection
3. Sees recommendation → enrolls in new course

---

## Module 9: Admin Panel
### Features
- Global metrics dashboard (users, revenue, engagement)
- User management (view, filter, ban, role change)
- Tutor verification (review docs, approve/reject)
- Course CMS (view all, edit, delete, feature)
- Revenue & commission tracking
- Engagement analytics (completion rates, drop-offs, quiz scores)
- Broadcast notifications (email + in-app)
- Support ticket management
- Platform settings (feature toggles, AI config, API keys)

### User Flows
1. Admin logs in → sees global dashboard
2. Reviews pending tutor applications → approves/rejects
3. Receives complaint → reviews content → moderates
4. Exports monthly revenue report as CSV

### Edge Cases
- Admin accidentally bans wrong user → unban flow
- Bulk actions (ban multiple users) → confirmation required
- Revenue discrepancy → audit log trail
