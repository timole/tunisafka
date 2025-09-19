// Jest setup file for backend tests
// This file runs before each test suite

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for testing

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
