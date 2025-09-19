// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Global test configuration for React components
beforeEach(() => {
  // Clear any mocks between tests
  jest.clearAllMocks();
});

// Mock window.fetch for API calls during testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  })
);

// Mock console.error to fail tests on console errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      throw new Error('Console error detected: ' + args[0]);
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Test utilities
global.testUtils = {
  createMockMenu: (id = 'test-menu', selected = false) => ({
    id,
    title: `Test Menu ${id}`,
    description: 'Test menu description',
    items: [
      {
        id: `${id}-item-1`,
        name: 'Test Item 1',
        description: 'Test item description',
        price: '€8.90',
        dietary: ['vegetarian'],
        allergens: ['contains gluten'],
        availability: '',
      },
    ],
    availability: {
      startTime: '11:00',
      endTime: '14:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    },
    lastUpdated: new Date().toISOString(),
    isSelected: selected,
  }),
};
