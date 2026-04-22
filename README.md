# 🎓 SmartEduLearn

> AI-powered personalized learning platform — combining AI course generation, gamified progression, tutor marketplace, and enterprise admin control.

---

## 🏗️ What's Built

```
smartedulear/
├── backend/
│   ├── api-gateway/          # Port 3000 — routing, rate limiting, Socket.io
│   ├── auth-service/         # Port 3001 — JWT, Google OAuth, sessions
│   ├── course-service/       # Port 3003 — courses, modules, lessons, progress
│   ├── ai-service/           # Port 3004 — GPT-4o, RAG, course gen, chat tutor
│   ├── quiz-service/         # Port 3005 — quiz engine, auto-grading
│   ├── gamification-service/ # Port 3006 — XP, badges, streaks, leaderboard
│   ├── tutor-service/        # Port 3007 — marketplace, bookings, earnings
│   ├── payment-service/      # Port 3008 — Stripe, subscriptions, commissions
│   ├── notification-service/ # Port 3010 — email, in-app, broadcast
│   ├── admin-service/        # Port 3011 — full admin control
│   └── shared/               # Shared middleware, utils, constants
├── frontend/                 # React + Vite + Tailwind + Framer Motion
│   ├── pages/
│   │   ├── LandingPage
│   │   ├── auth/             # Login, Register, OAuth callback
│   │   ├── learner/          # Dashboard, GenerateCourse, Roadmap, AIChat,
│   │   │                     # QuizPage, CourseCatalog, Leaderboard, Achievements
│   │   ├── tutor/            # TutorDashboard
│   │   └── admin/            # Dashboard, Users, Tutors, Courses, Analytics
│   ├── components/           # Navbar, Sidebar, TopBar, XPBar
│   ├── store/                # Zustand auth store
│   └── lib/                  # Axios API client, constants
├── database/
│   └── schema.sql            # Full PostgreSQL schema with indexes + seed data
├── infrastructure/
│   ├── docker-compose.yml    # Full stack orchestration
│   └── .env.example          # All environment variables
└── docs/
    ├── requirements.md       # Full feature breakdown + edge cases
    └── architecture.md       # System diagram + service map
```

---

## 🚀 Quick Start (Fresh Machine)

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(recommended for databases)*
- A [Gemini API key](https://aistudio.google.com/app/apikey) *(free)*

### Option A — Automated setup
```bash
git clone https://github.com/your-username/smartedulear.git
cd smartedulear
bash setup.sh
```

### Option B — Manual steps
```bash
# 1. Clone
git clone https://github.com/your-username/smartedulear.git
cd smartedulear

# 2. Create your .env (then fill in your keys)
cp infrastructure/.env.example infrastructure/.env

# 3. Start databases only
npm run docker:db

# 4. Install and start each backend service
cd backend/auth-service   && npm install && npm run dev &
cd backend/course-service && npm install && npm run dev &
cd backend/ai-service     && npm install && npm run dev &
cd backend/quiz-service   && npm install && npm run dev &
cd backend/gamification-service && npm install && npm run dev &
cd backend/tutor-service  && npm install && npm run dev &
cd backend/payment-service && npm install && npm run dev &
cd backend/notification-service && npm install && npm run dev &
cd backend/admin-service  && npm install && npm run dev &
cd backend/api-gateway    && npm install && npm run dev &

# 5. Start frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

### Option C — Full Docker (everything containerized)
```bash
cp infrastructure/.env.example infrastructure/.env
# Fill in your keys in infrastructure/.env
npm run docker:up
# → http://localhost (port 80)
```

### Minimum required keys in `.env`
```
JWT_SECRET=any-long-random-string
GEMINI_API_KEY=your-key-from-aistudio.google.com
GOOGLE_CLIENT_ID=from-console.cloud.google.com
GOOGLE_CLIENT_SECRET=from-console.cloud.google.com
```
Everything else (Stripe, Pinecone, S3, SMTP) is optional for local dev.

---

## 👥 User Roles & Access

| Role    | Key Features |
|---------|-------------|
| Learner | AI course gen, gamified roadmap, AI chat tutor, quizzes, leaderboard |
| Tutor   | Course creation, availability, session booking, earnings dashboard |
| Admin   | Full platform control — users, tutors, courses, analytics, revenue |

---

## 🤖 AI Features

| Feature | Implementation |
|---------|---------------|
| Course Generation | GPT-4o with structured JSON output |
| Quiz Generation | GPT-4o with difficulty distribution |
| AI Chat Tutor | GPT-4o + RAG via Pinecone vector search |
| Lesson Summarizer | GPT-4o with formatted output |
| Recommendations | GPT-4o with learner profile context |

---

## 🎮 Gamification System

- **XP**: Earned per lesson (10), quiz pass (50), perfect score (100), course complete (500)
- **Levels**: 10 levels from Novice → Sage with XP thresholds
- **Streaks**: Daily login tracked in Redis with 48h grace window
- **Badges**: Auto-awarded on criteria (streak milestones, level ups, completions)
- **Leaderboard**: Redis sorted set for real-time global rankings

---

## 🔐 Security

- JWT access tokens (15min) + refresh tokens (7d) stored in Redis
- Role-based authorization on every protected route
- Rate limiting: 100 req/min general, 10 req/min auth endpoints
- Helmet.js security headers on all services
- Input validation via Joi on all POST/PUT endpoints
- Stripe webhook signature verification

---

## 📊 Admin Panel

Enterprise-grade control at `/admin`:
- **Dashboard**: Real-time metrics with Recharts visualizations
- **Users**: Search, filter, ban/unban with audit trail
- **Tutors**: Document review, approve/reject workflow
- **Courses**: CMS with feature/delete controls
- **Analytics**: 7d/30d/90d charts — signups, enrollments, quiz stats, revenue

---

## 🧪 Phase 8: Testing (Next Steps)

```bash
# API testing
npm install -g jest supertest

# Run tests
npm test --prefix backend/auth-service

# Security audit
npm audit --prefix backend/auth-service
```

---

## 📄 License
MIT © SmartEduLearn
