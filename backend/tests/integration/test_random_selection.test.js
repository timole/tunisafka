const request = require('supertest');
const app = require('../../src/app');

describe('Integration Test: Random Menu Selection Scenario', () => {
  let server;

  beforeAll(() => {
    // Start server on random port for testing
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Scenario 2: Random Menu Selection (FR-003, FR-004, FR-005, FR-009)', () => {
    test('should complete full random selection workflow', async () => {
      // Step 1: Locate the "Select Random Menu" button (simulated by API call)
      // Step 2: Click the button (make API request)
      const startTime = Date.now();
      const response = await request(app).get('/api/menus/random');
      const selectionTime = Date.now() - startTime;
      
      // Step 3: Observe the menu selection
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      
      // Validate response structure (FR-004: random selection triggered)
      expect(response.body).toHaveProperty('selectedMenu');
      expect(response.body).toHaveProperty('totalMenusAvailable');
      expect(response.body).toHaveProperty('selectionTimestamp');
      
      // Validate selection performance (FR-004: <1s response)
      expect(selectionTime).toBeLessThan(1000);
      
      // Step 4: Verify selection response
      const { selectedMenu } = response.body;
      expect(selectedMenu).toHaveProperty('isSelected');
      expect(selectedMenu.isSelected).toBe(true);
    });

    test('should provide clearly visible and accessible random selection (FR-003)', async () => {
      const response = await request(app).get('/api/menus/random');
      
      expect(response.status).toBe(200);
      
      // Random selection endpoint should be accessible
      expect(response.body).toHaveProperty('selectedMenu');
      
      // Selected menu should be clearly identifiable
      const { selectedMenu } = response.body;
      expect(selectedMenu).toHaveProperty('id');
      expect(selectedMenu).toHaveProperty('title');
      expect(selectedMenu).toHaveProperty('isSelected');
      
      // Selection should be marked clearly
      expect(selectedMenu.isSelected).toBe(true);
      expect(typeof selectedMenu.id).toBe('string');
      expect(selectedMenu.id.length).toBeGreaterThan(0);
    });

    test('should randomly select menu from available options (FR-004)', async () => {
      // First, get all available menus
      const menusResponse = await request(app).get('/api/menus');
      expect(menusResponse.status).toBe(200);
      
      const availableMenus = menusResponse.body.menus;
      expect(Array.isArray(availableMenus)).toBe(true);
      
      if (availableMenus.length > 0) {
        // Make random selection
        const randomResponse = await request(app).get('/api/menus/random');
        expect(randomResponse.status).toBe(200);
        
        const { selectedMenu, totalMenusAvailable } = randomResponse.body;
        
        // Should select from available options
        expect(totalMenusAvailable).toBe(availableMenus.length);
        
        // Selected menu should be one of the available menus
        const selectedMenuExists = availableMenus.some(menu => menu.id === selectedMenu.id);
        expect(selectedMenuExists).toBe(true);
        
        // Should be marked as selected
        expect(selectedMenu.isSelected).toBe(true);
      }
    });

    test('should provide visual indication of selected menu (FR-005)', async () => {
      const response = await request(app).get('/api/menus/random');
      
      expect(response.status).toBe(200);
      
      const { selectedMenu } = response.body;
      
      // Visual indication through isSelected flag
      expect(selectedMenu.isSelected).toBe(true);
      
      // Should have all necessary data for visual highlighting
      expect(selectedMenu).toHaveProperty('id'); // For targeting
      expect(selectedMenu).toHaveProperty('title'); // For display
      expect(selectedMenu).toHaveProperty('description'); // For context
      
      // Should be distinguishable from non-selected menus
      expect(typeof selectedMenu.isSelected).toBe('boolean');
      expect(selectedMenu.isSelected).toBe(true);
    });

    test('should work with standard web browser compatibility (FR-009)', async () => {
      const response = await request(app).get('/api/menus/random');
      
      // Should use standard HTTP methods and status codes
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      
      // Should return standard JSON that any browser can parse
      expect(typeof response.body).toBe('object');
      expect(response.body).not.toBeNull();
      
      // Should include CORS headers for browser compatibility
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should respond immediately with selection (<1s)', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/api/menus/random');
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // <1s requirement
      
      // Should provide immediate feedback
      expect(response.body).toHaveProperty('selectedMenu');
      expect(response.body).toHaveProperty('selectionTimestamp');
      
      // Selection timestamp should be very recent
      const selectionTime = new Date(response.body.selectionTimestamp);
      const timeDiff = Date.now() - selectionTime.getTime();
      expect(timeDiff).toBeLessThan(2000); // Within 2 seconds
    });

    test('should show different selections on multiple clicks', async () => {
      // Get total available menus first
      const menusResponse = await request(app).get('/api/menus');
      expect(menusResponse.status).toBe(200);
      
      const totalMenus = menusResponse.body.menus.length;
      
      if (totalMenus > 1) {
        // Make multiple random selections
        const selections = [];
        const numSelections = Math.min(5, totalMenus * 2);
        
        for (let i = 0; i < numSelections; i++) {
          const response = await request(app).get('/api/menus/random');
          expect(response.status).toBe(200);
          selections.push(response.body.selectedMenu.id);
        }
        
        // Should see some variety in selections (not perfect test, but reasonable)
        const uniqueSelections = new Set(selections);
        if (totalMenus >= 2) {
          // With multiple menus, should see some randomness
          expect(uniqueSelections.size).toBeGreaterThan(1);
        }
      } else if (totalMenus === 1) {
        // With single menu, should always select the same one
        const response1 = await request(app).get('/api/menus/random');
        const response2 = await request(app).get('/api/menus/random');
        
        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
        expect(response1.body.selectedMenu.id).toBe(response2.body.selectedMenu.id);
      }
    });

    test('should maintain application responsiveness throughout selection', async () => {
      // Make multiple concurrent random selections
      const numConcurrent = 3;
      const promises = [];
      
      for (let i = 0; i < numConcurrent; i++) {
        promises.push(request(app).get('/api/menus/random'));
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('selectedMenu');
      });
      
      // Should handle concurrent requests without issues
      expect(responses.length).toBe(numConcurrent);
    });
  });

  describe('Success Criteria Validation', () => {
    test('random selection completes within 1 second', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/api/menus/random');
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000);
    });

    test('visual feedback is clear and unambiguous', async () => {
      const response = await request(app).get('/api/menus/random');
      
      expect(response.status).toBe(200);
      
      const { selectedMenu } = response.body;
      
      // Clear identification
      expect(selectedMenu.isSelected).toBe(true);
      expect(typeof selectedMenu.id).toBe('string');
      expect(selectedMenu.id.length).toBeGreaterThan(0);
      
      // Unambiguous selection state
      expect(typeof selectedMenu.isSelected).toBe('boolean');
      expect(selectedMenu.isSelected).not.toBeNull();
      expect(selectedMenu.isSelected).not.toBeUndefined();
    });

    test('true randomness observed over multiple selections', async () => {
      // Get available menus
      const menusResponse = await request(app).get('/api/menus');
      const totalMenus = menusResponse.body.menus.length;
      
      if (totalMenus > 1) {
        // Test randomness with statistical approach
        const selections = {};
        const numTests = totalMenus * 10; // Good sample size
        
        for (let i = 0; i < numTests; i++) {
          const response = await request(app).get('/api/menus/random');
          expect(response.status).toBe(200);
          
          const menuId = response.body.selectedMenu.id;
          selections[menuId] = (selections[menuId] || 0) + 1;
        }
        
        // Should have selected multiple different menus
        const uniqueMenusSelected = Object.keys(selections).length;
        expect(uniqueMenusSelected).toBeGreaterThan(1);
        
        // No single menu should dominate too heavily (basic randomness check)
        const maxSelections = Math.max(...Object.values(selections));
        const expectedAvg = numTests / totalMenus;
        
        // Allow some variance but not complete dominance
        expect(maxSelections).toBeLessThan(expectedAvg * 2);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle single menu scenario gracefully', async () => {
      // This test validates behavior when only one menu is available
      const response = await request(app).get('/api/menus/random');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('selectedMenu');
      expect(response.body).toHaveProperty('totalMenusAvailable');
      
      // Should work correctly even with limited options
      const { selectedMenu, totalMenusAvailable } = response.body;
      expect(selectedMenu.isSelected).toBe(true);
      expect(totalMenusAvailable).toBeGreaterThanOrEqual(1);
    });

    test('should provide consistent selection format regardless of menu count', async () => {
      const response = await request(app).get('/api/menus/random');
      
      expect(response.status).toBe(200);
      
      // Should always have consistent response format
      expect(response.body).toHaveProperty('selectedMenu');
      expect(response.body).toHaveProperty('totalMenusAvailable');
      expect(response.body).toHaveProperty('selectionTimestamp');
      
      // Selected menu should always have proper structure
      const { selectedMenu } = response.body;
      expect(selectedMenu).toHaveProperty('id');
      expect(selectedMenu).toHaveProperty('title');
      expect(selectedMenu).toHaveProperty('isSelected');
      expect(selectedMenu.isSelected).toBe(true);
    });
  });
});
