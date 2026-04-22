require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const svc = require('./services/quiz.service');
const { authenticate, authorize } = require('../../shared/middleware/auth');
const { sendSuccess } = require('../../shared/utils/response');
const { errorHandler, notFound } = require('../../shared/middleware/errorHandler');
const logger = require('../../shared/utils/logger');

const app = express();
const PORT = process.env.QUIZ_SERVICE_PORT || 3005;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'quiz-service' }));

app.get('/quizzes/:id',                    authenticate, async (req, res, next) => { try { sendSuccess(res, await svc.getQuiz(req.params.id, req.user.id)); } catch(e){next(e);} });
app.post('/quizzes/:id/attempt',           authenticate, authorize('learner'), async (req, res, next) => { try { sendSuccess(res, await svc.submitQuiz(req.params.id, req.user.id, req.body)); } catch(e){next(e);} });
app.get('/quizzes/attempts/:attemptId',    authenticate, async (req, res, next) => { try { sendSuccess(res, await svc.getAttemptResult(req.params.attemptId, req.user.id)); } catch(e){next(e);} });

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Quiz service → port ${PORT}`));
module.exports = app;
