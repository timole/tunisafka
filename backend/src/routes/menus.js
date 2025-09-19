/**
 * Menu Routes
 * API endpoints for menu data and random selection
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/menus
 * Gets all available menus with fresh data
 */
router.get('/', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    
    console.log('🍽️  Fetching all menus...');
    const result = await menuService.getAllMenus();
    
    console.log(`✅ Successfully retrieved ${result.menus.length} menus`);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error fetching menus:', error.message);
    next(error);
  }
});

/**
 * GET /api/menus/random
 * Gets a randomly selected menu
 */
router.get('/random', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    const randomSelectionService = req.randomSelectionService;
    
    console.log('🎲 Selecting random menu...');
    
    // Get all available menus
    const { menus } = await menuService.getAllMenus();
    
    if (menus.length === 0) {
      return res.status(404).json({
        error: 'No menus available for random selection',
        code: 'NO_MENUS_AVAILABLE',
        retry: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Select random menu
    const result = randomSelectionService.selectRandomMenu(menus);
    
    console.log(`✅ Random menu selected: ${result.selectedMenu.title}`);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error selecting random menu:', error.message);
    next(error);
  }
});

/**
 * GET /api/menus/stats
 * Gets menu statistics and metadata
 */
router.get('/stats', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    const randomSelectionService = req.randomSelectionService;
    
    console.log('📊 Generating menu statistics...');
    
    const [menuStats, randomStats] = await Promise.all([
      menuService.getMenuStatistics(),
      Promise.resolve(randomSelectionService.getSelectionStatistics()),
    ]);
    
    const response = {
      menuStatistics: menuStats,
      selectionStatistics: randomStats,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`✅ Statistics generated for ${menuStats.totalMenus} menus`);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error generating statistics:', error.message);
    next(error);
  }
});

/**
 * GET /api/menus/dietary/:type
 * Gets menus filtered by dietary requirements
 */
router.get('/dietary/:type', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    const dietaryType = req.params.type;
    
    console.log(`🥗 Filtering menus by dietary type: ${dietaryType}`);
    
    const result = await menuService.getMenusByDietary(dietaryType);
    
    console.log(`✅ Found ${result.menus.length} menus matching dietary requirement: ${dietaryType}`);
    
    res.json({
      ...result,
      dietaryFilter: dietaryType,
    });
    
  } catch (error) {
    console.error(`❌ Error filtering menus by dietary type ${req.params.type}:`, error.message);
    next(error);
  }
});

/**
 * GET /api/menus/available
 * Gets menus that are currently available based on time
 */
router.get('/available', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    
    console.log('⏰ Filtering menus by current availability...');
    
    const result = await menuService.getCurrentlyAvailableMenus();
    
    console.log(`✅ Found ${result.menus.length} currently available menus`);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error filtering available menus:', error.message);
    next(error);
  }
});

/**
 * GET /api/menus/:id
 * Gets a specific menu by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    const menuId = req.params.id;
    
    console.log(`🔍 Looking for menu with ID: ${menuId}`);
    
    const menu = await menuService.getMenuById(menuId);
    
    if (!menu) {
      return res.status(404).json({
        error: `Menu with ID '${menuId}' not found`,
        code: 'MENU_NOT_FOUND',
        availableMenus: (await menuService.getMenus()).menus.map(m => ({ id: m.id, title: m.title })),
        timestamp: new Date().toISOString(),
      });
    }
    
    console.log(`✅ Found menu: ${menu.title}`);
    
    res.json({
      menu,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error(`❌ Error fetching menu ${req.params.id}:`, error.message);
    next(error);
  }
});

/**
 * POST /api/menus/refresh
 * Forces a fresh scrape of menu data
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    
    console.log('🔄 Forcing menu data refresh...');
    
    const result = await menuService.refreshMenus();
    
    console.log(`✅ Menu data refreshed: ${result.menus.length} menus loaded`);
    
    res.json({
      ...result,
      refreshed: true,
      message: 'Menu data has been refreshed',
    });
    
  } catch (error) {
    console.error('❌ Error refreshing menu data:', error.message);
    next(error);
  }
});

/**
 * GET /api/menus/random/multiple
 * Gets multiple random selections for comparison
 */
router.get('/random/multiple', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    const randomSelectionService = req.randomSelectionService;
    
    const count = Math.min(parseInt(req.query.count) || 5, 10); // Max 10 selections
    
    console.log(`🎲 Generating ${count} random menu selections...`);
    
    // Get all available menus
    const { menus } = await menuService.getAllMenus();
    
    if (menus.length === 0) {
      return res.status(404).json({
        error: 'No menus available for random selection',
        code: 'NO_MENUS_AVAILABLE',
        retry: true,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Generate multiple selections
    const result = randomSelectionService.createMultipleSelections(menus, count);
    
    console.log(`✅ Generated ${result.selections.length} random selections`);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error generating multiple random selections:', error.message);
    next(error);
  }
});

/**
 * POST /api/menus/test-randomness
 * Tests the randomness of the selection algorithm
 */
router.post('/test-randomness', async (req, res, next) => {
  try {
    const menuService = req.menuService;
    const randomSelectionService = req.randomSelectionService;
    
    const iterations = Math.min(parseInt(req.body.iterations) || 100, 1000); // Max 1000 iterations
    
    console.log(`🧪 Testing randomness with ${iterations} iterations...`);
    
    // Get all available menus
    const { menus } = await menuService.getAllMenus();
    
    if (menus.length < 2) {
      return res.status(400).json({
        error: 'Need at least 2 menus to test randomness',
        code: 'INSUFFICIENT_MENUS',
        currentMenuCount: menus.length,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Test randomness
    const result = randomSelectionService.testRandomness(menus, iterations);
    
    console.log(`✅ Randomness test completed: ${result.isRandom ? 'PASS' : 'FAIL'}`);
    
    res.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Error testing randomness:', error.message);
    next(error);
  }
});

module.exports = router;
