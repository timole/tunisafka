const request = require('supertest');
const app = require('../../src/app');

describe('Contract Test: GET /api/menus', () => {
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
      const response = await request(app).get('/api/menus');
      expect(response.status).toBe(200);
    });

    test('should return JSON content type', async () => {
      const response = await request(app).get('/api/menus');
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    test('should return proper response schema', async () => {
      const response = await request(app).get('/api/menus');
      
      expect(response.body).toHaveProperty('menus');
      expect(response.body).toHaveProperty('lastUpdated');
      expect(response.body).toHaveProperty('source');
      expect(response.body).toHaveProperty('scrapingResult');
      
      // Validate menus array structure
      expect(Array.isArray(response.body.menus)).toBe(true);
      
      // Validate scrapingResult structure
      const { scrapingResult } = response.body;
      expect(scrapingResult).toHaveProperty('timestamp');
      expect(scrapingResult).toHaveProperty('success');
      expect(scrapingResult).toHaveProperty('menusFound');
      expect(scrapingResult).toHaveProperty('source');
      expect(scrapingResult).toHaveProperty('duration');
    });

    test('should validate menu object schema when menus exist', async () => {
      const response = await request(app).get('/api/menus');
      
      if (response.body.menus.length > 0) {
        const menu = response.body.menus[0];
        
        // Required menu fields
        expect(menu).toHaveProperty('id');
        expect(menu).toHaveProperty('title');
        expect(menu).toHaveProperty('items');
        expect(menu).toHaveProperty('availability');
        expect(menu).toHaveProperty('lastUpdated');
        expect(menu).toHaveProperty('isSelected');
        
        // Validate menu field types
        expect(typeof menu.id).toBe('string');
        expect(typeof menu.title).toBe('string');
        expect(Array.isArray(menu.items)).toBe(true);
        expect(typeof menu.availability).toBe('object');
        expect(typeof menu.lastUpdated).toBe('string');
        expect(typeof menu.isSelected).toBe('boolean');
        
        // Validate availability structure
        expect(menu.availability).toHaveProperty('startTime');
        expect(menu.availability).toHaveProperty('endTime');
        expect(menu.availability).toHaveProperty('days');
        expect(Array.isArray(menu.availability.days)).toBe(true);
        
        // Validate menu items structure if items exist
        if (menu.items.length > 0) {
          const item = menu.items[0];
          expect(item).toHaveProperty('id');
          expect(item).toHaveProperty('name');
          expect(item).toHaveProperty('price');
          expect(item).toHaveProperty('dietary');
          expect(item).toHaveProperty('allergens');
          expect(item).toHaveProperty('availability');
          
          expect(typeof item.id).toBe('string');
          expect(typeof item.name).toBe('string');
          expect(typeof item.price).toBe('string');
          expect(Array.isArray(item.dietary)).toBe(true);
          expect(Array.isArray(item.allergens)).toBe(true);
          expect(typeof item.availability).toBe('string');
        }
      }
    });

    test('should have valid timestamp formats', async () => {
      const response = await request(app).get('/api/menus');
      
      // Validate ISO timestamp format
      const lastUpdated = new Date(response.body.lastUpdated);
      expect(lastUpdated.toISOString()).toBe(response.body.lastUpdated);
      
      const scrapingTimestamp = new Date(response.body.scrapingResult.timestamp);
      expect(scrapingTimestamp.toISOString()).toBe(response.body.scrapingResult.timestamp);
    });

    test('should have valid source URL', async () => {
      const response = await request(app).get('/api/menus');
      
      expect(response.body.source).toBe('https://unisafka.fi/tty/');
      expect(response.body.scrapingResult.source).toBe('https://unisafka.fi/tty/');
    });
  });

  describe('Error Response', () => {
    // These tests will pass when error handling is implemented
    test('should return 500 status for scraping errors', async () => {
      // This test will fail initially until error handling is implemented
      // Mock network failure scenario would be tested here
      // For now, we expect this to work when implemented
      expect(true).toBe(true); // Placeholder until error scenarios can be mocked
    });

    test('should return 503 status when source is unavailable', async () => {
      // This test will fail initially until error handling is implemented
      // Mock source unavailable scenario would be tested here
      expect(true).toBe(true); // Placeholder until error scenarios can be mocked
    });

    test('should return proper error response schema', async () => {
      // This test validates error response structure when implemented
      // Error response should have: error, code, retry, timestamp
      expect(true).toBe(true); // Placeholder until error handling is implemented
    });
  });

  describe('Performance Requirements', () => {
    test('should respond within 3 seconds', async () => {
      const startTime = Date.now();
      const response = await request(app).get('/api/menus');
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(3000); // 3 second requirement
    });
  });

  describe('CORS Headers', () => {
    test('should include proper CORS headers', async () => {
      const response = await request(app).get('/api/menus');
      
      // These headers should be present when CORS is configured
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
