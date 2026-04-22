# SmartEduLearn — System Architecture

## High-Level Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                 │
│                                                                       │
│   ┌─────────────┐    ┌─────────────┐    ┌──────────────────────┐    │
│   │   Learner   │    │    Tutor    │    │    Admin Panel       │    │
│   │   Web App   │    │  Dashboard  │    │  (Enterprise UI)     │    │
│   └──────┬──────┘    └──────┬──────┘    └──────────┬───────────┘    │
└──────────┼─────────────────┼──────────────────────┼────────────────┘
           │                 │                      │
           └─────────────────┴──────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY  :3000                                 │
│         Rate Limiting │ JWT Validation │ Request Routing              │
│         CORS │ Helmet │ Request Logging │ Socket.io Hub               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
     ┌─────────────────────────┼──────────────────────────┐
     │                         │                          │
     ▼                         ▼                          ▼
┌──────────┐           ┌──────────────┐           ┌──────────────┐
│  auth    │           │    user      │           │   course     │
│ :3001    │           │   :3002      │           │   :3003      │
└──────────┘           └──────────────┘           └──────────────┘
     │                         │                          │
     ▼                         ▼                          ▼
┌──────────┐           ┌──────────────┐           ┌──────────────┐
│    ai    │           │    quiz      │           │ gamification │
│  :3004   │           │   :3005      │           │   :3006      │
└──────────┘           └──────────────┘           └──────────────┘
     │                         │                          │
     ▼                         ▼                          ▼
┌──────────┐           ┌──────────────┐           ┌──────────────┐
│  tutor   │           │   payment    │           │  analytics   │
│  :3007   │           │   :3008      │           │   :3009      │
└──────────┘           └──────────────┘           └──────────────┘
     │                         │
     ▼                         ▼
┌──────────┐           ┌──────────────┐
│  notify  │           │    admin     │
│  :3010   │           │   :3011      │
└──────────┘           └──────────────┘

                       DATA LAYER
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │   MongoDB    │   │    Redis     │
│  :5432       │   │   :27017     │   │   :6379      │
│  Core data   │   │  AI/flex     │   │  Cache/RT    │
└──────────────┘   └──────────────┘   └──────────────┘

                       AI LAYER
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  OpenAI API  │   │  LangChain   │   │   Pinecone   │
│  GPT-4o      │   │  RAG/Chain   │   │  Vector DB   │
└──────────────┘   └──────────────┘   └──────────────┘

                     STORAGE LAYER
┌──────────────┐   ┌──────────────┐
│   AWS S3     │   │  Cloudinary  │
│  Documents   │   │   Images     │
└──────────────┘   └──────────────┘
```

## Service Responsibilities

| Service | Port | DB | Responsibility |
|---------|------|----|----------------|
| api-gateway | 3000 | Redis | Routing, rate limiting, auth validation, WebSocket hub |
| auth-service | 3001 | PostgreSQL + Redis | JWT, OAuth, sessions, password reset |
| user-service | 3002 | PostgreSQL | Profiles, preferences, progress |
| course-service | 3003 | PostgreSQL + MongoDB | Course CRUD, modules, lessons, CMS |
| ai-service | 3004 | MongoDB + Pinecone | LLM calls, RAG, course gen, chat tutor |
| quiz-service | 3005 | PostgreSQL + MongoDB | Quiz gen, evaluation, results |
| gamification-service | 3006 | PostgreSQL + Redis | XP, badges, streaks, leaderboard |
| tutor-service | 3007 | PostgreSQL | Availability, bookings, sessions |
| payment-service | 3008 | PostgreSQL | Stripe, subscriptions, commissions |
| analytics-service | 3009 | PostgreSQL + MongoDB | Engagement, reporting, exports |
| notification-service | 3010 | MongoDB + Redis | Email, in-app, push |
| admin-service | 3011 | All DBs | Admin operations, moderation |

## Auth Flow

```
Client → POST /auth/login
       → auth-service validates credentials
       → issues accessToken (JWT, 15min) + refreshToken (7d)
       → refreshToken stored in Redis: session:{userId}
       → Client stores tokens

Protected Request:
Client → Bearer token in Authorization header
       → api-gateway middleware verifies JWT
       → Injects req.user = { id, email, role }
       → Routes to target service

Token Refresh:
Client → POST /auth/refresh { refreshToken }
       → auth-service verifies token + checks Redis
       → Issues new token pair
```

## Real-Time (Socket.io)

```
Namespaces:
  /chat          → Learner ↔ Tutor real-time messaging
  /notifications → Live notification delivery
  /leaderboard   → Real-time XP rank updates
```

## AI / RAG Pipeline

```
User Question
     │
     ▼
Embed query (text-embedding-3-small)
     │
     ▼
Pinecone similarity search → top-k course chunks
     │
     ▼
LangChain context assembly
     │
     ▼
GPT-4o completion with system prompt + context
     │
     ▼
Structured response → client
```
