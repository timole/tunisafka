/**
 * ScrapingResult Model
 * Represents the result of a scraping operation from the source website
 */

class ScrapingResult {
  constructor({
    timestamp = null,
    success = false,
    menusFound = 0,
    source = '',
    error = null,
    duration = 0,
  }) {
    this.timestamp = timestamp || new Date().toISOString();
    this.success = success;
    this.menusFound = menusFound;
    this.source = source;
    this.error = error;
    this.duration = duration;

    this.validate();
  }

  /**
   * Validates the scraping result data
   */
  validate() {
    if (!this.timestamp || typeof this.timestamp !== 'string') {
      throw new Error('ScrapingResult timestamp is required and must be a string');
    }

    // Validate timestamp is ISO string
    try {
      new Date(this.timestamp);
    } catch (error) {
      throw new Error('ScrapingResult timestamp must be a valid ISO date string');
    }

    if (typeof this.success !== 'boolean') {
      throw new Error('ScrapingResult success must be a boolean');
    }

    if (typeof this.menusFound !== 'number' || this.menusFound < 0) {
      throw new Error('ScrapingResult menusFound must be a non-negative number');
    }

    if (typeof this.source !== 'string') {
      throw new Error('ScrapingResult source must be a string');
    }

    if (this.error !== null && typeof this.error !== 'string') {
      throw new Error('ScrapingResult error must be null or a string');
    }

    if (typeof this.duration !== 'number' || this.duration < 0) {
      throw new Error('ScrapingResult duration must be a non-negative number');
    }

    // Business rule validation
    if (!this.success && this.menusFound > 0) {
      throw new Error('ScrapingResult cannot have menus found when not successful');
    }

    if (!this.success && !this.error) {
      throw new Error('ScrapingResult must have error message when not successful');
    }

    if (this.success && this.error) {
      throw new Error('ScrapingResult cannot have error message when successful');
    }
  }

  /**
   * Creates a successful scraping result
   */
  static createSuccess(menusFound, source, duration, timestamp = null) {
    return new ScrapingResult({
      timestamp: timestamp || new Date().toISOString(),
      success: true,
      menusFound,
      source,
      error: null,
      duration,
    });
  }

  /**
   * Creates a failed scraping result
   */
  static createFailure(error, source, duration, timestamp = null) {
    return new ScrapingResult({
      timestamp: timestamp || new Date().toISOString(),
      success: false,
      menusFound: 0,
      source,
      error,
      duration,
    });
  }

  /**
   * Creates a scraping result from scraping operation
   */
  static fromScrapingOperation(startTime, endTime, result, source) {
    const timestamp = endTime.toISOString();
    const duration = endTime.getTime() - startTime.getTime();

    if (result.success) {
      return ScrapingResult.createSuccess(
        result.menusFound || 0,
        source,
        duration,
        timestamp
      );
    } else {
      return ScrapingResult.createFailure(
        result.error || 'Unknown scraping error',
        source,
        duration,
        timestamp
      );
    }
  }

  /**
   * Returns a plain object representation
   */
  toJSON() {
    return {
      timestamp: this.timestamp,
      success: this.success,
      menusFound: this.menusFound,
      source: this.source,
      error: this.error,
      duration: this.duration,
    };
  }

  /**
   * Gets the duration in seconds
   */
  getDurationSeconds() {
    return Math.round(this.duration / 1000 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Gets a formatted duration string
   */
  getFormattedDuration() {
    const seconds = this.getDurationSeconds();
    if (seconds < 1) {
      return `${this.duration}ms`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Gets the age of this scraping result in milliseconds
   */
  getAge() {
    const now = new Date();
    const scrapingTime = new Date(this.timestamp);
    return now.getTime() - scrapingTime.getTime();
  }

  /**
   * Gets the age of this scraping result in seconds
   */
  getAgeSeconds() {
    return Math.round(this.getAge() / 1000 * 100) / 100;
  }

  /**
   * Gets the age of this scraping result in minutes
   */
  getAgeMinutes() {
    return Math.round(this.getAge() / (1000 * 60) * 100) / 100;
  }

  /**
   * Checks if this result is considered fresh (within specified minutes)
   */
  isFresh(maxAgeMinutes = 5) {
    return this.getAgeMinutes() <= maxAgeMinutes;
  }

  /**
   * Checks if this result is considered stale
   */
  isStale(maxAgeMinutes = 10) {
    return this.getAgeMinutes() > maxAgeMinutes;
  }

  /**
   * Gets a user-friendly status message
   */
  getStatusMessage() {
    if (this.success) {
      return `Successfully found ${this.menusFound} menu${this.menusFound === 1 ? '' : 's'} in ${this.getFormattedDuration()}`;
    } else {
      return `Failed after ${this.getFormattedDuration()}: ${this.error}`;
    }
  }

  /**
   * Gets a user-friendly age description
   */
  getAgeDescription() {
    const ageMinutes = this.getAgeMinutes();
    
    if (ageMinutes < 1) {
      return 'just now';
    } else if (ageMinutes < 60) {
      const minutes = Math.floor(ageMinutes);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else {
      const hours = Math.floor(ageMinutes / 60);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
  }

  /**
   * Creates a copy of the scraping result
   */
  clone() {
    return new ScrapingResult({
      timestamp: this.timestamp,
      success: this.success,
      menusFound: this.menusFound,
      source: this.source,
      error: this.error,
      duration: this.duration,
    });
  }

  /**
   * Validates scraping result data structure without creating instance
   */
  static isValidScrapingResultData(data) {
    try {
      new ScrapingResult(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets error category for different types of errors
   */
  getErrorCategory() {
    if (this.success) {
      return null;
    }

    if (!this.error) {
      return 'unknown';
    }

    const error = this.error.toLowerCase();
    
    if (error.includes('timeout') || error.includes('time out')) {
      return 'timeout';
    } else if (error.includes('network') || error.includes('connection')) {
      return 'network';
    } else if (error.includes('parse') || error.includes('parsing')) {
      return 'parsing';
    } else if (error.includes('404') || error.includes('not found')) {
      return 'not-found';
    } else if (error.includes('500') || error.includes('server')) {
      return 'server';
    } else {
      return 'other';
    }
  }

  /**
   * Checks if the error is likely recoverable with retry
   */
  isRetryable() {
    if (this.success) {
      return false;
    }

    const category = this.getErrorCategory();
    const retryableCategories = ['timeout', 'network', 'server'];
    
    return retryableCategories.includes(category);
  }

  /**
   * Gets suggested retry delay based on error type
   */
  getSuggestedRetryDelay() {
    if (!this.isRetryable()) {
      return null;
    }

    const category = this.getErrorCategory();
    
    switch (category) {
      case 'timeout':
        return 2000; // 2 seconds
      case 'network':
        return 5000; // 5 seconds
      case 'server':
        return 10000; // 10 seconds
      default:
        return 5000; // 5 seconds default
    }
  }
}

module.exports = ScrapingResult;
