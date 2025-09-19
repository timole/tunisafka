/**
 * Error Handler Middleware
 * Centralized error handling for the Express application
 */

const errorHandler = (error, req, res, _next) => {
  // Log the error
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.message,
      timestamp: new Date().toISOString(),
    };
  } else if (error.message.includes('No menus available')) {
    statusCode = 404;
    errorResponse = {
      error: error.message,
      code: 'NO_MENUS_AVAILABLE',
      retry: true,
      timestamp: new Date().toISOString(),
    };
  } else if (error.message.includes('timeout') || error.message.includes('Network error')) {
    statusCode = 503;
    errorResponse = {
      error: 'Source website is currently unavailable',
      code: 'SOURCE_UNAVAILABLE',
      retry: true,
      timestamp: new Date().toISOString(),
    };
  } else if (error.message.includes('scraping') || error.message.includes('parsing')) {
    statusCode = 500;
    errorResponse = {
      error: 'Unable to fetch menu data',
      code: 'SCRAPING_ERROR',
      retry: true,
      timestamp: new Date().toISOString(),
    };
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.details;
    if (statusCode === 500) {
      errorResponse.error = 'An unexpected error occurred';
    }
  } else {
    // Include more details in development
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
