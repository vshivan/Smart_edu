const sendSuccess = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ status: 'success', message, data });

const sendCreated = (res, data, message = 'Created successfully') =>
  sendSuccess(res, data, message, 201);

const sendPaginated = (res, data, { page, limit, total }) =>
  res.status(200).json({
    status: 'success',
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });

module.exports = { sendSuccess, sendCreated, sendPaginated };
