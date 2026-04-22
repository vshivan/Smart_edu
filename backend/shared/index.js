module.exports = {
  middleware: {
    authenticate:   require('./middleware/auth').authenticate,
    authorize:      require('./middleware/auth').authorize,
    errorHandler:   require('./middleware/errorHandler').errorHandler,
    notFound:       require('./middleware/errorHandler').notFound,
    validate:       require('./middleware/validate'),
  },
  utils: {
    AppError:       require('./utils/errors').AppError,
    sendSuccess:    require('./utils/response').sendSuccess,
    sendCreated:    require('./utils/response').sendCreated,
    sendPaginated:  require('./utils/response').sendPaginated,
    paginate:       require('./utils/paginate'),
    logger:         require('./utils/logger'),
  },
  constants:        require('./constants'),
};
