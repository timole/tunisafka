/**
 * MenuService
 * Handles menu data processing, validation, and business logic
 */

const ScrapingService = require('./ScrapingService');
const CacheService = require('./CacheService');
const Menu = require('../models/Menu');
const MenuItem = require('../models/MenuItem');

class MenuService {
  constructor() {
    this.scrapingService = new ScrapingService();
    this.cacheService = new CacheService();
    this.lastScrapingResult = null;
    this.lastUpdate = null;
    this._isInitialized = false;
  }

  /**
   * Initializes the service (must be called before use)
   */
  async initialize() {
    if (!this._isInitialized) {
      await this.cacheService.initialize();
      this._isInitialized = true;
    }
  }

  /**
   * Gets all available menus with caching support
   */
  async getAllMenus() {
    await this.initialize();
    
    try {
      // Try to get cached data first
      const cachedData = await this.cacheService.getCachedMenus();
      if (cachedData) {
        this.lastUpdate = cachedData.lastUpdated;
        this.lastScrapingResult = cachedData.scrapingResult;
        
        return {
          ...cachedData,
          source: this.scrapingService.sourceUrl + ' (cached)',
        };
      }

      // No valid cache, scrape fresh data
      console.log('🕸️  No valid cache found, scraping fresh data...');
      const { menus, result } = await this.scrapingService.scrapeMenus();
      
      // Process and validate menus
      const processedMenus = this.processMenus(menus);
      
      // Cache the processed data
      await this.cacheService.cacheMenus(processedMenus, result);
      
      // Update metadata
      this.lastScrapingResult = result;
      this.lastUpdate = new Date().toISOString();
      
      return {
        menus: processedMenus,
        lastUpdated: this.lastUpdate,
        source: this.scrapingService.sourceUrl,
        scrapingResult: result,
      };
    } catch (error) {
      console.error('Error in MenuService.getAllMenus:', error);
      
      // Try to serve stale cache as fallback
      try {
        console.log('🔄 Attempting to serve stale cache as fallback...');
        // For fallback, we'll try to load any existing cache regardless of validity
        const cacheEntry = await this.cacheService.loadCacheForFallback();
        if (cacheEntry && cacheEntry.menuData) {
          console.log('✅ Serving stale cache data as fallback');
          return {
            menus: cacheEntry.menuData,
            lastUpdated: cacheEntry.timestamp,
            source: this.scrapingService.sourceUrl + ' (stale cache)',
            scrapingResult: cacheEntry.scrapingResult,
            warning: 'Serving cached data due to scraping failure',
            scrapingError: error.message,
            cacheDate: cacheEntry.date,
          };
        }
      } catch (fallbackError) {
        console.error('❌ Fallback cache also failed:', fallbackError.message);
      }
      
      throw error;
    }
  }

  /**
   * Processes raw menus from scraping service
   */
  processMenus(rawMenus) {
    return rawMenus
      .map(menu => this.processMenu(menu))
      .filter(menu => menu !== null)
      .map((menu, index) => {
        // Ensure unique IDs
        if (!menu.id || menu.id === 'undefined') {
          menu.id = `menu-${index + 1}`;
        }
        return menu;
      });
  }

  /**
   * Processes a single menu
   */
  processMenu(menu) {
    try {
      // Ensure it's a Menu instance
      const menuInstance = menu instanceof Menu ? menu : Menu.fromScrapedData(menu);
      
      // Process menu items
      menuInstance.items = this.processMenuItems(menuInstance.items);
      
      // Validate processed menu
      menuInstance.validate();
      
      return menuInstance;
    } catch (error) {
      console.warn('Failed to process menu:', error.message);
      return null;
    }
  }

  /**
   * Processes menu items array
   */
  processMenuItems(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map(item => this.processMenuItem(item))
      .filter(item => item !== null);
  }

  /**
   * Processes a single menu item
   */
  processMenuItem(item) {
    try {
      // Ensure it's a MenuItem instance
      const itemInstance = item instanceof MenuItem ? item : MenuItem.fromScrapedData(item);
      
      // Additional processing
      this.enrichMenuItem(itemInstance);
      
      // Validate processed item
      itemInstance.validate();
      
      return itemInstance;
    } catch (error) {
      console.warn('Failed to process menu item:', error.message);
      return null;
    }
  }

  /**
   * Enriches menu item with additional data
   */
  enrichMenuItem(item) {
    // Standardize price format
    if (item.price && !item.price.includes('€')) {
      const numericPrice = item.getPriceNumeric();
      if (numericPrice > 0) {
        item.price = `€${numericPrice.toFixed(2)}`;
      }
    }

    // Clean and standardize dietary information
    item.dietary = this.standardizeDietaryInfo(item.dietary);
    
    // Clean and standardize allergen information
    item.allergens = this.standardizeAllergenInfo(item.allergens);
  }

  /**
   * Standardizes dietary information
   */
  standardizeDietaryInfo(dietary) {
    if (!Array.isArray(dietary)) {
      return [];
    }

    const standardMap = {
      'veg': 'vegetarian',
      'veggie': 'vegetarian',
      'plant-based': 'vegan',
      'gluten free': 'gluten-free',
      'gluteeniton': 'gluten-free',
      'dairy free': 'dairy-free',
      'laktoositon': 'dairy-free',
      'luomu': 'organic',
    };

    return dietary
      .map(item => {
        const normalized = item.toLowerCase().trim();
        return standardMap[normalized] || normalized;
      })
      .filter((item, index, array) => array.indexOf(item) === index) // Remove duplicates
      .filter(item => item.length > 0);
  }

  /**
   * Standardizes allergen information
   */
  standardizeAllergenInfo(allergens) {
    if (!Array.isArray(allergens)) {
      return [];
    }

    const standardMap = {
      'gluten': 'contains gluten',
      'wheat': 'contains gluten',
      'vehnä': 'contains gluten',
      'milk': 'contains dairy',
      'dairy': 'contains dairy',
      'maito': 'contains dairy',
      'nuts': 'contains nuts',
      'pähkinä': 'contains nuts',
      'egg': 'contains eggs',
      'muna': 'contains eggs',
      'fish': 'contains fish',
      'kala': 'contains fish',
      'soy': 'contains soy',
      'soja': 'contains soy',
    };

    return allergens
      .map(item => {
        const normalized = item.toLowerCase().trim();
        return standardMap[normalized] || (item.startsWith('contains') ? item : `contains ${item}`);
      })
      .filter((item, index, array) => array.indexOf(item) === index) // Remove duplicates
      .filter(item => item.length > 0);
  }

  /**
   * Gets cache statistics
   */
  async getCacheStats() {
    await this.initialize();
    return await this.cacheService.getCacheStats();
  }

  /**
   * Clears the cache
   */
  async clearCache() {
    await this.initialize();
    return await this.cacheService.clearCache();
  }

  /**
   * Gets menus (always uses caching now)
   */
  async getMenus() {
    return await this.getAllMenus();
  }

  /**
   * Gets a specific menu by ID
   */
  async getMenuById(id) {
    const { menus } = await this.getMenus();
    return menus.find(menu => menu.id === id) || null;
  }

  /**
   * Filters menus by dietary requirements
   */
  async getMenusByDietary(dietaryFilter) {
    const { menus, ...metadata } = await this.getMenus();
    
    const filteredMenus = menus.filter(menu => {
      return menu.items.some(item => 
        item.dietary.some(diet => 
          diet.toLowerCase().includes(dietaryFilter.toLowerCase())
        )
      );
    });

    return {
      menus: filteredMenus,
      ...metadata,
    };
  }

  /**
   * Gets menus available at current time
   */
  async getCurrentlyAvailableMenus() {
    const { menus, ...metadata } = await this.getMenus();
    
    const availableMenus = menus.filter(menu => menu.isCurrentlyAvailable());

    return {
      menus: availableMenus,
      ...metadata,
    };
  }

  /**
   * Gets menu statistics
   */
  async getMenuStatistics() {
    const { menus, scrapingResult } = await this.getMenus();
    
    const totalItems = menus.reduce((sum, menu) => sum + menu.getItemCount(), 0);
    const allDietaryCategories = [...new Set(menus.flatMap(menu => menu.getAllDietaryCategories()))];
    const allAllergens = [...new Set(menus.flatMap(menu => menu.getAllAllergens()))];
    
    const priceStats = this.calculatePriceStatistics(menus);
    
    return {
      totalMenus: menus.length,
      totalItems,
      averageItemsPerMenu: Math.round(totalItems / menus.length * 100) / 100,
      dietaryCategories: allDietaryCategories,
      allergens: allAllergens,
      priceStatistics: priceStats,
      lastUpdate: this.lastUpdate,
      scrapingDuration: scrapingResult ? scrapingResult.getFormattedDuration() : null,
    };
  }

  /**
   * Calculates price statistics for menu items
   */
  calculatePriceStatistics(menus) {
    const allPrices = menus
      .flatMap(menu => menu.items)
      .map(item => item.getPriceNumeric())
      .filter(price => price > 0);

    if (allPrices.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        average: 0,
      };
    }

    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const average = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;

    return {
      count: allPrices.length,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      average: Math.round(average * 100) / 100,
    };
  }

  /**
   * Validates menu data integrity
   */
  validateMenuData(menus) {
    const errors = [];

    if (!Array.isArray(menus)) {
      errors.push('Menus must be an array');
      return errors;
    }

    menus.forEach((menu, index) => {
      try {
        if (!(menu instanceof Menu)) {
          errors.push(`Menu ${index} is not a valid Menu instance`);
          return;
        }

        menu.validate();

        // Additional business rule validations
        if (menu.items.length === 0) {
          errors.push(`Menu ${menu.id} has no items`);
        }

        menu.items.forEach((item, itemIndex) => {
          if (!(item instanceof MenuItem)) {
            errors.push(`Menu ${menu.id} item ${itemIndex} is not a valid MenuItem instance`);
            return;
          }

          try {
            item.validate();
          } catch (itemError) {
            errors.push(`Menu ${menu.id} item ${item.id}: ${itemError.message}`);
          }
        });

      } catch (menuError) {
        errors.push(`Menu ${index}: ${menuError.message}`);
      }
    });

    return errors;
  }

  /**
   * Gets the last scraping result
   */
  getLastScrapingResult() {
    return this.lastScrapingResult;
  }

  /**
   * Forces a fresh scrape (clears cache)
   */
  async refreshMenus() {
    await this.initialize();
    await this.cacheService.clearCache();
    this.lastUpdate = null;
    this.lastScrapingResult = null;
    
    return await this.getAllMenus();
  }

  /**
   * Sets custom scraping service configuration
   */
  setScrapingConfig(config) {
    if (config.sourceUrl) {
      this.scrapingService.setSourceUrl(config.sourceUrl);
    }
    if (config.timeout) {
      this.scrapingService.setTimeout(config.timeout);
    }
  }

  /**
   * Gets current service status
   */
  async getServiceStatus() {
    await this.initialize();
    const cacheStats = await this.getCacheStats();
    
    return {
      isHealthy: this.lastScrapingResult ? this.lastScrapingResult.success : null,
      lastUpdate: this.lastUpdate,
      lastScrapingResult: this.lastScrapingResult,
      scrapingConfig: this.scrapingService.getConfig(),
      cacheStats: cacheStats,
    };
  }
}

module.exports = MenuService;
