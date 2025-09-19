# Tunisafka Food Menu App - Development Context

## Project Overview
Web application that scrapes food menus from unisafka.fi/tty/ and displays them with random menu selection. 

**Tech Stack**: ReactJS frontend + NodeJS backend, file-based daily caching for menu data.

## Architecture
- **Frontend**: React 18, Axios for HTTP, React Testing Library
- **Backend**: Express.js, Cheerio for scraping, Jest + Supertest for testing, CacheService for daily data storage
- **Structure**: Web app (frontend/ and backend/ directories)
- **API**: REST endpoints for menu data and random selection with cache headers

## Key Requirements
- FR-001: Scrape and display menus from https://unisafka.fi/tty/
- FR-002: Clear, readable menu format in main interface  
- FR-003: Visible "Select Random Menu" button
- FR-004: Random menu selection on button click
- FR-005: Visual indication of selected menu
- FR-006: Handle unavailable menu data gracefully
- FR-007: Daily caching with automatic refresh (cache valid for 24 hours)
- FR-008: Loading states and error messages
- FR-009: Standard web browser compatibility

## Data Model
- **Menu**: id, title, description, items[], availability, lastUpdated, isSelected
- **MenuItem**: id, name, description, price, dietary[], allergens[], availability
- **ScrapingResult**: timestamp, success, menusFound, source, error, duration
- **CacheEntry**: date, timestamp, timezone, menuData[], scrapingResult, isValid
- **CacheService**: cache validation, file operations, hit/miss tracking

## API Endpoints
- `GET /api/menus` - Fetch all current menus (cache-enabled with Cache-Status header)
- `GET /api/menus/random` - Get random menu selection (uses cached data when available)
- `GET /api/health` - Service health check with cache status
- `GET /api/cache/status` - Cache performance metrics and statistics
- `DELETE /api/cache/clear` - Clear cached data (admin/debugging)

## Performance Goals
- Menu loading: <1 second (from cache), <3 seconds (fresh scraping)
- Random selection: <1 second (cache-enabled)
- Daily cache refresh on first request of new day

## Development Guidelines
- TDD approach: tests first, then implementation
- File-based caching only (no database usage)
- Graceful error handling for scraping and cache failures
- Simple, maintainable code structure
- Standard React/Express patterns
- Cache fallback to scraping on any cache error

## Recent Changes
- Daily caching feature implemented (002-use-a-cache)
- File-based cache storage with timezone support (CacheService)
- Cache management API endpoints added (/api/cache/*)
- Cache headers and fallback mechanisms implemented
- Updated health endpoint with cache status integration
