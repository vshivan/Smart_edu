const mongoose = require('mongoose');
const logger = require('../../../shared/utils/logger');
mongoose.connect(process.env.MONGODB_URL, { dbName: 'smartedulear_ai' })
  .then(() => logger.info('AI service → MongoDB connected'))
  .catch((e) => logger.error('MongoDB error', e));
module.exports = mongoose;
