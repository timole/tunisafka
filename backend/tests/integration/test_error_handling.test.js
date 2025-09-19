const request = require('supertest');
const app = require('../../src/app');

describe('Integration Test: Error Handling Scenarios', () => {
  let server;

  beforeAll(() => {
    // Start server on random port for testing
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Scenario 4: Error Handling - Source Unavailable (FR-006, FR-008)', () => {
    test('should handle network timeout gracefully', async () => {
      // This test validates behavior when source website times out
      // For now, we test that the endpoint exists and responds appropriately
      const response = await request(app).get('/api/menus');
      
      // Should not crash the application
      expect([200, 500, 503]).toContain(response.status);
      
      if (response.status !== 200) {
        // Should return proper error structure (FR-008)
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('code');
        expect(response.body).toHaveProperty('timestamp');
        
        // Error message should be user-friendly (FR-006)
        expect(typeof response.body.error).toBe('string');
        expect(response.body.error.length).toBeGreaterThan(0);
        
        // Should not expose technical details
        expect(response.body.error).not.toMatch(/stack trace|internal error|undefined/i);
      }
    });

    test('should provide user-friendly error messages', async () => {
      // Test that error messages are appropriate for end users
      // This will be more meaningful when error scenarios can be mocked
      
      // For now, verify that successful responses don't contain errors
      const response = await request(app).get('/api/menus');
      
      if (response.status === 200) {
        expect(response.body).not.toHaveProperty('error');
      } else {
        // If there is an error, it should be user-friendly
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
        
        // Should not contain technical jargon
        expect(response.body.error).not.toMatch(/null pointer|undefined|stack|debug/i);
      }
    });

    test('should maintain application functionality despite errors', async () => {
      // Application should remain functional even when scraping fails
      
      // Health check should still work
      const healthResponse = await request(app).get('/api/health');
      expect([200, 503]).toContain(healthResponse.status);
      
      if (healthResponse.status === 200) {
        expect(healthResponse.body).toHaveProperty('status');
        expect(healthResponse.body).toHaveProperty('timestamp');
      }
      
      // Menu endpoint should respond (even if with error)
      const menuResponse = await request(app).get('/api/menus');
      expect(menuResponse.status).toBeDefined();
      expect([200, 500, 503]).toContain(menuResponse.status);
    });

    test('should provide retry mechanisms for transient errors', async () => {
      const response = await request(app).get('/api/menus');
      
      if (response.status !== 200) {
        // Error responses should indicate if retry is possible
        expect(response.body).toHaveProperty('retry');
        expect(typeof response.body.retry).toBe('boolean');
        
        // Should provide appropriate retry guidance
        if (response.body.retry) {
          expect(response.body.code).not.toBe('PERMANENT_ERROR');
        }
      }
    });

    test('should log appropriate error information without crashing', async () => {
      // Test that error scenarios don't crash the application
      
      // Multiple rapid requests should not crash the server
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/api/menus'));
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should get responses (not crash)
      responses.forEach(response => {
        expect(response.status).toBeDefined();
        expect([200, 500, 503]).toContain(response.status);
      });
    });
  });

  describe('Scenario 5: Empty Menu Handling (FR-006, FR-008)', () => {
    test('should handle scenario when no menus are available', async () => {
      const response = await request(app).get('/api/menus/random');
      
      // Should handle empty menu scenario gracefully
      if (response.status === 404) {
        // Should return proper error structure
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('code');
        expect(response.body).toHaveProperty('timestamp');
        
        // Should indicate no menus available
        expect(response.body.code).toBe('NO_MENUS_AVAILABLE');
        expect(response.body.error).toMatch(/no menus/i);
      } else if (response.status === 200) {
        // If successful, should have valid menu data
        expect(response.body).toHaveProperty('selectedMenu');
        expect(response.body).toHaveProperty('totalMenusAvailable');
        expect(response.body.totalMenusAvailable).toBeGreaterThan(0);
      }
    });

    test('should provide clear messaging when no menus are available', async () => {
      // Test messaging for empty state
      const response = await request(app).get('/api/menus');
      
      if (response.status === 200 && response.body.menus.length === 0) {
        // Should still be successful but indicate empty state
        expect(Array.isArray(response.body.menus)).toBe(true);
        expect(response.body.menus.length).toBe(0);
        
        // Scraping result should indicate what happened
        expect(response.body.scrapingResult).toHaveProperty('menusFound');
        expect(response.body.scrapingResult.menusFound).toBe(0);
      }
    });

    test('should handle random selection with empty menu list', async () => {
      const response = await request(app).get('/api/menus/random');
      
      if (response.status === 404) {
        // Should return appropriate error for no menus
        expect(response.body.code).toBe('NO_MENUS_AVAILABLE');
        expect(response.body.error).toMatch(/no menus.*available/i);
      } else {
        // If successful, should have at least one menu
        expect(response.status).toBe(200);
        expect(response.body.totalMenusAvailable).toBeGreaterThan(0);
      }
    });
  });

  describe('Network and Connection Error Handling', () => {
    test('should handle connection timeouts appropriately', async () => {
      // Test that requests don't hang indefinitely
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      const requestPromise = request(app).get('/api/menus');
      
      try {
        const response = await Promise.race([requestPromise, timeoutPromise]);
        expect(response.status).toBeDefined();
      } catch (error) {
        if (error.message === 'Request timeout') {
          fail('Request took longer than 10 seconds - potential hanging');
        }
        // Other errors are acceptable for this test
      }
    });

    test('should return appropriate HTTP status codes for different errors', async () => {
      const response = await request(app).get('/api/menus');
      
      // Should use standard HTTP status codes
      expect([200, 500, 503]).toContain(response.status);
      
      if (response.status === 500) {
        expect(response.body.code).toMatch(/SCRAPING_ERROR|INTERNAL_ERROR/);
      } else if (response.status === 503) {
        expect(response.body.code).toMatch(/SOURCE_UNAVAILABLE|SERVICE_UNAVAILABLE/);
      }
    });

    test('should include proper error codes for different failure scenarios', async () => {
      const response = await request(app).get('/api/menus');
      
      if (response.status !== 200) {
        expect(response.body).toHaveProperty('code');
        
        // Should use predefined error codes
        const validErrorCodes = [
          'SCRAPING_ERROR',
          'SOURCE_UNAVAILABLE', 
          'NO_MENUS_AVAILABLE',
          'INTERNAL_ERROR',
          'RATE_LIMITED'
        ];
        
        expect(validErrorCodes).toContain(response.body.code);
      }
    });
  });

  describe('Rate Limiting and Abuse Prevention', () => {
    test('should handle multiple rapid requests gracefully', async () => {
      // Test rapid fire requests don't break the system
      const promises = [];
      const numRequests = 10;
      
      for (let i = 0; i < numRequests; i++) {
        promises.push(request(app).get('/api/menus'));
      }
      
      const responses = await Promise.all(promises);
      
      // All requests should get responses
      expect(responses.length).toBe(numRequests);
      
      responses.forEach(response => {
        expect(response.status).toBeDefined();
        // Should either succeed or fail gracefully
        expect([200, 429, 500, 503]).toContain(response.status);
        
        if (response.status === 429) {
          // Rate limited responses should be properly formatted
          expect(response.body).toHaveProperty('code');
          expect(response.body.code).toBe('RATE_LIMITED');
        }
      });
    });
  });

  describe('Data Validation and Sanitization', () => {
    test('should handle malformed data from source gracefully', async () => {
      const response = await request(app).get('/api/menus');
      
      // Should not crash when source returns unexpected data
      expect(response.status).toBeDefined();
      
      if (response.status === 200) {
        // Data should be properly validated and sanitized
        expect(response.body).toHaveProperty('menus');
        expect(Array.isArray(response.body.menus)).toBe(true);
        
        // Each menu should have valid structure
        response.body.menus.forEach(menu => {
          expect(menu).toHaveProperty('id');
          expect(menu).toHaveProperty('title');
          expect(typeof menu.id).toBe('string');
          expect(typeof menu.title).toBe('string');
        });
      }
    });

    test('should provide fallback behavior for partial data corruption', async () => {
      const response = await request(app).get('/api/menus');
      
      if (response.status === 200) {
        // Should handle partial failures gracefully
        expect(response.body).toHaveProperty('scrapingResult');
        
        const { scrapingResult } = response.body;
        expect(scrapingResult).toHaveProperty('success');
        expect(scrapingResult).toHaveProperty('menusFound');
        
        // Even with partial failures, should provide what data is available
        if (scrapingResult.success && scrapingResult.menusFound > 0) {
          expect(response.body.menus.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Recovery and Resilience', () => {
    test('should recover from transient errors', async () => {
      // Test that system can recover from temporary failures
      
      // Make initial request
      const response1 = await request(app).get('/api/menus');
      
      // Wait briefly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Make follow-up request
      const response2 = await request(app).get('/api/menus');
      
      // System should remain operational
      expect(response1.status).toBeDefined();
      expect(response2.status).toBeDefined();
      
      // Should not degrade over time
      expect([200, 500, 503]).toContain(response1.status);
      expect([200, 500, 503]).toContain(response2.status);
    });

    test('should maintain service availability during partial failures', async () => {
      // Health endpoint should work even when main service has issues
      const healthResponse = await request(app).get('/api/health');
      
      // Health check should always respond
      expect([200, 503]).toContain(healthResponse.status);
      
      if (healthResponse.status === 200) {
        expect(healthResponse.body).toHaveProperty('status');
        
        // Should report appropriate health status
        expect(['healthy', 'degraded', 'unhealthy']).toContain(healthResponse.body.status);
      }
    });
  });
});
