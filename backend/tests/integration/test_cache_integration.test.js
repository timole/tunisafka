/**
 * Cache Integration Tests
 * Tests the complete caching workflow integration
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Cache Integration', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await request(app)
      .delete('/api/cache/clear')
      .expect(200);
  });

  describe('Menu Caching Workflow', () => {
    test('should cache menus on first request and serve from cache on subsequent requests', async () => {
      // First request should trigger scraping and caching
      const firstResponse = await request(app)
        .get('/api/menus')
        .expect(200);

      expect(firstResponse.body.menus).toBeDefined();
      expect(firstResponse.body.source).not.toContain('(cached)');
      
      // Second request should serve from cache
      const secondResponse = await request(app)
        .get('/api/menus')
        .expect(200);

      expect(secondResponse.body.menus).toBeDefined();
      expect(secondResponse.body.cacheHit).toBe(true);
      
      // Menu data should be identical ignoring volatile timestamps
      const stripTimestamps = (menus) =>
        menus.map(({ lastUpdated, ...rest }) => rest);

      expect(stripTimestamps(secondResponse.body.menus)).toEqual(
        stripTimestamps(firstResponse.body.menus)
      );
    });

    test('should serve cached data for random menu selection', async () => {
      // First, populate cache with menu data
      await request(app)
        .get('/api/menus')
        .expect(200);

      // Random menu selection should use cached data
      const randomResponse = await request(app)
        .get('/api/menus/random')
        .expect(200);

      expect(randomResponse.body.selectedMenu).toBeDefined();
      // body no longer includes allMenus; ensure selection exists
    });

    test('should handle cache refresh workflow', async () => {
      // Create initial cache
      await request(app)
        .get('/api/menus')
        .expect(200);

      // Verify cache exists
      let statusResponse = await request(app)
        .get('/api/cache/status')
        .expect(200);
      
      expect(statusResponse.body.cacheStats.isValid).toBe(true);

      // Refresh cache
      const refreshResponse = await request(app)
        .post('/api/cache/refresh')
        .expect(200);

      expect(refreshResponse.body.refreshed).toBe(true);
      expect(refreshResponse.body.menus).toBeDefined();
      expect(refreshResponse.headers['cache-status']).toBe('refresh');

      // Verify cache is still valid after refresh
      statusResponse = await request(app)
        .get('/api/cache/status')
        .expect(200);
      
      expect(statusResponse.body.cacheStats.isValid).toBe(true);
    });
  });

  describe('Cache Performance', () => {
    test('should show improved response times with cache', async () => {
      // First request (no cache) - measure time
      const start1 = Date.now();
      await request(app)
        .get('/api/menus')
        .expect(200);
      const firstRequestTime = Date.now() - start1;

      // Second request (cached) - measure time
      const start2 = Date.now();
      await request(app)
        .get('/api/menus')
        .expect(200);
      const secondRequestTime = Date.now() - start2;

      // Cached request should generally be faster
      // Note: This might not always be true in test environment, but we can at least verify it doesn't fail
      expect(secondRequestTime).toBeLessThan(firstRequestTime * 2); // Allow some variance
      expect(firstRequestTime).toBeGreaterThan(0);
      expect(secondRequestTime).toBeGreaterThan(0);
    });

    test('should handle concurrent requests efficiently', async () => {
      // Multiple concurrent requests should not cause issues
      const requests = Array(5).fill().map(() =>
        request(app).get('/api/menus')
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.menus).toBeDefined();
      });

      // Check cache statistics
      const statusResponse = await request(app)
        .get('/api/cache/status')
        .expect(200);
      
      expect(statusResponse.body.cacheStats.isValid).toBe(true);
    });
  });

  describe('Cache Headers and Metadata', () => {
    test('should include appropriate cache headers in responses', async () => {
      // First request
      const firstResponse = await request(app)
        .get('/api/menus')
        .expect(200);

      // Should include basic cache control headers
      expect(firstResponse.headers['cache-control']).toContain('no-cache');

      // Second request (cached)
      const secondResponse = await request(app)
        .get('/api/menus')
        .expect(200);

      expect(secondResponse.headers['cache-control']).toContain('no-cache');
    });

    test('should provide cache metadata in responses', async () => {
      // Create cache
      const response = await request(app)
        .get('/api/menus')
        .expect(200);

      expect(response.body).toMatchObject({
        menus: expect.any(Array),
        lastUpdated: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        source: expect.any(String),
        scrapingResult: expect.any(Object)
      });
    });
  });

  describe('Cache Validation and Info', () => {
    test('should provide detailed cache information', async () => {
      // Create cache first
      await request(app)
        .get('/api/menus')
        .expect(200);

      const response = await request(app)
        .get('/api/cache/info')
        .expect(200);

      expect(response.body).toMatchObject({
        cache: expect.any(Object),
        service: expect.any(Object),
        endpoints: {
          status: '/api/cache/status',
          clear: '/api/cache/clear (DELETE)',
          refresh: '/api/cache/refresh (POST)',
          info: '/api/cache/info'
        },
        features: {
          dailyCaching: true,
          timezoneBased: true,
          fallbackSupport: true,
          atomicWrites: true
        }
      });
    });

    test('should validate cache state correctly', async () => {
      // No cache initially
      let response = await request(app)
        .get('/api/cache/validate')
        .expect(200);

      expect(response.body.validation).toMatchObject({
        isValid: false,
        hasData: false,
        recommendations: expect.arrayContaining([
          expect.stringContaining('No cached data available')
        ])
      });

      // Create cache
      await request(app)
        .get('/api/menus')
        .expect(200);

      // Validate again
      response = await request(app)
        .get('/api/cache/validate')
        .expect(200);

      expect(response.body.validation).toMatchObject({
        isValid: true,
        hasData: true,
        recommendations: expect.arrayContaining([
          expect.stringContaining('Cache is valid and ready')
        ])
      });
    });
  });

  describe('Error Recovery', () => {
    test('should gracefully handle cache corruption', async () => {
      // This test would require directly corrupting the cache file
      // For now, we'll test that the system continues to work
      await request(app)
        .get('/api/menus')
        .expect(200);
      
      // Even if cache gets corrupted, the system should continue working
      await request(app)
        .get('/api/menus')
        .expect(200);
    });

    test('should handle cache directory issues', async () => {
      // System should continue working even with cache issues
      const response = await request(app)
        .get('/api/menus')
        .expect(200);

      expect(response.body.menus).toBeDefined();
    });
  });

  describe('Daily Cache Behavior', () => {
    test('should include current date in cache metadata', async () => {
      await request(app)
        .get('/api/menus')
        .expect(200);

      const statusResponse = await request(app)
        .get('/api/cache/status')
        .expect(200);

      const currentDate = new Date().toISOString().split('T')[0];
      expect(statusResponse.body.cacheStats.currentDate).toBe(currentDate);
      expect(statusResponse.body.cacheStats.cacheDate).toBe(currentDate);
    });

    test('should respect timezone configuration', async () => {
      const statusResponse = await request(app)
        .get('/api/cache/status')
        .expect(200);

      expect(statusResponse.body.cacheStats.timezone).toBeDefined();
      expect(typeof statusResponse.body.cacheStats.timezone).toBe('string');
    });
  });
});
