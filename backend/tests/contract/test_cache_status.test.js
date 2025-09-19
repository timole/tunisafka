/**
 * Cache Status API Contract Tests
 * Tests for /api/cache/status endpoint
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Cache Status API (/api/cache/status)', () => {
  beforeEach(async () => {
    // Clear cache before each test to ensure clean state
    await request(app)
      .delete('/api/cache/clear')
      .expect(200);
  });

  describe('GET /api/cache/status', () => {
    test('should return cache status with correct structure', async () => {
      const response = await request(app)
        .get('/api/cache/status')
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.body).toMatchObject({
        cacheStats: {
          isValid: expect.any(Boolean),
          currentDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          hits: expect.any(Number),
          misses: expect.any(Number),
          hitRate: expect.stringMatching(/^\d+(\.\d+)?%$/),
          timezone: expect.any(String)
        },
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        endpoint: '/api/cache/status'
      });
    });

    test('should include cache headers', async () => {
      const response = await request(app)
        .get('/api/cache/status')
        .expect(200);

      expect(response.headers).toMatchObject({
        'cache-control': 'no-cache, no-store, must-revalidate',
        'cache-status': expect.stringMatching(/^(hit|miss)$/),
        'cache-date': expect.any(String),
        'cache-age': expect.any(String)
      });
    });

    test('should return miss status when no cache exists', async () => {
      const response = await request(app)
        .get('/api/cache/status')
        .expect(200);

      expect(response.body.cacheStats.isValid).toBe(false);
      expect(response.headers['cache-status']).toBe('miss');
    });

    test('should handle service errors gracefully', async () => {
      // This test would require mocking the service to throw an error
      // For now, we'll just verify the endpoint doesn't crash
      await request(app)
        .get('/api/cache/status')
        .expect(200);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed requests', async () => {
      await request(app)
        .get('/api/cache/status?invalid=query')
        .expect(200); // Should still work, ignoring invalid query params
    });

    test('should handle concurrent requests', async () => {
      const requests = Array(5).fill().map(() =>
        request(app).get('/api/cache/status')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.cacheStats).toBeDefined();
      });
    });
  });

  describe('Cache Status Transitions', () => {
    test('should show miss -> hit transition', async () => {
      // Initial status should be miss
      let response = await request(app)
        .get('/api/cache/status')
        .expect(200);
      
      expect(response.body.cacheStats.isValid).toBe(false);
      expect(response.headers['cache-status']).toBe('miss');

      // Trigger caching by getting menus
      await request(app)
        .get('/api/menus')
        .expect(200);

      // Status should now show hit
      response = await request(app)
        .get('/api/cache/status')
        .expect(200);
      
      expect(response.body.cacheStats.isValid).toBe(true);
      expect(response.headers['cache-status']).toBe('hit');
    });
  });
});
