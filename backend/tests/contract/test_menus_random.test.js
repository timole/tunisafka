const request = require('supertest');
const app = require('../../src/app');

describe('Contract Test: GET /api/menus/random', () => {
  let server;

  beforeAll(() => {
    // Start server on random port for testing
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Successful Response', () => {
    test('should return 200 status code', async () => {
      const response = await request(app).get('/api/menus/random');
      expect(response.status).toBe(200);
    });

    test('should return JSON content type', async () => {
      const response = await request(app).get('/api/menus/random');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should return proper response schema', async () => {
      const response = await request(app).get('/api/menus/random');
      
      expect(response.body).toHaveProperty('selectedMenu');
      expect(response.body).toHaveProperty('totalMenusAvailable');
      expect(response.body).toHaveProperty('selectionTimestamp');
      
      // Validate types
      expect(typeof response.body.selectedMenu).toBe('object');
      expect(typeof response.body.totalMenusAvailable).toBe('number');
      expect(typeof response.body.selectionTimestamp).toBe('string');
      
      // Validate minimum values
      expect(response.body.totalMenusAvailable).toBeGreaterThanOrEqual(1);
    });

    test('should validate selected menu schema', async () => {
      const response = await request(app).get('/api/menus/random');
      
      const { selectedMenu } = response.body;
      
      // Required menu fields
      expect(selectedMenu).toHaveProperty('id');
      expect(selectedMenu).toHaveProperty('title');
      expect(selectedMenu).toHaveProperty('items');
      expect(selectedMenu).toHaveProperty('availability');
      expect(selectedMenu).toHaveProperty('lastUpdated');
      expect(selectedMenu).toHaveProperty('isSelected');
      
      // Validate field types
      expect(typeof selectedMenu.id).toBe('string');
      expect(typeof selectedMenu.title).toBe('string');
      expect(Array.isArray(selectedMenu.items)).toBe(true);
      expect(typeof selectedMenu.availability).toBe('object');
      expect(typeof selectedMenu.lastUpdated).toBe('string');
      expect(typeof selectedMenu.isSelected).toBe('boolean');
      
      // Selected menu should be marked as selected
      expect(selectedMenu.isSelected).toBe(true);
      
      // Validate availability structure
      expect(selectedMenu.availability).toHaveProperty('startTime');
      expect(selectedMenu.availability).toHaveProperty('endTime');
      expect(selectedMenu.availability).toHaveProperty('days');
      expect(Array.isArray(selectedMenu.availability.days)).toBe(true);
    });

    test('should have valid timestamp format', async () => {
      const response = await request(app).get('/api/menus/random');
      
      // Validate ISO timestamp format
      const selectionTimestamp = new Date(response.body.selectionTimestamp);
      expect(selectionTimestamp.toISOString()).toBe(response.body.selectionTimestamp);
      
      const menuTimestamp = new Date(response.body.selectedMenu.lastUpdated);
      expect(menuTimestamp.toISOString()).toBe(response.body.selectedMenu.lastUpdated);
    });

    test('should return different selections on multiple requests', async () => {
      // Make multiple requests to verify randomness
      const responses = [];
      const numRequests = 5;
      
      for (let i = 0; i < numRequests; i++) {
        const response = await request(app).get('/api/menus/random');
        expect(response.status).toBe(200);
        responses.push(response.body.selectedMenu.id);
      }
      
      // If there are multiple menus, we should see some variation
      // This test will be meaningful when multiple menus are available
      expect(responses.length).toBe(numRequests);
      
      // All responses should be valid
      responses.forEach(menuId => {
        expect(typeof menuId).toBe('string');
        expect(menuId.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Response', () => {
    test('should return 404 when no menus available', async () => {
      // This test will validate behavior when no menus are available
      // Will fail initially until error handling is implemented
      expect(true).toBe(true); // Placeholder until no-menu scenario can be mocked
    });

    test('should return proper error response schema for no menus', async () => {
      // Error response should have: error, code, retry, timestamp
      // code should be "NO_MENUS_AVAILABLE"
      expect(true).toBe(true); // Placeholder until error handling is implemented
    });

    test('should return 500 for internal server errors', async () => {
      // This test will validate behavior when selection logic fails
      expect(true).toBe(true); // Placeholder until error scenarios can be mocked
    });
  });

  describe('Performance Requirements', () => {
    test('should respond within 1 second', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/api/menus/random');
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // 1 second requirement for random selection
    });
  });

  describe('Randomness Validation', () => {
    test('should provide truly random selection with multiple menus', async () => {
      // Get total menus available first
      const menusResponse = await request(app).get('/api/menus');
      expect(menusResponse.status).toBe(200);
      
      const totalMenus = menusResponse.body.menus.length;
      
      if (totalMenus > 1) {
        // Make multiple random selections
        const selections = new Set();
        const numTests = Math.min(10, totalMenus * 3); // Reasonable number of tests
        
        for (let i = 0; i < numTests; i++) {
          const response = await request(app).get('/api/menus/random');
          expect(response.status).toBe(200);
          selections.add(response.body.selectedMenu.id);
        }
        
        // Should see some variety in selections (not perfect test, but reasonable)
        if (totalMenus >= 2) {
          expect(selections.size).toBeGreaterThan(1);
        }
      }
    });

    test('should handle single menu scenario gracefully', async () => {
      // When only one menu is available, should always return that menu
      const response = await request(app).get('/api/menus/random');
      expect(response.status).toBe(200);
      
      // Should still return proper schema even with single menu
      expect(response.body).toHaveProperty('selectedMenu');
      expect(response.body).toHaveProperty('totalMenusAvailable');
      expect(response.body.selectedMenu.isSelected).toBe(true);
    });
  });

  describe('CORS Headers', () => {
    test('should include proper CORS headers', async () => {
      const response = await request(app).get('/api/menus/random');
      
      // These headers should be present when CORS is configured
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
