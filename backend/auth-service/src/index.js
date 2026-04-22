require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');

const authRoutes = require('./routes/auth.routes');
const { errorHandler, notFound } = require('../../shared/middleware/errorHandler');
const logger = require('../../shared/utils/logger');
require('./config/passport');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(passport.initialize());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'auth-service' }));
app.use('/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Auth service → port ${PORT}`));
module.exports = app;
