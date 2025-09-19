module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    document: 'readonly',
    uuidv4: 'readonly',
    fail: 'readonly',
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', args: 'after-used' }],
    'no-console': 'off', // Allow console.log in backend
    'prefer-const': 'warn', // Make this a warning instead of error
    'no-var': 'error',
    'no-useless-escape': 'warn', // Make this a warning
    'no-dupe-class-members': 'warn', // Make this a warning
  },
  overrides: [
    {
      files: ['tests/**/*.js', '**/*.test.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
      },
    },
  ],
};