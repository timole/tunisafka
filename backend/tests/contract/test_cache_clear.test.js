/**
 * Cache Clear API Contract Tests
 * Tests for /api/cache/clear endpoint
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Cache Clear API (/api/cache/clear)', () => {
  describe('DELETE /api/cache/clear', () => {
    test('should clear cache successfully', async () => {
      // First, create some cache by getting menus
      await request(app)
        .get('/api/menus')
        .expect(200);

      // Verify cache exists
      let statusResponse = await request(app)
        .get('/api/cache/status')
        .expect(200);
      
      expect(statusResponse.body.cacheStats.isValid).toBe(true);

      // Clear the cache
      const response = await request(app)
        .delete('/api/cache/clear')
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Cache has been cleared',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        nextRequest: 'Next menu request will trigger fresh scraping'
      });

      // Verify cache is cleared
      statusResponse = await request(app)
        .get('/api/cache/status')
        .expect(200);
      
      expect(statusResponse.body.cacheStats.isValid).toBe(false);
    });

    test('should handle clearing already empty cache', async () => {
      const response = await request(app)
        .delete('/api/cache/clear')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cache has been cleared');
    });

    test('should not accept other HTTP methods', async () => {
      await request(app)
        .get('/api/cache/clear')
        .expect(404); // Should not be found for GET

      await request(app)
        .post('/api/cache/clear')
        .expect(404); // Should not be found for POST
      
      await request(app)
        .put('/api/cache/clear')
        .expect(404); // Should not be found for PUT
    });
  });

  describe('Cache Clear Effects', () => {
    test('should force fresh scraping after clear', async () => {
      // Create cache first
      await request(app)
        .get('/api/menus')
        .expect(200);

      // Clear cache
      await request(app)
        .delete('/api/cache/clear')
        .expect(200);

      // Next menu request should trigger fresh scraping
      const response = await request(app)
        .get('/api/menus')
        .expect(200);

      // Should have fresh data (not from cache)
      expect(response.body.source).not.toContain('(cached)');
    });

    test('should reset cache statistics', async () => {
      // Create cache and check status multiple times to build up hits
      await request(app).get('/api/menus').expect(200);
      await request(app).get('/api/cache/status').expect(200);
      await request(app).get('/api/cache/status').expect(200);

      // Clear cache
      await request(app)
        .delete('/api/cache/clear')
        .expect(200);

      // Check that cache is invalid
      const statusResponse = await request(app)
        .get('/api/cache/status')
        .expect(200);

      expect(statusResponse.body.cacheStats.isValid).toBe(false);
      expect(statusResponse.body.cacheStats.cacheDate).toBeNull();
    });
  });

  describe('Error Scenarios', () => {
    test('should handle concurrent clear requests', async () => {
      // Create cache first
      await request(app)
        .get('/api/menus')
        .expect(200);

      // Send multiple clear requests concurrently
      const clearRequests = Array(3).fill().map(() =>
        request(app).delete('/api/cache/clear')
      );

      const responses = await Promise.all(clearRequests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
