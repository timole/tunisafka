module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  globals: {
    File: class File {
      constructor(bits, name, options = {}) {
        this.name = name;
        this.type = options.type || '';
        this.lastModified = options.lastModified || Date.now();
        this.size = bits.reduce((size, bit) => size + (bit.length || bit.size || 0), 0);
      }
    }
  },
};
