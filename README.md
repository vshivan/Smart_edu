# 🎓 SmartEduLearn

> AI-powered personalized learning platform — combining AI course generation, gamified progression, tutor marketplace, and enterprise admin control.

---

## 🏗️ Project Structure

```
smartedulear/
├── backend/
│   ├── Dockerfile                # Single Dockerfile for ALL backend services
│   │                             # Uses ARG SERVICE to select which one to build
│   ├── shared/                   # Shared middleware, utils, constants
│   │                             # Copied into every service at build time
│   ├── api-gateway/              # Port 3000 — routing, rate limiting, Socket.io
│   ├── auth-service/             # Port 3001 — JWT, Google OAuth, sessions
│   ├── course-service/           # Port 3003 — courses, modules, lessons, progress
│   ├── ai-service/               # Port 3004 — Gemini AI, RAG, course gen, chat tutor
│   ├── quiz-service/             # Port 3005 — quiz engine, auto-grading
│   ├── gamification-service/     # Port 3006 — XP, badges, streaks, leaderboard
│   ├── tutor-service/            # Port 3007 — marketplace, bookings, earnings
│   ├── payment-service/          # Port 3008 — Stripe, subscriptions, commissions
│   ├── notification-service/     # Port 3010 — email, in-app, broadcast
│   └── admin-service/            # Port 3011 — full admin control
├── frontend/                     # React + Vite + Tailwind + Framer Motion
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── auth/             # Login, Register, OAuth callback
│   │   │   ├── learner/          # Dashboard, GenerateCourse, Roadmap, AIChat,
│   │   │   │                     # QuizPage, CourseCatalog, Leaderboard, Achievements
│   │   │   ├── tutor/            # TutorDashboard
│   │   │   └── admin/            # Dashboard, Users, Tutors, Courses, Analytics
│   │   ├── components/           # Navbar, Sidebar, TopBar, XPBar
│   │   ├── store/                # Zustand auth store
│   │   └── lib/                  # Axios API client, constants
│   └── Dockerfile                # Frontend Docker build (nginx)
├── database/
│   └── schema.sql                # Full PostgreSQL schema with indexes + seed data
├── infrastructure/
│   ├── docker-compose.yml        # Full stack orchestration
│   └── .env.example              # All environment variables documented
└── docs/
    ├── requirements.md           # Full feature breakdown + edge cases
    └── architecture.md           # System diagram + service map
```

---

## 🐳 Docker Architecture

All 10 backend services share a **single `backend/Dockerfile`**. The service to build is selected via a build argument:

```bash
# Build a specific service manually
docker build --build-arg SERVICE=auth-service -t sel-auth ./backend
docker build --build-arg SERVICE=ai-service   -t sel-ai   ./backend
```

`docker-compose.yml` handles this automatically — each service entry passes its own `SERVICE` arg:

```yaml
auth-service:
  build:
    context: ../backend
    dockerfile: Dockerfile
    args:
      SERVICE: auth-service
```

**Why one Dockerfile?**
All services are Node.js with identical structure (`src/index.js` entry point). One file to maintain instead of 10 near-identical copies. If a base image update is needed, change it in one place.

---

## 🚀 Quick Start (Fresh Machine)

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(recommended — runs all 3 databases)*
- A [Gemini API key](https://aistudio.google.com/app/apikey) *(free)*

### Option A — Automated setup
```bash
git clone https://github.com/vshivan/Smart_edu.git
cd Smart_edu
bash setup.sh
```

### Option B — Manual (databases via Docker, services locally)
```bash
# 1. Clone
git clone https://github.com/vshivan/Smart_edu.git
cd Smart_edu

# 2. Create your .env
cp infrastructure/.env.example infrastructure/.env
# Open infrastructure/.env and fill in your keys (see below)

# 3. Start only the databases
npm run docker:db

# 4. Install and start each backend service
cd backend/auth-service          && npm install && npm run dev
cd backend/course-service        && npm install && npm run dev
cd backend/ai-service            && npm install && npm run dev
cd backend/quiz-service          && npm install && npm run dev
cd backend/gamification-service  && npm install && npm run dev
cd backend/tutor-service         && npm install && npm run dev
cd backend/payment-service       && npm install && npm run dev
cd backend/notification-service  && npm install && npm run dev
cd backend/admin-service         && npm install && npm run dev
cd backend/api-gateway           && npm install && npm run dev

# 5. Start frontend
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

### Option C — Full Docker (everything in containers)
```bash
cp infrastructure/.env.example infrastructure/.env
# Fill in your keys, then:
npm run docker:up
# → http://localhost
```

### Minimum required keys in `infrastructure/.env`
```env
JWT_SECRET=any-long-random-string-min-32-chars
GEMINI_API_KEY=your-key-from-aistudio.google.com
GOOGLE_CLIENT_ID=from-console.cloud.google.com
GOOGLE_CLIENT_SECRET=from-console.cloud.google.com
```
Everything else (Stripe, Pinecone, S3, SMTP) is optional for local development.

---

## 👥 User Roles

| Role    | Key Features |
|---------|-------------|
| Learner | AI course gen, gamified roadmap, AI chat tutor, quizzes, leaderboard |
| Tutor   | Course creation, availability, session booking, earnings dashboard |
| Admin   | Full platform control — users, tutors, courses, analytics, revenue |

---

## 🤖 AI Features (Powered by Gemini)

| Feature | Model | Notes |
|---------|-------|-------|
| Course Generation | gemini-1.5-flash | Structured JSON output, 4–8 modules |
| Quiz Generation | gemini-1.5-flash | MCQ with difficulty distribution |
| AI Chat Tutor | gemini-1.5-flash | Context-aware, RAG via Pinecone |
| Lesson Summarizer | gemini-1.5-flash | Formatted key takeaways |
| Recommendations | gemini-1.5-flash | Learner profile-aware |
| Embeddings (RAG) | text-embedding-004 | Pinecone vector search |

Switch to `gemini-1.5-pro` in `.env` for higher quality responses.

---

## 🎮 Gamification System

- **XP**: Lesson complete (+10), quiz pass (+50), perfect score (+100), course complete (+500)
- **Levels**: 10 levels — Novice → Explorer → Scholar → Expert → Master → Sage
- **Streaks**: Daily login tracked in Redis, 48h grace window before reset
- **Badges**: Auto-awarded on criteria (streak milestones, level ups, completions)
- **Leaderboard**: Redis sorted set, real-time global rankings

---

## 🔐 Security

- JWT access tokens (15min) + refresh tokens (7d) in Redis
- Role-based authorization on every protected route
- Rate limiting: 100 req/min general, 10 req/min on auth endpoints
- Helmet.js security headers on all services
- Joi input validation on all POST/PUT endpoints
- Stripe webhook signature verification

---

## 📊 Admin Panel

Enterprise-grade control at `/admin`:
- **Dashboard** — real-time metrics with Recharts charts
- **Users** — search, filter by role, ban/unban with audit trail
- **Tutors** — document review, approve/reject workflow
- **Courses** — CMS with feature/delete/moderate controls
- **Analytics** — 7d/30d/90d charts for signups, enrollments, quiz stats, revenue

---

## 🛠️ Available Scripts

```bash
npm run docker:up      # Start full stack (all services + databases)
npm run docker:down    # Stop everything
npm run docker:db      # Start databases only (PostgreSQL, MongoDB, Redis)
npm run docker:logs    # Tail logs from all containers
npm run dev:frontend   # Start React dev server
npm run dev:auth       # Start auth-service in dev mode
npm run dev:ai         # Start ai-service in dev mode
# (dev:course, dev:quiz, dev:gamify, dev:tutor, dev:payment, dev:notify, dev:admin, dev:gateway)
```

---

## 📄 License
MIT © SmartEduLearn
