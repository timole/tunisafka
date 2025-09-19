const request = require('supertest');
const app = require('../../src/app');

describe('Integration Test: Initial Menu Loading Scenario', () => {
  let server;

  beforeAll(() => {
    // Start server on random port for testing
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Scenario 1: Initial Menu Loading (FR-001, FR-002, FR-007, FR-008)', () => {
    test('should complete full menu loading workflow', async () => {
      // Step 1: User opens the Tunisafka app (simulated by making API call)
      const startTime = Date.now();
      
      // Step 2: Observe initial loading state (API should respond promptly)
      const response = await request(app).get('/api/menus');
      const loadTime = Date.now() - startTime;
      
      // Step 3: Wait for menu data to load
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      
      // Validate loading performance (FR-007: <3s loading time)
      expect(loadTime).toBeLessThan(3000);
      
      // Validate menu data structure (FR-001: scrape and display menus)
      expect(response.body).toHaveProperty('menus');
      expect(response.body).toHaveProperty('lastUpdated');
      expect(response.body).toHaveProperty('source');
      expect(response.body).toHaveProperty('scrapingResult');
      
      // Validate source URL (FR-001: from https://unisafka.fi/tty/)
      expect(response.body.source).toBe('https://unisafka.fi/tty/');
      expect(response.body.scrapingResult.source).toBe('https://unisafka.fi/tty/');
    });

    test('should display menu data in clear, readable format (FR-002)', async () => {
      const response = await request(app).get('/api/menus');
      
      expect(response.status).toBe(200);
      const { menus } = response.body;
      
      // Should have menus array
      expect(Array.isArray(menus)).toBe(true);
      
      // Each menu should have clear, readable structure
      if (menus.length > 0) {
        menus.forEach(menu => {
          // Menu shows name and description
          expect(menu).toHaveProperty('title');
          expect(menu).toHaveProperty('description');
          expect(typeof menu.title).toBe('string');
          expect(menu.title.length).toBeGreaterThan(0);
          
          // Menu shows list of items
          expect(menu).toHaveProperty('items');
          expect(Array.isArray(menu.items)).toBe(true);
          
          // Menu items display required information
          if (menu.items.length > 0) {
            menu.items.forEach(item => {
              expect(item).toHaveProperty('name');
              expect(item).toHaveProperty('description');
              expect(item).toHaveProperty('price');
              expect(item).toHaveProperty('dietary');
              expect(item).toHaveProperty('allergens');
              
              expect(typeof item.name).toBe('string');
              expect(item.name.length).toBeGreaterThan(0);
              expect(typeof item.price).toBe('string');
              expect(Array.isArray(item.dietary)).toBe(true);
              expect(Array.isArray(item.allergens)).toBe(true);
            });
          }
        });
      }
    });

    test('should provide real-time data refresh (FR-007)', async () => {
      // First request
      const response1 = await request(app).get('/api/menus');
      expect(response1.status).toBe(200);
      
      const timestamp1 = new Date(response1.body.lastUpdated);
      
      // Small delay to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Second request (should get fresh data)
      const response2 = await request(app).get('/api/menus');
      expect(response2.status).toBe(200);
      
      const timestamp2 = new Date(response2.body.lastUpdated);
      
      // Should get real-time data (timestamps should be recent)
      const now = new Date();
      const timeDiff1 = now.getTime() - timestamp1.getTime();
      const timeDiff2 = now.getTime() - timestamp2.getTime();
      
      // Both requests should have very recent timestamps (real-time)
      expect(timeDiff1).toBeLessThan(10000); // Within 10 seconds
      expect(timeDiff2).toBeLessThan(10000); // Within 10 seconds
    });

    test('should display loading states and appropriate status messages (FR-008)', async () => {
      const response = await request(app).get('/api/menus');
      
      // Should provide scraping status information
      expect(response.body).toHaveProperty('scrapingResult');
      const { scrapingResult } = response.body;
      
      expect(scrapingResult).toHaveProperty('success');
      expect(scrapingResult).toHaveProperty('timestamp');
      expect(scrapingResult).toHaveProperty('duration');
      expect(scrapingResult).toHaveProperty('menusFound');
      
      // Should indicate successful loading state
      if (scrapingResult.success) {
        expect(scrapingResult.menusFound).toBeGreaterThanOrEqual(0);
        expect(scrapingResult.error).toBeNull();
      }
      
      // Duration should be reasonable
      expect(scrapingResult.duration).toBeGreaterThan(0);
      expect(scrapingResult.duration).toBeLessThan(10000); // Under 10 seconds
    });

    test('should handle successful scraping without errors', async () => {
      const response = await request(app).get('/api/menus');
      
      expect(response.status).toBe(200);
      
      // When source website is available, should succeed
      const { scrapingResult } = response.body;
      
      // Should have successful scraping result
      expect(typeof scrapingResult.success).toBe('boolean');
      expect(typeof scrapingResult.timestamp).toBe('string');
      expect(typeof scrapingResult.duration).toBe('number');
      expect(typeof scrapingResult.menusFound).toBe('number');
      
      // If successful, should have found some data structure
      if (scrapingResult.success) {
        expect(scrapingResult.menusFound).toBeGreaterThanOrEqual(0);
      }
    });

    test('should provide proper content structure for frontend display', async () => {
      const response = await request(app).get('/api/menus');
      
      expect(response.status).toBe(200);
      
      // Data should be structured for easy frontend consumption
      const { menus, lastUpdated, source } = response.body;
      
      // Should have all data needed for frontend display
      expect(Array.isArray(menus)).toBe(true);
      expect(typeof lastUpdated).toBe('string');
      expect(typeof source).toBe('string');
      
      // Each menu should have display-ready data
      menus.forEach(menu => {
        expect(menu).toHaveProperty('id'); // For React keys
        expect(menu).toHaveProperty('title'); // For display
        expect(menu).toHaveProperty('isSelected'); // For UI state
        expect(menu).toHaveProperty('availability'); // For user info
        
        // Items should have display-ready structure
        menu.items.forEach(item => {
          expect(item).toHaveProperty('id'); // For React keys
          expect(item).toHaveProperty('name'); // For display
          expect(item).toHaveProperty('price'); // For display
          expect(item).toHaveProperty('dietary'); // For filtering/display
          expect(item).toHaveProperty('allergens'); // For warnings
        });
      });
    });

    test('should meet performance requirements for initial load', async () => {
      // Test multiple requests to ensure consistent performance
      const numTests = 3;
      const durations = [];
      
      for (let i = 0; i < numTests; i++) {
        const startTime = Date.now();
        const response = await request(app).get('/api/menus');
        const duration = Date.now() - startTime;
        
        expect(response.status).toBe(200);
        durations.push(duration);
      }
      
      // All requests should meet performance requirement
      durations.forEach(duration => {
        expect(duration).toBeLessThan(3000); // FR-007: <3s requirement
      });
      
      // Average performance should be good
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      expect(avgDuration).toBeLessThan(2000); // Should average under 2s
    });
  });

  describe('Success Criteria Validation', () => {
    test('page loads without errors', async () => {
      const response = await request(app).get('/api/menus');
      
      // Should not have HTTP errors
      expect(response.status).toBe(200);
      
      // Should not have application errors in response
      expect(response.body).not.toHaveProperty('error');
    });

    test('menu data appears within performance goals', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/api/menus');
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000); // Performance goal
      
      // Should have actual menu data
      expect(response.body.menus).toBeDefined();
      expect(Array.isArray(response.body.menus)).toBe(true);
    });

    test('all scraped content is properly formatted and readable', async () => {
      const response = await request(app).get('/api/menus');
      
      expect(response.status).toBe(200);
      
      // Validate content formatting
      const { menus } = response.body;
      
      menus.forEach(menu => {
        // Title should be readable (not empty, not just whitespace)
        expect(menu.title.trim().length).toBeGreaterThan(0);
        
        // Description should be formatted (can be empty but not undefined)
        expect(typeof menu.description).toBe('string');
        
        // Items should be properly formatted
        menu.items.forEach(item => {
          expect(item.name.trim().length).toBeGreaterThan(0);
          expect(typeof item.price).toBe('string');
          expect(item.price.trim().length).toBeGreaterThan(0);
        });
      });
    });
  });
});
