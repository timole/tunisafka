/**
 * CacheEntry Model
 * Represents a cached menu data entry with metadata
 */

class CacheEntry {
  constructor(data = {}) {
    this.date = data.date || null;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.timezone = data.timezone || 'Europe/Helsinki';
    this.menuData = data.menuData || [];
    this.scrapingResult = data.scrapingResult || null;
    this.version = data.version || '1.0.0';
  }

  /**
   * Creates a CacheEntry from JSON data
   */
  static fromJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      return new CacheEntry(data);
    } catch (error) {
      throw new Error(`Invalid CacheEntry JSON: ${error.message}`);
    }
  }

  /**
   * Validates the cache entry
   */
  validate() {
    const errors = [];

    if (!this.date) {
      errors.push('Date is required');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(this.date)) {
      errors.push('Date must be in YYYY-MM-DD format');
    }

    if (!this.timestamp) {
      errors.push('Timestamp is required');
    } else {
      try {
        new Date(this.timestamp);
      } catch {
        errors.push('Timestamp must be a valid ISO string');
      }
    }

    if (!this.timezone) {
      errors.push('Timezone is required');
    }

    if (!Array.isArray(this.menuData)) {
      errors.push('MenuData must be an array');
    }

    if (!this.version) {
      errors.push('Version is required');
    }

    if (errors.length > 0) {
      throw new Error(`CacheEntry validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Checks if this cache entry is valid for a given date
   */
  isValidForDate(targetDate) {
    return this.date === targetDate;
  }

  /**
   * Checks if this cache entry is valid for today in the specified timezone
   */
  isValidForToday(timezone = this.timezone) {
    try {
      let currentDate;
      
      // Try using Intl.DateTimeFormatter if available
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormatter) {
        const formatter = new Intl.DateTimeFormatter('sv-SE', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        currentDate = formatter.format(new Date());
      } else {
        // Fallback for environments where Intl is not available
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        currentDate = `${year}-${month}-${day}`;
      }
      
      return this.isValidForDate(currentDate);
    } catch (error) {
      console.warn('⚠️ Timezone validation failed, using UTC:', error.message);
      
      // Fallback to UTC date
      const now = new Date();
      const utcDate = now.toISOString().split('T')[0];
      return this.isValidForDate(utcDate);
    }
  }

  /**
   * Gets the age of this cache entry in milliseconds
   */
  getAge() {
    return Date.now() - new Date(this.timestamp).getTime();
  }

  /**
   * Gets formatted age of this cache entry
   */
  getFormattedAge() {
    const ageMs = this.getAge();
    const hours = Math.floor(ageMs / (1000 * 60 * 60));
    const minutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return '<1m';
    }
  }

  /**
   * Gets the number of menus in this cache entry
   */
  getMenuCount() {
    return this.menuData ? this.menuData.length : 0;
  }

  /**
   * Gets total number of menu items across all menus
   */
  getTotalItemCount() {
    if (!this.menuData || !Array.isArray(this.menuData)) {
      return 0;
    }

    return this.menuData.reduce((total, menu) => {
      if (menu && Array.isArray(menu.items)) {
        return total + menu.items.length;
      }
      return total;
    }, 0);
  }

  /**
   * Gets cache entry statistics
   */
  getStatistics() {
    return {
      date: this.date,
      age: this.getFormattedAge(),
      ageMs: this.getAge(),
      menuCount: this.getMenuCount(),
      totalItems: this.getTotalItemCount(),
      timezone: this.timezone,
      version: this.version,
      isValid: this.isValidForToday(),
      scrapingSuccess: this.scrapingResult ? this.scrapingResult.success : null,
      scrapingDuration: this.scrapingResult ? this.scrapingResult.duration : null
    };
  }

  /**
   * Converts to JSON representation
   */
  toJSON() {
    return {
      date: this.date,
      timestamp: this.timestamp,
      timezone: this.timezone,
      menuData: this.menuData,
      scrapingResult: this.scrapingResult,
      version: this.version
    };
  }

  /**
   * Converts to string representation
   */
  toString() {
    return `CacheEntry[${this.date}, ${this.getMenuCount()} menus, ${this.getFormattedAge()} old]`;
  }

  /**
   * Creates a copy of this cache entry
   */
  clone() {
    return new CacheEntry(this.toJSON());
  }

  /**
   * Updates the menu data while preserving metadata
   */
  updateMenuData(newMenuData, newScrapingResult = null) {
    this.menuData = newMenuData;
    this.timestamp = new Date().toISOString();
    
    if (newScrapingResult) {
      this.scrapingResult = newScrapingResult;
    }
    
    return this;
  }

  /**
   * Checks if the cache entry has expired based on a custom TTL
   */
  isExpired(ttlMs = 24 * 60 * 60 * 1000) { // Default 24 hours
    return this.getAge() > ttlMs;
  }

  /**
   * Gets metadata summary
   */
  getMetadata() {
    return {
      date: this.date,
      timestamp: this.timestamp,
      timezone: this.timezone,
      version: this.version,
      age: this.getFormattedAge(),
      isValid: this.isValidForToday()
    };
  }
}

module.exports = CacheEntry;
