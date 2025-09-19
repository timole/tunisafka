/**
 * Health Check Routes
 * Provides service health monitoring endpoints
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
router.get('/', async (req, res) => {
  try {
    const menuService = req.menuService;
    const serviceStatus = await menuService.getServiceStatus();
    
    // Determine health status
    let status = 'healthy';
    let lastSuccessfulScrape = null;
    
    if (serviceStatus.lastScrapingResult) {
      if (!serviceStatus.lastScrapingResult.success) {
        status = 'degraded';
      }
      
      if (serviceStatus.lastScrapingResult.success) {
        lastSuccessfulScrape = serviceStatus.lastUpdate;
      }
    }
    
    // If we haven't scraped recently, we might be unhealthy
    if (serviceStatus.lastUpdate) {
      const lastUpdateTime = new Date(serviceStatus.lastUpdate);
      const now = new Date();
      const timeSinceUpdate = now.getTime() - lastUpdateTime.getTime();
      
      // If last update was more than 30 minutes ago, consider degraded
      if (timeSinceUpdate > 30 * 60 * 1000) {
        status = 'degraded';
      }
      
      // If last update was more than 2 hours ago, consider unhealthy
      if (timeSinceUpdate > 2 * 60 * 60 * 1000) {
        status = 'unhealthy';
      }
    }
    
    const healthResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
    
    // Include last successful scrape if available
    if (lastSuccessfulScrape) {
      healthResponse.lastSuccessfulScrape = lastSuccessfulScrape;
    }
    
    // Add service details in development
    if (process.env.NODE_ENV !== 'production') {
      healthResponse.serviceDetails = {
        cacheStats: serviceStatus.cacheStats,
        lastScrapingSuccess: serviceStatus.lastScrapingResult ? serviceStatus.lastScrapingResult.success : null,
        scrapingConfig: serviceStatus.scrapingConfig,
      };
    }
    
    res.json(healthResponse);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      error: 'Health check failed',
    });
  }
});

/**
 * GET /api/health/detailed
 * Detailed health information for debugging
 */
router.get('/detailed', async (req, res) => {
  try {
    const menuService = req.menuService;
    const randomService = req.randomSelectionService;
    
    const serviceStatus = await menuService.getServiceStatus();
    const randomConfig = randomService.getConfig();
    const randomStats = randomService.getSelectionStatistics();
    
    // Perform a quick test scrape to verify functionality
    let testScrapeResult = null;
    try {
      const testResult = await menuService.getMenus();
      testScrapeResult = {
        success: true,
        menuCount: testResult.menus.length,
        duration: testResult.scrapingResult ? testResult.scrapingResult.duration : null,
      };
    } catch (testError) {
      testScrapeResult = {
        success: false,
        error: testError.message,
      };
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: testScrapeResult.success ? 'healthy' : 'unhealthy',
      services: {
        menuService: {
          ...serviceStatus,
          testScrape: testScrapeResult,
        },
        randomSelectionService: {
          config: randomConfig,
          statistics: randomStats,
        },
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    });
    
  } catch (error) {
    console.error('Detailed health check error:', error);
    
    res.status(503).json({
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'unhealthy',
      error: 'Detailed health check failed',
      message: error.message,
    });
  }
});

module.exports = router;
