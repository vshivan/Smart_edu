# 🎓 SmartEduLearn

> AI-powered personalized learning platform — combining AI course generation, gamified progression, tutor marketplace, and enterprise admin control.

---

## 🏗️ Project Structure

```
smartedulear/
├── server/                   # Unified backend (all services in one)
│   ├── src/
│   │   ├── index.js          # Entry point — Express + Socket.io
│   │   ├── config/
│   │   │   ├── db.js         # PostgreSQL + MongoDB connections
│   │   │   └── passport.js   # Google OAuth strategy
│   │   ├── middleware/
│   │   │   ├── auth.js       # JWT authenticate + authorize
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js   # Joi validation middleware
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── course.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── quiz.routes.js
│   │   │   ├── gamification.routes.js
│   │   │   ├── tutor.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── notification.routes.js
│   │   │   └── admin.routes.js
│   │   ├── services/         # Business logic
│   │   ├── models/           # Mongoose models (MongoDB)
│   │   ├── utils/            # logger, response, errors, paginate
│   │   └── constants/        # XP, levels, roles, notification types
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # React + Vite + Tailwind
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── database/
│   └── schema.sql            # PostgreSQL schema + seed data
├── docker-compose.yml        # Single-file full-stack orchestration
├── .env.example              # All environment variables
└── package.json              # Root scripts
```

---

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Gemini API key](https://aistudio.google.com/app/apikey) *(free)*

### Option A — Full Docker (recommended)
```bash
# 1. Clone
git clone https://github.com/vshivan/Smart_edu.git
cd Smart_edu

# 2. Create your .env
cp .env.example .env
# Edit .env and fill in at minimum: JWT_SECRET, GEMINI_API_KEY

# 3. Launch everything
docker-compose up -d

# App is live at:
#   Frontend  → http://localhost
#   API       → http://localhost:3000
#   Health    → http://localhost:3000/health
```

### Option B — Local development
```bash
# 1. Start databases only
npm run docker:db

# 2. Install dependencies
npm run install:all

# 3. Copy and configure env
cp .env.example .env
# Set DATABASE_URL=postgresql://sel_user:sel_pass@localhost:5432/smartedulear
# Set MONGODB_URL=mongodb://localhost:27017
# Set REDIS_URL=redis://localhost:6379

# 4. Run database migrations
npm run db:migrate

# 5. Start backend (port 3000)
npm run dev:server

# 6. Start frontend (port 5173)
npm run dev:frontend
```

### Minimum required keys in `infrastructure/.env`
```env
JWT_SECRET=any-long-random-string-min-32-chars
GEMINI_API_KEY=your-key-from-aistudio.google.com
```
Everything else (Stripe, Pinecone, S3, SMTP, Google OAuth) is optional for local dev.

---

## 🐳 Docker Commands

```bash
npm run docker:up       # Start all containers
npm run docker:down     # Stop all containers
npm run docker:build    # Rebuild images
npm run docker:logs     # Tail all logs
npm run docker:logs:server  # Tail backend logs only
npm run docker:db       # Start databases only
npm run docker:clean    # Stop + remove volumes (full reset)
```

---

## 🔌 API Endpoints

All routes are served from a single backend on port `3000`.

| Prefix           | Description                          |
|------------------|--------------------------------------|
| `POST /auth/*`   | Register, login, OAuth, refresh      |
| `GET/POST /courses/*` | Course catalog, enrollment, progress |
| `POST /ai/*`     | Course gen, quiz gen, AI chat tutor  |
| `GET/POST /quizzes/*` | Quiz engine, attempts, results  |
| `GET/POST /gamification/*` | XP, streaks, leaderboard, badges |
| `GET/POST /tutors/*` | Marketplace, slots, bookings      |
| `POST /payments/*` | Stripe checkout, subscriptions     |
| `GET/PUT /notifications/*` | In-app notifications, email  |
| `GET/PUT /admin/*` | Full admin control panel           |
| `GET /health`    | Health check                         |

---

## 👥 User Roles

| Role    | Key Features |
|---------|-------------|
| Learner | AI course gen, gamified roadmap, AI chat tutor, quizzes, leaderboard |
| Tutor   | Course creation, availability, session booking, earnings dashboard |
| Admin   | Full platform control — users, tutors, courses, analytics, revenue |

---

## 🤖 AI Features (Gemini)

| Feature | Endpoint |
|---------|----------|
| Course Generation | `POST /ai/generate-course` |
| Quiz Generation | `POST /ai/generate-quiz` |
| AI Chat Tutor | `POST /ai/chat` |
| Lesson Summarizer | `POST /ai/summarize` |
| Recommendations | `POST /ai/recommendations` |

---

## 🎮 Gamification

- **XP**: Lesson (10), Quiz pass (50), Perfect score (100), Course complete (500), Daily streak (20)
- **Levels**: 10 levels — Novice → Sage
- **Streaks**: Daily login tracked in Redis with 48h grace window
- **Badges**: Auto-awarded on criteria
- **Leaderboard**: Redis sorted set for real-time global rankings

---

## 📄 License
MIT © SmartEduLearn
