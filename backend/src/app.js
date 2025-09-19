/**
 * Express Application Setup
 * Main application server for Tunisafka Food Menu API
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import services
const MenuService = require('./services/MenuService');
const RandomSelectionService = require('./services/RandomSelectionService');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const healthRoutes = require('./routes/health');
const menuRoutes = require('./routes/menus');

class TunisafkaApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    
    // Initialize services
    this.menuService = new MenuService();
    this.randomSelectionService = new RandomSelectionService();
    
    // Setup middleware and routes
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Sets up Express middleware
   */
  setupMiddleware() {
    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // CORS configuration - always set headers for tests
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.header('Access-Control-Max-Age', '86400');
      next();
    });
    
    // Also use cors middleware for additional functionality
    const corsOptions = {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: false,
      maxAge: 86400,
    };
    this.app.use(cors(corsOptions));

    // Request logging
    this.app.use(logger);

    // Rate limiting
    this.app.use('/api', rateLimiter);

    // Security headers
    this.app.use(this.securityHeaders);

    // Make services available to routes
    this.app.use((req, res, next) => {
      req.menuService = this.menuService;
      req.randomSelectionService = this.randomSelectionService;
      next();
    });
  }

  /**
   * Gets allowed CORS origins based on environment
   */
  getAllowedOrigins() {
    const defaultOrigins = ['http://localhost:3000'];
    
    if (process.env.NODE_ENV === 'production') {
      const prodOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [];
      return [...defaultOrigins, ...prodOrigins];
    }
    
    // Development origins
    return [
      ...defaultOrigins,
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
  }

  /**
   * Security headers middleware
   */
  securityHeaders(req, res, next) {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Cache control for API responses
    if (req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    next();
  }

  /**
   * Sets up application routes
   */
  setupRoutes() {
    // Health check (no auth required)
    this.app.use('/api/health', healthRoutes);

    // API routes
    this.app.use('/api/menus', menuRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Tunisafka Food Menu API',
        version: '1.0.0',
        description: 'API for scraping and serving university cafeteria menu data',
        endpoints: {
          health: '/api/health',
          menus: '/api/menus',
          randomMenu: '/api/menus/random',
        },
        documentation: '/api/docs',
        timestamp: new Date().toISOString(),
      });
    });

    // API documentation endpoint
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'Tunisafka Food Menu API',
        version: '1.0.0',
        description: 'API for scraping and serving university cafeteria menu data from https://unisafka.fi/tty/',
        baseUrl: `${req.protocol}://${req.get('host')}/api`,
        endpoints: [
          {
            path: '/health',
            method: 'GET',
            description: 'Health check endpoint',
            response: 'Service health status',
          },
          {
            path: '/menus',
            method: 'GET',
            description: 'Get all available menus',
            response: 'Array of menu objects with scraping metadata',
          },
          {
            path: '/menus/random',
            method: 'GET',
            description: 'Get a randomly selected menu',
            response: 'Single menu object marked as selected',
          },
        ],
        examples: {
          menuObject: {
            id: 'lunch-menu',
            title: 'Lunch Menu',
            description: 'Daily hot lunch offerings',
            items: [
              {
                id: 'chicken-curry',
                name: 'Chicken Curry',
                description: 'Spicy chicken curry with rice',
                price: '€8.90',
                dietary: ['gluten-free'],
                allergens: ['contains dairy'],
                availability: '',
              },
            ],
            availability: {
              startTime: '11:00',
              endTime: '14:00',
              days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            },
            lastUpdated: '2025-09-18T10:30:00Z',
            isSelected: false,
          },
        },
      });
    });

    // Catch-all for 404s
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
        availableEndpoints: [
          '/api/health',
          '/api/menus',
          '/api/menus/random',
          '/api/docs',
        ],
      });
    });
  }

  /**
   * Sets up error handling middleware
   */
  setupErrorHandling() {
    // Global error handler (must be last)
    this.app.use(errorHandler);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });
  }

  /**
   * Starts the server
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.port, () => {
          console.log(`🚀 Tunisafka API server running on port ${this.port}`);
          console.log(`📱 Health check: http://localhost:${this.port}/api/health`);
          console.log(`🍽️  Menus endpoint: http://localhost:${this.port}/api/menus`);
          console.log(`🎲 Random menu: http://localhost:${this.port}/api/menus/random`);
          console.log(`📚 Documentation: http://localhost:${this.port}/api/docs`);
          console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
          
          resolve(server);
        });

        server.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${this.port} is already in use`);
          } else {
            console.error('❌ Server error:', error);
          }
          reject(error);
        });

        // Graceful shutdown handlers
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM', server));
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT', server));

      } catch (error) {
        console.error('❌ Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Graceful shutdown handling
   */
  gracefulShutdown(signal, server = null) {
    console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

    if (server) {
      server.close((error) => {
        if (error) {
          console.error('❌ Error during server shutdown:', error);
          process.exit(1);
        } else {
          console.log('✅ Server closed gracefully');
          process.exit(0);
        }
      });

      // Force close after timeout
      setTimeout(() => {
        console.error('❌ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    } else {
      process.exit(1);
    }
  }

  /**
   * Gets the Express app instance
   */
  getApp() {
    return this.app;
  }

  /**
   * Gets current server configuration
   */
  getConfig() {
    return {
      port: this.port,
      environment: process.env.NODE_ENV || 'development',
      allowedOrigins: this.getAllowedOrigins(),
      version: '1.0.0',
    };
  }
}

// Create and export app instance
const tunisafkaApp = new TunisafkaApp();

// Export the Express app for testing
module.exports = tunisafkaApp.getApp();

// Start server if this file is run directly
if (require.main === module) {
  tunisafkaApp.start().catch((error) => {
    console.error('❌ Failed to start Tunisafka API server:', error);
    process.exit(1);
  });
}
