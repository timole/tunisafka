/**
 * Rate Limiter Middleware
 * Prevents abuse of the scraping endpoints
 */

class SimpleRateLimiter {
  constructor() {
    this.requests = new Map();
    this.windowMs = 60 * 1000; // 1 minute window
    this.maxRequests = 200; // 200 requests per minute per IP for testing
    this.cleanupInterval = null;
    
    // Only start cleanup interval in non-test environments or when explicitly enabled
    if (process.env.NODE_ENV !== 'test') {
      this.startCleanup();
    }
  }

  startCleanup() {
    if (!this.cleanupInterval) {
      // Cleanup old entries every 5 minutes
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      // In Node.js, unref() allows the process to exit even with this timer active
      this.cleanupInterval.unref();
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  isAllowed(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(ip)) {
      this.requests.set(ip, []);
    }
    
    const ipRequests = this.requests.get(ip);
    
    // Remove old requests outside the window
    const recentRequests = ipRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(ip, recentRequests);
    
    // Check if under limit
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    return true;
  }

  getRemainingRequests(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(ip)) {
      return this.maxRequests;
    }
    
    const ipRequests = this.requests.get(ip);
    const recentRequests = ipRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  getResetTime(ip) {
    if (!this.requests.has(ip)) {
      return Date.now();
    }
    
    const ipRequests = this.requests.get(ip);
    if (ipRequests.length === 0) {
      return Date.now();
    }
    
    // Reset time is when the oldest request in the window expires
    return ipRequests[0] + this.windowMs;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [ip, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (recentRequests.length === 0) {
        this.requests.delete(ip);
      } else {
        this.requests.set(ip, recentRequests);
      }
    }
  }
}

// Create global rate limiter instance
const rateLimiter = new SimpleRateLimiter();

// Store reference for cleanup
global.rateLimiterInstance = rateLimiter;

// Middleware function
const rateLimiterMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (!rateLimiter.isAllowed(ip)) {
    const resetTime = rateLimiter.getResetTime(ip);
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
    
    res.set({
      'X-RateLimit-Limit': rateLimiter.maxRequests,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': Math.ceil(resetTime / 1000),
      'Retry-After': retryAfter,
    });
    
    return res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMITED',
      retry: true,
      retryAfter: retryAfter,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Set rate limit headers
  const remaining = rateLimiter.getRemainingRequests(ip);
  const resetTime = rateLimiter.getResetTime(ip);
  
  res.set({
    'X-RateLimit-Limit': rateLimiter.maxRequests,
    'X-RateLimit-Remaining': remaining,
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000),
  });
  
  next();
};

module.exports = rateLimiterMiddleware;
