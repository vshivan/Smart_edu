const { AppError } = require('../utils/errors');

const validate = (schema) => (req, res, next) => {
  const errors = [];
  ['body', 'query', 'params'].forEach((key) => {
    if (schema[key]) {
      const { error } = schema[key].validate(req[key], { abortEarly: false });
      if (error) errors.push(...error.details.map((d) => d.message));
    }
  });
  if (errors.length) return next(new AppError(`Validation: ${errors.join(', ')}`, 400));
  next();
};

module.exports = validate;
