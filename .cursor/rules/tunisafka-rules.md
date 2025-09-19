# Tunisafka Food Menu App - Development Context

## Project Overview
Web application that scrapes food menus from unisafka.fi/tty/ and displays them with random menu selection. 

**Tech Stack**: ReactJS frontend + NodeJS backend, no database/cache, real-time scraping only.

## Architecture
- **Frontend**: React 18, Axios for HTTP, React Testing Library
- **Backend**: Express.js, Cheerio for scraping, Jest + Supertest for testing
- **Structure**: Web app (frontend/ and backend/ directories)
- **API**: REST endpoints for menu data and random selection

## Key Requirements
- FR-001: Scrape and display menus from https://unisafka.fi/tty/
- FR-002: Clear, readable menu format in main interface  
- FR-003: Visible "Select Random Menu" button
- FR-004: Random menu selection on button click
- FR-005: Visual indication of selected menu
- FR-006: Handle unavailable menu data gracefully
- FR-007: Real-time data refresh (no caching)
- FR-008: Loading states and error messages
- FR-009: Standard web browser compatibility

## Data Model
- **Menu**: id, title, description, items[], availability, lastUpdated, isSelected
- **MenuItem**: id, name, description, price, dietary[], allergens[], availability
- **ScrapingResult**: timestamp, success, menusFound, source, error, duration

## API Endpoints
- `GET /api/menus` - Fetch all current menus
- `GET /api/menus/random` - Get random menu selection
- `GET /api/health` - Service health check

## Performance Goals
- Menu loading: <3 seconds
- Random selection: <1 second  
- Real-time updates on user request only

## Development Guidelines
- TDD approach: tests first, then implementation
- No database or persistent caching
- Graceful error handling for scraping failures
- Simple, maintainable code structure
- Standard React/Express patterns

## Recent Changes
- Feature specification completed (001-tunisafka-app-shows)
- Technical research and architecture decisions finalized
- API contracts defined in OpenAPI 3.0 format
- Data model and quickstart guide created
