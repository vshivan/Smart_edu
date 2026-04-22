require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const router = require('express').Router();
const svc = require('./services/gamification.service');
const { authenticate, authorize } = require('../shared/middleware/auth');
const { sendSuccess } = require('../shared/utils/response');
const { errorHandler, notFound } = require('../shared/middleware/errorHandler');
const logger = require('../shared/utils/logger');

const app = express();
const PORT = process.env.GAMIFICATION_SERVICE_PORT || 3006;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'gamification-service' }));

app.get('/gamification/profile',     authenticate, authorize('learner'), async (req, res, next) => { try { sendSuccess(res, await svc.getGamificationProfile(req.user.id)); } catch(e){next(e);} });
app.get('/gamification/leaderboard', authenticate, async (req, res, next) => { try { sendSuccess(res, await svc.getLeaderboard(parseInt(req.query.limit) || 20)); } catch(e){next(e);} });
app.post('/gamification/streak',     authenticate, authorize('learner'), async (req, res, next) => { try { sendSuccess(res, await svc.checkStreak(req.user.id)); } catch(e){next(e);} });
app.post('/gamification/xp',         authenticate, async (req, res, next) => { try { sendSuccess(res, await svc.awardXP(req.user.id, req.body.amount, req.body.reason)); } catch(e){next(e);} });

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Gamification service → port ${PORT}`));
module.exports = app;
