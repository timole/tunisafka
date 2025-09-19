/**
 * CacheService
 * Handles file-based daily caching for menu data without using a database
 */

const fs = require('fs').promises;
const path = require('path');

class CacheService {
  constructor(cacheDir = './cache', timezone = 'Europe/Helsinki') {
    this.cacheDir = cacheDir;
    this.timezone = timezone;
    this.cacheFile = path.join(cacheDir, 'daily-menus.json');
    this.statsFile = path.join(cacheDir, 'cache-stats.json');
    this.hits = 0;
    this.misses = 0;
    this.lastAccess = null;
  }

  /**
   * Ensures cache directory exists
   */
  async ensureCacheDir() {
    try {
      await fs.access(this.cacheDir);
    } catch {
      await fs.mkdir(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Gets current date in the specified timezone as YYYY-MM-DD
   */
  getCurrentDate() {
    try {
      // Try using Intl.DateTimeFormatter if available
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormatter) {
        const formatter = new Intl.DateTimeFormatter('sv-SE', {
          timeZone: this.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        return formatter.format(new Date());
      }
    } catch {
      // Fallback for environments where Intl is not available (like some test environments)
    }
    
    // Fallback: use simple UTC date (may not respect timezone but works for testing)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Creates a cache entry structure
   */
  createCacheEntry(menuData, scrapingResult) {
    return {
      date: this.getCurrentDate(),
      timestamp: new Date().toISOString(),
      timezone: this.timezone,
      menuData: menuData,
      scrapingResult: scrapingResult,
      version: '1.0.0'
    };
  }

  /**
   * Checks if cache entry is valid for today
   */
  isCacheValid(cacheEntry) {
    if (!cacheEntry || !cacheEntry.date) {
      return false;
    }
    
    const currentDate = this.getCurrentDate();
    return cacheEntry.date === currentDate;
  }

  /**
   * Loads cache entry from file
   */
  async loadCache() {
    try {
      await this.ensureCacheDir();
      const data = await fs.readFile(this.cacheFile, 'utf8');
      const cacheEntry = JSON.parse(data);
      
      if (this.isCacheValid(cacheEntry)) {
        this.hits++;
        this.lastAccess = new Date().toISOString();
        return cacheEntry;
      } else {
        // Cache is stale
        this.misses++;
        return null;
      }
    } catch (error) {
      // Cache file doesn't exist or is corrupted
      this.misses++;
      return null;
    }
  }

  /**
   * Loads cache entry from file regardless of validity (for fallback)
   */
  async loadCacheForFallback() {
    try {
      await this.ensureCacheDir();
      const data = await fs.readFile(this.cacheFile, 'utf8');
      const cacheEntry = JSON.parse(data);
      return cacheEntry;
    } catch (error) {
      return null;
    }
  }

  /**
   * Saves cache entry to file
   */
  async saveCache(menuData, scrapingResult) {
    try {
      await this.ensureCacheDir();
      const cacheEntry = this.createCacheEntry(menuData, scrapingResult);
      
      // Write atomically by writing to temp file first, then renaming
      const tempFile = this.cacheFile + '.tmp';
      
      try {
        await fs.writeFile(tempFile, JSON.stringify(cacheEntry, null, 2), 'utf8');
        await fs.rename(tempFile, this.cacheFile);
      } catch (renameError) {
        // Cleanup temp file if rename fails
        try {
          await fs.unlink(tempFile);
        } catch {
          // Ignore cleanup errors
        }
        throw renameError;
      }
      
      console.log(`📁 Cache saved for ${cacheEntry.date} with ${menuData.length} menus`);
      
      // Update stats
      await this.updateStats();
      
      return cacheEntry;
    } catch (error) {
      console.error('❌ Failed to save cache:', error.message);
      throw new Error('Cache save failed: ' + error.message);
    }
  }

  /**
   * Gets cached menu data if valid, null otherwise
   */
  async getCachedMenus() {
    const cacheEntry = await this.loadCache();
    if (cacheEntry) {
      console.log(`📁 Cache HIT for ${cacheEntry.date} (${cacheEntry.menuData.length} menus)`);
      return {
        menus: cacheEntry.menuData,
        lastUpdated: cacheEntry.timestamp,
        source: 'cache',
        scrapingResult: cacheEntry.scrapingResult,
        cacheDate: cacheEntry.date,
        cacheAge: this.getCacheAge(cacheEntry.timestamp)
      };
    } else {
      console.log(`📁 Cache MISS for ${this.getCurrentDate()}`);
      return null;
    }
  }

  /**
   * Caches menu data for today
   */
  async cacheMenus(menuData, scrapingResult) {
    await this.saveCache(menuData, scrapingResult);
    console.log(`📁 Cached ${menuData.length} menus for ${this.getCurrentDate()}`);
  }

  /**
   * Clears the cache
   */
  async clearCache() {
    try {
      await fs.unlink(this.cacheFile);
      console.log('📁 Cache cleared');
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, which means cache is already cleared
        console.log('📁 Cache was already empty');
        return true;
      }
      console.error('❌ Failed to clear cache:', error.message);
      throw new Error('Cache clear failed: ' + error.message);
    }
  }

  /**
   * Gets cache statistics
   */
  async getCacheStats() {
    try {
      const cacheEntry = await this.loadCache();
      const hitRate = this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) : 0;
      
      let cacheSize = 0;
      try {
        const stats = await fs.stat(this.cacheFile);
        cacheSize = stats.size;
      } catch {
        // Cache file doesn't exist
      }

      return {
        isValid: cacheEntry !== null,
        currentDate: this.getCurrentDate(),
        cacheDate: cacheEntry ? cacheEntry.date : null,
        lastUpdated: cacheEntry ? cacheEntry.timestamp : null,
        cacheAge: cacheEntry ? this.getCacheAge(cacheEntry.timestamp) : null,
        hits: this.hits,
        misses: this.misses,
        hitRate: `${hitRate}%`,
        cacheSize: this.formatBytes(cacheSize),
        timezone: this.timezone,
        lastAccess: this.lastAccess
      };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error.message);
      return {
        error: 'Failed to retrieve cache statistics',
        message: error.message
      };
    }
  }

  /**
   * Gets cache age in human readable format
   */
  getCacheAge(timestamp) {
    if (!timestamp) return null;
    
    const now = new Date();
    const cacheTime = new Date(timestamp);
    const ageMs = now.getTime() - cacheTime.getTime();
    
    const hours = Math.floor(ageMs / (1000 * 60 * 60));
    const minutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Formats bytes into human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Updates cache statistics file
   */
  async updateStats() {
    try {
      const stats = {
        totalHits: this.hits,
        totalMisses: this.misses,
        lastUpdate: new Date().toISOString(),
        timezone: this.timezone
      };
      
      await fs.writeFile(this.statsFile, JSON.stringify(stats, null, 2), 'utf8');
    } catch (error) {
      // Stats update failure shouldn't break the cache operation
      console.warn('⚠️ Failed to update cache stats:', error.message);
    }
  }

  /**
   * Loads persistent statistics
   */
  async loadStats() {
    try {
      const data = await fs.readFile(this.statsFile, 'utf8');
      const stats = JSON.parse(data);
      this.hits = stats.totalHits || 0;
      this.misses = stats.totalMisses || 0;
    } catch {
      // Stats file doesn't exist or is corrupted, start fresh
      this.hits = 0;
      this.misses = 0;
    }
  }

  /**
   * Initializes the cache service
   */
  async initialize() {
    await this.ensureCacheDir();
    await this.loadStats();
    console.log(`📁 CacheService initialized (timezone: ${this.timezone})`);
  }

  /**
   * Checks if a cache refresh is needed (always true if no valid cache)
   */
  async needsRefresh() {
    const cacheEntry = await this.loadCache();
    return cacheEntry === null;
  }

  /**
   * Gets cache file path for testing/debugging
   */
  getCacheFilePath() {
    return this.cacheFile;
  }

  /**
   * Sets timezone for cache date calculations
   */
  setTimezone(timezone) {
    this.timezone = timezone;
  }
}

module.exports = CacheService;
