require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const courseRoutes = require('./routes/course.routes');
const { errorHandler, notFound } = require('../../shared/middleware/errorHandler');
const { authenticate } = require('../../shared/middleware/auth');
const logger = require('../../shared/utils/logger');

const app = express();
const PORT = process.env.COURSE_SERVICE_PORT || 3003;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'course-service' }));
app.use('/courses', courseRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Course service → port ${PORT}`));
module.exports = app;
