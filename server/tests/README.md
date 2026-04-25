# 🧪 SmartEduLearn Test Suite

Comprehensive API tests for all services — auth, courses, gamification, tutors, payments, notifications, admin.

## Prerequisites

1. **Server must be running** on `http://localhost:3001`
2. **Databases must be up** (PostgreSQL, MongoDB, Redis)
3. **Test user exists**: `test@example.com` / `password123` with `admin` role

## Run Tests

```bash
# All tests
npm test

# Verbose output
npm run test:verbose

# With coverage
npm run test:coverage

# Single suite
npm test -- tests/02_auth.test.js
```

## Test Suites

| Suite | File | Coverage |
|-------|------|----------|
| **01 — Health** | `01_health.test.js` | Server health, 404 handling, auth middleware |
| **02 — Auth** | `02_auth.test.js` | Register, login, token refresh, logout, role-based access, validation |
| **03 — Courses** | `03_courses.test.js` | List, get, create (tutor), update, enroll (learner), access control |
| **04 — Gamification** | `04_gamification.test.js` | XP, streaks, leaderboard, profile, role restrictions |
| **05 — Tutors** | `05_tutor.test.js` | List, profile, availability, slots, earnings, booking, role restrictions |
| **06 — Notifications** | `06_notifications.test.js` | Get, mark read, mark all read, internal create |
| **07 — Payments** | `07_payments.test.js` | History, subscription validation, access control |
| **08 — Admin** | `08_admin.test.js` | Dashboard, user management, ban/unban, analytics, audit log |

## Test Strategy

- **Integration tests** — tests run against the live server (not mocked)
- **Isolated users** — each suite creates fresh test users with timestamps
- **Sequential execution** — `--runInBand` prevents race conditions
- **Cleanup** — `--forceExit` ensures clean shutdown

## Expected Results

- ✅ **~60+ tests** covering all major flows
- ✅ **Auth**: registration, login, token refresh, role-based access
- ✅ **Learner**: course enrollment, XP earning, streaks, leaderboard
- ✅ **Tutor**: availability, slots, earnings, session management
- ✅ **Admin**: user management, tutor verification, analytics
- ✅ **Error cases**: 401, 403, 404, 400 validation errors

## Notes

- Tests create real data in the database (use test DB in production)
- Admin tests require pre-seeded admin user
- Stripe tests validate structure only (no real charges)
- AI tests skipped if `GEMINI_API_KEY` not set
