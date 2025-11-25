/**
 * Standardized API Response Formatter
 */

const successResponse = (message, data = null) => {
  const response = {
    status: 'success',
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return response;
};

const errorResponse = (message, errors = null) => {
  const response = {
    status: 'error',
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

const paginatedResponse = (message, data, pagination) => {
  return {
    status: 'success',
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};