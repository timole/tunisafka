/**
 * ApiService
 * Handles all HTTP requests to the backend API
 */

import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = this.getBaseURL();
    this.timeout = 30000; // 30 second timeout (for menu scraping)

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Setup interceptors
    this.setupInterceptors();
  }

  /**
   * Determines the API base URL based on environment
   */
  getBaseURL() {
    // Check for environment variable first
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }

    // Default to localhost in development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3001/api';
    }

    // Production fallback
    return '/api';
  }

  /**
   * Sets up axios interceptors for request/response handling
   */
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(
          `🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error) => {
        console.error('🔴 API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `✅ API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        console.error('🔴 API Response Error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });

        return Promise.reject(this.transformError(error));
      }
    );
  }

  /**
   * Transforms axios errors into consistent error format
   */
  transformError(error) {
    const transformed = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      originalError: error,
      retry: false,
    };

    if (error.code === 'ECONNABORTED') {
      transformed.message = 'Request timed out. Please try again.';
      transformed.code = 'TIMEOUT_ERROR';
      transformed.retry = true;
    } else if (error.code === 'ERR_NETWORK') {
      transformed.message = 'Network error. Please check your connection.';
      transformed.code = 'NETWORK_ERROR';
      transformed.retry = true;
    } else if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      transformed.message = data?.error || `Server error (${status})`;
      transformed.code = data?.code || `HTTP_${status}`;
      transformed.retry = data?.retry || status >= 500;

      if (status === 404) {
        transformed.retry = true;
      }
    } else if (error.request) {
      // Request was made but no response received
      transformed.message = 'Unable to connect to server. Please try again.';
      transformed.code = 'CONNECTION_ERROR';
      transformed.retry = true;
    }

    return transformed;
  }

  /**
   * Gets all available menus
   */
  async getMenus() {
    try {
      const response = await this.client.get('/menus');
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets a randomly selected menu
   */
  async getRandomMenu() {
    try {
      const response = await this.client.get('/menus/random');
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets a randomly selected single meal (menu item)
   */
  async getRandomMeal() {
    try {
      const response = await this.client.get('/menus/random-meal');
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets API health status
   */
  async getHealthStatus() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets detailed health information
   */
  async getDetailedHealth() {
    try {
      const response = await this.client.get('/health/detailed');
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets menu statistics
   */
  async getMenuStatistics() {
    try {
      const response = await this.client.get('/menus/stats');
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets menus filtered by dietary requirements
   */
  async getMenusByDietary(dietaryType) {
    try {
      const response = await this.client.get(
        `/menus/dietary/${encodeURIComponent(dietaryType)}`
      );
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets currently available menus
   */
  async getAvailableMenus() {
    try {
      const response = await this.client.get('/menus/available');
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets a specific menu by ID
   */
  async getMenuById(menuId) {
    try {
      const response = await this.client.get(
        `/menus/${encodeURIComponent(menuId)}`
      );
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Forces a refresh of menu data
   */
  async refreshMenus() {
    try {
      const response = await this.client.post('/menus/refresh');
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Gets multiple random selections
   */
  async getMultipleRandomSelections(count = 5) {
    try {
      const response = await this.client.get('/menus/random/multiple', {
        params: { count: Math.min(count, 10) },
      });
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Tests the randomness of selection algorithm
   */
  async testRandomness(iterations = 100) {
    try {
      const response = await this.client.post('/menus/test-randomness', {
        iterations: Math.min(iterations, 1000),
      });
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Generic GET request with error handling
   */
  async get(endpoint, config = {}) {
    try {
      const response = await this.client.get(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Generic POST request with error handling
   */
  async post(endpoint, data = {}, config = {}) {
    try {
      const response = await this.client.post(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Sets custom timeout for requests
   */
  setTimeout(timeout) {
    this.timeout = timeout;
    this.client.defaults.timeout = timeout;
  }

  /**
   * Sets custom base URL
   */
  setBaseURL(baseURL) {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  /**
   * Gets current configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
    };
  }

  /**
   * Checks if the API is reachable
   */
  async checkConnection() {
    try {
      const startTime = Date.now();
      await this.getHealthStatus();
      const duration = Date.now() - startTime;

      return {
        connected: true,
        responseTime: duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Retries a failed request with exponential backoff
   */
  async retryRequest(requestFn, maxRetries = 3, initialDelay = 1000) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry if it's not a retryable error
        if (!error.retry || attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(
          `🔄 Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Creates a request with automatic retry
   */
  async getWithRetry(endpoint, config = {}, maxRetries = 3) {
    return this.retryRequest(() => this.get(endpoint, config), maxRetries);
  }

  /**
   * Creates a POST request with automatic retry
   */
  async postWithRetry(endpoint, data = {}, config = {}, maxRetries = 3) {
    return this.retryRequest(
      () => this.post(endpoint, data, config),
      maxRetries
    );
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;
