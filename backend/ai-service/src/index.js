require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const aiRoutes = require('./routes/ai.routes');
const { errorHandler, notFound } = require('../../shared/middleware/errorHandler');
const { authenticate } = require('../../shared/middleware/auth');
const logger = require('../../shared/utils/logger');
require('./config/db');

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3004;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(express.json({ limit: '50kb' }));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'ai-service' }));
app.use('/ai', authenticate, aiRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`AI service → port ${PORT}`));
module.exports = app;
