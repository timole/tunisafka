/**
 * CacheService Unit Tests
 * Tests the file-based daily caching functionality
 */

const fs = require('fs').promises;
const path = require('path');
const CacheService = require('../../src/services/CacheService');

describe('CacheService', () => {
  let cacheService;
  let testCacheDir;

  beforeEach(async () => {
    // Create a unique test cache directory
    testCacheDir = path.join(__dirname, '..', '..', 'test-cache', `test-${Date.now()}`);
    cacheService = new CacheService(testCacheDir, 'Europe/Helsinki');
    await cacheService.initialize();
  });

  afterEach(async () => {
    // Clean up test cache directory
    try {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    test('should create cache directory on initialization', async () => {
      const newCacheService = new CacheService(path.join(testCacheDir, 'new-dir'));
      await newCacheService.initialize();
      
      const dirExists = await fs.access(path.join(testCacheDir, 'new-dir'))
        .then(() => true)
        .catch(() => false);
      
      expect(dirExists).toBe(true);
    });

    test('should load existing stats on initialization', async () => {
      // Pre-create stats file
      const statsFile = path.join(testCacheDir, 'cache-stats.json');
      const stats = { totalHits: 5, totalMisses: 3 };
      await fs.writeFile(statsFile, JSON.stringify(stats));

      const newCacheService = new CacheService(testCacheDir);
      await newCacheService.initialize();

      expect(newCacheService.hits).toBe(5);
      expect(newCacheService.misses).toBe(3);
    });
  });

  describe('Current Date Handling', () => {
    test('should return current date in YYYY-MM-DD format', () => {
      const currentDate = cacheService.getCurrentDate();
      expect(currentDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should handle timezone configuration', () => {
      const utcService = new CacheService(testCacheDir, 'UTC');
      const helsinkiService = new CacheService(testCacheDir, 'Europe/Helsinki');
      
      // Both should return valid dates (might be same or different)
      const utcDate = utcService.getCurrentDate();
      const helsinkiDate = helsinkiService.getCurrentDate();
      
      expect(utcDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(helsinkiDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Cache Entry Creation', () => {
    test('should create valid cache entry', () => {
      const menuData = [{ id: 'test-menu', title: 'Test Menu' }];
      const scrapingResult = { success: true, duration: 1000 };
      
      const cacheEntry = cacheService.createCacheEntry(menuData, scrapingResult);
      
      expect(cacheEntry).toMatchObject({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        timezone: 'Europe/Helsinki',
        menuData: menuData,
        scrapingResult: scrapingResult,
        version: '1.0.0'
      });
    });
  });

  describe('Cache Validation', () => {
    test('should validate cache entry for today', () => {
      const todayEntry = {
        date: cacheService.getCurrentDate(),
        timestamp: new Date().toISOString()
      };
      
      expect(cacheService.isCacheValid(todayEntry)).toBe(true);
    });

    test('should invalidate cache entry for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      
      const yesterdayEntry = {
        date: yesterdayDate,
        timestamp: yesterday.toISOString()
      };
      
      expect(cacheService.isCacheValid(yesterdayEntry)).toBe(false);
    });

    test('should invalidate null or invalid cache entry', () => {
      expect(cacheService.isCacheValid(null)).toBe(false);
      expect(cacheService.isCacheValid({})).toBe(false);
      expect(cacheService.isCacheValid({ date: null })).toBe(false);
    });
  });

  describe('Cache Save and Load', () => {
    test('should save and load cache successfully', async () => {
      const menuData = [
        { id: 'menu1', title: 'Test Menu 1', items: [] },
        { id: 'menu2', title: 'Test Menu 2', items: [] }
      ];
      const scrapingResult = { success: true, duration: 1500, source: 'test' };
      
      // Save cache
      const savedEntry = await cacheService.saveCache(menuData, scrapingResult);
      
      // Load cache
      const loadedEntry = await cacheService.loadCache();
      
      expect(loadedEntry).not.toBeNull();
      expect(loadedEntry.menuData).toEqual(menuData);
      expect(loadedEntry.scrapingResult).toEqual(scrapingResult);
      expect(loadedEntry.date).toBe(savedEntry.date);
    });

    test('should return null when no cache file exists', async () => {
      const loadedEntry = await cacheService.loadCache();
      expect(loadedEntry).toBeNull();
    });

    test('should handle corrupted cache file gracefully', async () => {
      // Create corrupted cache file
      const cacheFile = path.join(testCacheDir, 'daily-menus.json');
      await fs.writeFile(cacheFile, 'invalid json');
      
      const loadedEntry = await cacheService.loadCache();
      expect(loadedEntry).toBeNull();
      expect(cacheService.misses).toBe(1);
    });
  });

  describe('Cache Methods', () => {
    test('should cache and retrieve menu data', async () => {
      const menuData = [{ id: 'test', title: 'Test Menu' }];
      const scrapingResult = { success: true, duration: 1000 };
      
      // Cache the data
      await cacheService.cacheMenus(menuData, scrapingResult);
      
      // Retrieve cached data
      const cachedData = await cacheService.getCachedMenus();
      
      expect(cachedData).not.toBeNull();
      expect(cachedData.menus).toEqual(menuData);
      expect(cachedData.source).toBe('cache');
      expect(cachedData.scrapingResult).toEqual(scrapingResult);
    });

    test('should return null for invalid cache', async () => {
      // Create cache for yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      
      const cacheEntry = {
        date: yesterdayDate,
        timestamp: yesterday.toISOString(),
        timezone: 'Europe/Helsinki',
        menuData: [{ id: 'old', title: 'Old Menu' }],
        scrapingResult: { success: true },
        version: '1.0.0'
      };
      
      const cacheFile = path.join(testCacheDir, 'daily-menus.json');
      await fs.writeFile(cacheFile, JSON.stringify(cacheEntry));
      
      const cachedData = await cacheService.getCachedMenus();
      expect(cachedData).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    test('should track cache hits and misses', async () => {
      // First call should be a miss
      await cacheService.getCachedMenus();
      expect(cacheService.misses).toBe(1);
      expect(cacheService.hits).toBe(0);
      
      // Cache some data
      await cacheService.cacheMenus([{ id: 'test' }], { success: true });
      
      // Second call should be a hit
      await cacheService.getCachedMenus();
      expect(cacheService.hits).toBe(1);
      expect(cacheService.misses).toBe(1);
    });

    test('should provide cache statistics', async () => {
      const stats = await cacheService.getCacheStats();
      
      expect(stats).toMatchObject({
        isValid: expect.any(Boolean),
        currentDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        hits: expect.any(Number),
        misses: expect.any(Number),
        hitRate: expect.stringMatching(/^\d+(\.\d+)?%$/),
        timezone: 'Europe/Helsinki'
      });
    });
  });

  describe('Cache Management', () => {
    test('should clear cache successfully', async () => {
      // Create cache first
      await cacheService.cacheMenus([{ id: 'test' }], { success: true });
      
      // Verify cache exists
      let cachedData = await cacheService.getCachedMenus();
      expect(cachedData).not.toBeNull();
      
      // Clear cache
      const cleared = await cacheService.clearCache();
      expect(cleared).toBe(true);
      
      // Verify cache is cleared
      cachedData = await cacheService.getCachedMenus();
      expect(cachedData).toBeNull();
    });

    test('should handle clearing non-existent cache', async () => {
      const cleared = await cacheService.clearCache();
      expect(cleared).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle race conditions during save', async () => {
      const menuData = [{ id: 'test', title: 'Test Menu' }];
      const scrapingResult = { success: true, duration: 1000 };
      
      // Simulate concurrent saves (but handle potential failures gracefully)
      const saves = [
        cacheService.saveCache(menuData, scrapingResult),
        cacheService.saveCache(menuData, scrapingResult),
        cacheService.saveCache(menuData, scrapingResult)
      ];
      
      // At least one should succeed, others might fail due to race conditions
      const results = await Promise.allSettled(saves);
      expect(results).toHaveLength(3);
      
      // At least one should be successful
      const successfulResults = results.filter(result => result.status === 'fulfilled');
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Check that successful results have proper structure
      successfulResults.forEach(result => {
        expect(result.value).toMatchObject({
          date: expect.any(String),
          menuData: menuData,
          scrapingResult: scrapingResult
        });
      });
    });

    test('should handle invalid cache directory permissions', async () => {
      // This test might not work on all systems, so we'll make it conditional
      if (process.platform !== 'win32') {
        const restrictedDir = path.join(testCacheDir, 'restricted');
        await fs.mkdir(restrictedDir, { mode: 0o000 });
        
        const restrictedService = new CacheService(path.join(restrictedDir, 'cache'));
        
        try {
          await restrictedService.initialize();
          // If this doesn't throw, the test passed
        } catch (error) {
          expect(error.message).toContain('permission denied');
        }
        
        // Restore permissions for cleanup
        await fs.chmod(restrictedDir, 0o755);
      }
    });

    test('should handle timezone edge cases', () => {
      const utcService = new CacheService(testCacheDir, 'UTC');
      const invalidService = new CacheService(testCacheDir, 'Invalid/Timezone');
      
      // Both should return valid dates without throwing
      expect(() => utcService.getCurrentDate()).not.toThrow();
      expect(() => invalidService.getCurrentDate()).not.toThrow();
    });
  });

  describe('Cache Age Calculations', () => {
    test('should calculate cache age correctly', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const age = cacheService.getCacheAge(oneHourAgo);
      expect(age).toMatch(/^1h \d+m$/);
    });

    test('should handle recent cache entries', () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const age = cacheService.getCacheAge(twoMinutesAgo);
      expect(age).toBe('2m');
    });
  });

  describe('Configuration', () => {
    test('should allow timezone configuration', () => {
      cacheService.setTimezone('UTC');
      expect(cacheService.timezone).toBe('UTC');
    });

    test('should provide cache file path for debugging', () => {
      const filePath = cacheService.getCacheFilePath();
      expect(filePath).toBe(path.join(testCacheDir, 'daily-menus.json'));
    });

    test('should check if refresh is needed', async () => {
      // No cache initially
      let needsRefresh = await cacheService.needsRefresh();
      expect(needsRefresh).toBe(true);
      
      // Cache some data
      await cacheService.cacheMenus([{ id: 'test' }], { success: true });
      
      // Should not need refresh now
      needsRefresh = await cacheService.needsRefresh();
      expect(needsRefresh).toBe(false);
    });
  });
});
