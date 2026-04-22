require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const adminRoutes = require('./routes/admin.routes');
const { errorHandler, notFound } = require('../../shared/middleware/errorHandler');
const logger = require('../../shared/utils/logger');

const app = express();
const PORT = process.env.ADMIN_SERVICE_PORT || 3011;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true }));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'admin-service' }));
app.use('/admin', adminRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Admin service → port ${PORT}`));
module.exports = app;
