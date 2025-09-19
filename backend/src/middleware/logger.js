/**
 * Request Logger Middleware
 * Logs HTTP requests for monitoring and debugging
 */

const logger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log request body for non-GET requests (in development)
  if (process.env.NODE_ENV !== 'production' && req.method !== 'GET' && Object.keys(req.body || {}).length > 0) {
    console.log('   Body:', JSON.stringify(req.body, null, 2));
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const statusColor = getStatusColor(res.statusCode);
    
    console.log(`📤 ${req.method} ${req.url} - ${statusColor}${res.statusCode}\x1b[0m - ${duration}ms`);
    
    // Log slow requests
    if (duration > 3000) {
      console.warn(`⚠️  Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
    
    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Gets color code for status code
 */
function getStatusColor(statusCode) {
  if (statusCode < 300) {
    return '\x1b[32m'; // Green
  } else if (statusCode < 400) {
    return '\x1b[33m'; // Yellow
  } else if (statusCode < 500) {
    return '\x1b[31m'; // Red
  } else {
    return '\x1b[35m'; // Magenta
  }
}

module.exports = logger;
