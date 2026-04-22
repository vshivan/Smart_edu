require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const svc = require('./services/tutor.service');
const { authenticate, authorize } = require('../../shared/middleware/auth');
const { sendSuccess, sendCreated, sendPaginated } = require('../../shared/utils/response');
const { errorHandler, notFound } = require('../../shared/middleware/errorHandler');
const logger = require('../../shared/utils/logger');

const app = express();
const PORT = process.env.TUTOR_SERVICE_PORT || 3007;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'tutor-service' }));

// Public
app.get('/tutors',          async (req, res, next) => { try { const r = await svc.listTutors(req.query); sendPaginated(res, r.tutors, r); } catch(e){next(e);} });
app.get('/tutors/:id',      async (req, res, next) => { try { sendSuccess(res, await svc.getTutorProfile(req.params.id)); } catch(e){next(e);} });
app.get('/tutors/:id/slots',authenticate, async (req, res, next) => { try { sendSuccess(res, await svc.getAvailableSlots(req.params.id, req.query.date)); } catch(e){next(e);} });

// Tutor actions
app.put('/tutors/availability', authenticate, authorize('tutor'), async (req, res, next) => { try { sendSuccess(res, await svc.updateAvailability(req.user.id, req.body.is_available)); } catch(e){next(e);} });
app.post('/tutors/slots',       authenticate, authorize('tutor'), async (req, res, next) => { try { sendCreated(res, await svc.addSlots(req.user.id, req.body.slots)); } catch(e){next(e);} });
app.get('/tutors/earnings',     authenticate, authorize('tutor'), async (req, res, next) => { try { sendSuccess(res, await svc.getTutorEarnings(req.user.id)); } catch(e){next(e);} });
app.put('/tutors/sessions/:id/status', authenticate, authorize('tutor'), async (req, res, next) => { try { sendSuccess(res, await svc.updateSessionStatus(req.params.id, req.user.id, req.body.status)); } catch(e){next(e);} });

// Learner actions
app.post('/tutors/sessions/book', authenticate, authorize('learner'), async (req, res, next) => { try { sendCreated(res, await svc.bookSession(req.user.id, req.body), 'Session booked'); } catch(e){next(e);} });

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Tutor service → port ${PORT}`));
module.exports = app;
