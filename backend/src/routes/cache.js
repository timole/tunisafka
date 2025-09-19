/**
 * Cache Routes
 * API endpoints for cache management and monitoring
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/cache/status
 * Gets current cache status and statistics
 */
router.get('/status', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    
    console.log('📊 Getting cache status...');
    const cacheStats = await menuService.getCacheStats();
    
    const response = {
      cacheStats,
      timestamp: new Date().toISOString(),
      endpoint: '/api/cache/status'
    };
    
    console.log(`✅ Cache status retrieved: ${cacheStats.isValid ? 'VALID' : 'INVALID'}`);
    
    // Set cache-related headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Cache-Status': cacheStats.isValid ? 'hit' : 'miss',
      'Cache-Date': cacheStats.cacheDate || 'none',
      'Cache-Age': cacheStats.cacheAge || '0'
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error getting cache status:', error.message);
    next(error);
  }
});

/**
 * DELETE /api/cache/clear
 * Clears the cache manually
 */
router.delete('/clear', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    
    console.log('🗑️  Clearing cache...');
    const cleared = await menuService.clearCache();
    
    const response = {
      success: cleared,
      message: 'Cache has been cleared',
      timestamp: new Date().toISOString(),
      nextRequest: 'Next menu request will trigger fresh scraping'
    };
    
    console.log('✅ Cache cleared successfully');
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error.message);
    next(error);
  }
});

/**
 * POST /api/cache/refresh
 * Forces cache refresh by clearing and re-scraping
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    
    console.log('🔄 Refreshing cache with fresh data...');
    const result = await menuService.refreshMenus();
    
    const response = {
      ...result,
      refreshed: true,
      message: 'Cache has been refreshed with fresh data',
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Cache refreshed: ${result.menus.length} menus loaded`);
    
    // Set cache-related headers
    res.set({
      'Cache-Status': 'refresh',
      'Cache-Date': new Date().toISOString().split('T')[0],
      'Cache-Age': '0'
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error refreshing cache:', error.message);
    next(error);
  }
});

/**
 * GET /api/cache/info
 * Gets detailed cache information and metadata
 */
router.get('/info', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    
    console.log('ℹ️  Getting detailed cache information...');
    
    const [cacheStats, serviceStatus] = await Promise.all([
      menuService.getCacheStats(),
      menuService.getServiceStatus()
    ]);
    
    const response = {
      cache: cacheStats,
      service: serviceStatus,
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
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Cache information retrieved');
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error getting cache information:', error.message);
    next(error);
  }
});

/**
 * GET /api/cache/validate
 * Validates current cache state
 */
router.get('/validate', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    
    console.log('🔍 Validating cache state...');
    
    const cacheStats = await menuService.getCacheStats();
    const currentDate = new Date().toISOString().split('T')[0];
    
    const validation = {
      isValid: cacheStats.isValid,
      currentDate: currentDate,
      cacheDate: cacheStats.cacheDate,
      dateMatches: cacheStats.cacheDate === currentDate,
      hasData: cacheStats.cacheDate !== null,
      age: cacheStats.cacheAge,
      timezone: cacheStats.timezone,
      recommendations: []
    };
    
    // Add recommendations
    if (!validation.isValid) {
      validation.recommendations.push('Cache is invalid or stale - consider refreshing');
    }
    if (!validation.hasData) {
      validation.recommendations.push('No cached data available - first request will trigger scraping');
    }
    if (validation.isValid && validation.hasData) {
      validation.recommendations.push('Cache is valid and ready to serve requests');
    }
    
    const response = {
      validation,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Cache validation complete: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error validating cache:', error.message);
    next(error);
  }
});

module.exports = router;
