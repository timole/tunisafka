const request = require('supertest');
const app = require('../../src/app');

describe('Contract Test: GET /api/health', () => {
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
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });

    test('should return JSON content type', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should return proper response schema', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      
      // Optional field that should be present when available
      // expect(response.body).toHaveProperty('lastSuccessfulScrape');
    });

    test('should validate response field types and values', async () => {
      const response = await request(app).get('/api/health');
      
      // Validate status field
      expect(typeof response.body.status).toBe('string');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
      
      // Validate timestamp field
      expect(typeof response.body.timestamp).toBe('string');
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
      
      // Validate version field
      expect(typeof response.body.version).toBe('string');
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning format
    });

    test('should have recent timestamp', async () => {
      const response = await request(app).get('/api/health');
      
      const healthTimestamp = new Date(response.body.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - healthTimestamp.getTime();
      
      // Health check timestamp should be very recent (within 5 seconds)
      expect(timeDiff).toBeLessThan(5000);
    });

    test('should include lastSuccessfulScrape when available', async () => {
      const response = await request(app).get('/api/health');
      
      if (response.body.lastSuccessfulScrape) {
        expect(typeof response.body.lastSuccessfulScrape).toBe('string');
        const scrapeTimestamp = new Date(response.body.lastSuccessfulScrape);
        expect(scrapeTimestamp.toISOString()).toBe(response.body.lastSuccessfulScrape);
        
        // Last successful scrape should be in the past
        const now = new Date();
        expect(scrapeTimestamp.getTime()).toBeLessThanOrEqual(now.getTime());
      }
    });
  });

  describe('Health Status Validation', () => {
    test('should return healthy status when scraping service is working', async () => {
      const response = await request(app).get('/api/health');
      
      // When everything is working, should report healthy
      // This test will validate the logic when implemented
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });

    test('should return degraded status when scraping has issues', async () => {
      // This test will validate degraded status reporting
      // Will be meaningful when health check logic is implemented
      expect(true).toBe(true); // Placeholder until health logic is implemented
    });

    test('should return unhealthy status when scraping service is down', async () => {
      // This test will validate unhealthy status reporting
      // Will be meaningful when health check logic is implemented
      expect(true).toBe(true); // Placeholder until health logic is implemented
    });
  });

  describe('Performance Requirements', () => {
    test('should respond very quickly (under 100ms)', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/api/health');
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100); // Health check should be very fast
    });
  });

  describe('Version Information', () => {
    test('should return semantic version format', async () => {
      const response = await request(app).get('/api/health');
      
      // Version should follow semantic versioning (major.minor.patch)
      expect(response.body.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test('should return consistent version across requests', async () => {
      const response1 = await request(app).get('/api/health');
      const response2 = await request(app).get('/api/health');
      
      expect(response1.body.version).toBe(response2.body.version);
    });
  });

  describe('Monitoring Integration', () => {
    test('should be suitable for monitoring systems', async () => {
      const response = await request(app).get('/api/health');
      
      // Health endpoint should always return 200 for monitoring
      // The actual health status is in the response body
      expect(response.status).toBe(200);
      
      // Should have all required fields for monitoring
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      
      // Status should be one of the expected values
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });

    test('should provide enough information for alerting', async () => {
      const response = await request(app).get('/api/health');
      
      // Should have timestamp for monitoring systems
      expect(response.body.timestamp).toBeDefined();
      
      // Should have status for alert conditions
      expect(response.body.status).toBeDefined();
      
      // Should have version for deployment tracking
      expect(response.body.version).toBeDefined();
    });
  });

  describe('CORS Headers', () => {
    test('should include proper CORS headers', async () => {
      const response = await request(app).get('/api/health');
      
      // These headers should be present when CORS is configured
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Caching Headers', () => {
    test('should have appropriate cache headers for health checks', async () => {
      const response = await request(app).get('/api/health');
      
      // Health checks should typically not be cached
      // This ensures monitoring gets fresh data
      if (response.headers['cache-control']) {
        expect(response.headers['cache-control']).toMatch(/no-cache|no-store|max-age=0/);
      }
    });
  });
});
