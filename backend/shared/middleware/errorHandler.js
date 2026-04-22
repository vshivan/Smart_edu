const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  }

  if (err.isOperational) {
    return res.status(err.statusCode).json({ status: err.status, message: err.message });
  }

  console.error('UNHANDLED ERROR:', err);
  return res.status(500).json({ status: 'error', message: 'Something went wrong.' });
};

const notFound = (req, res, next) =>
  next(new AppError(`Route ${req.originalUrl} not found`, 404));

module.exports = { errorHandler, notFound };
