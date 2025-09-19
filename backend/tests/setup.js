// Jest setup file for backend tests
// This file runs before each test suite

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for testing

// Fix for Node.js compatibility with newer packages (cheerio/undici)
if (typeof global.File === 'undefined') {
  global.File = class File {
    constructor(bits, name, options = {}) {
      this.name = name;
      this.type = options.type || '';
      this.lastModified = options.lastModified || Date.now();
      this.size = bits.reduce((size, bit) => size + (bit.length || bit.size || 0), 0);
    }
  };
}

// Global test configuration
jest.setTimeout(10000);

// Mock console methods to reduce noise during testing (optional)
global.console = {
  ...console,
  // Uncomment below to silence logs during testing
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Global test helpers
global.testHelpers = {
  // Add common test utilities here
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
};

// Ensure no open handles remain after tests
afterAll(() => {
  if (global.rateLimiterInstance && typeof global.rateLimiterInstance.destroy === 'function') {
    global.rateLimiterInstance.destroy();
    global.rateLimiterInstance = null;
  }
});
