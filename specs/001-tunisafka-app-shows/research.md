# Research: Tunisafka Food Menu App Technology Choices

**Feature**: Web scraping application with ReactJS frontend and NodeJS backend  
**Date**: 2025-09-18  
**Status**: Complete

## Technology Research Summary

### Web Scraping Technology Choice

**Decision**: Cheerio for HTML parsing  
**Rationale**: 
- Lightweight jQuery-like server-side HTML manipulation
- Perfect for static content scraping from unisafka.fi
- No need for browser automation (Puppeteer) since target site likely has static HTML
- Better performance for simple DOM parsing
- Smaller memory footprint

**Alternatives considered**:
- **Puppeteer**: Rejected - overkill for static content, high memory usage
- **Playwright**: Rejected - unnecessary complexity for basic HTML scraping
- **jsdom**: Rejected - less convenient API than Cheerio for scraping

### Frontend Framework

**Decision**: React 18 with functional components and hooks  
**Rationale**:
- Modern React patterns with concurrent features
- Excellent for real-time UI updates (menu selection highlighting)
- Strong ecosystem for HTTP client integration
- Built-in state management sufficient for simple app

**Alternatives considered**:
- **Vue.js**: Rejected - React more commonly used in similar projects
- **Vanilla JavaScript**: Rejected - unnecessary complexity for state management
- **React with class components**: Rejected - outdated pattern

### HTTP Client (Frontend)

**Decision**: Axios  
**Rationale**:
- Interceptor support for error handling
- Automatic JSON parsing
- Request/response transformation
- Better error handling than fetch()

**Alternatives considered**:
- **fetch()**: Rejected - requires more boilerplate for error handling
- **SWR/React Query**: Rejected - overkill for simple API calls without caching

### Backend Framework

**Decision**: Express.js  
**Rationale**:
- Minimal setup required
- Excellent middleware ecosystem
- Perfect for simple REST API
- Well-documented CORS handling

**Alternatives considered**:
- **Fastify**: Rejected - performance gains not needed for this scale
- **Koa.js**: Rejected - async/await patterns not significant advantage here
- **Vanilla Node.js http**: Rejected - unnecessary complexity

### Error Handling Strategy

**Decision**: Graceful degradation with user feedback  
**Rationale**:
- Target website may be temporarily unavailable
- Network issues common in university environments
- User should understand when data is stale or unavailable

**Implementation approach**:
- Timeout handling for scraping requests
- Retry logic with exponential backoff
- Clear error messages in UI
- Loading states during data fetching

### CORS Handling

**Decision**: Express CORS middleware with specific origin configuration  
**Rationale**:
- Development and production environment differences
- Security best practices for cross-origin requests
- Flexible configuration for different deployment scenarios

### Performance Optimization

**Decision**: Request debouncing and loading states  
**Rationale**:
- Prevent excessive scraping requests
- Improve user experience during data loading
- Reduce load on target website

**Implementation approach**:
- 2-second debounce on manual refresh requests
- Loading spinners during data fetching
- Cached responses for duration of user session (in-memory only)

### Testing Strategy

**Decision**: Jest + React Testing Library + Supertest  
**Rationale**:
- Industry standard testing stack
- Good integration between frontend and backend testing
- Mock support for external HTTP requests

**Test coverage areas**:
- Menu scraping logic (mocked responses)
- Random selection algorithm
- Error handling scenarios
- React component behavior
- API endpoint responses

## Integration Patterns

### API Design

**Pattern**: RESTful endpoints with JSON responses  
**Endpoints**:
- `GET /api/menus` - Fetch current menu data
- `GET /api/menus/random` - Get random menu selection

### Error Response Format

```json
{
  "error": "Unable to fetch menu data",
  "code": "SCRAPING_ERROR",
  "retry": true,
  "timestamp": "2025-09-18T10:30:00Z"
}
```

### Success Response Format

```json
{
  "menus": [...],
  "lastUpdated": "2025-09-18T10:30:00Z",
  "source": "https://unisafka.fi/tty/"
}
```

## Security Considerations

**Rate Limiting**: Implement basic rate limiting to prevent abuse of scraping endpoint  
**Input Validation**: Sanitize any user inputs (minimal in this application)  
**HTTPS**: Ensure secure communication in production  
**Error Information**: Avoid exposing internal error details to frontend

## Deployment Considerations

**Environment Variables**: Target URL, port configuration, CORS origins  
**Process Management**: PM2 or similar for production Node.js process  
**Static File Serving**: Express static middleware for React build  
**Health Checks**: Simple endpoint for monitoring scraping service availability

## Summary

All technology choices prioritize simplicity, reliability, and maintainability. The stack is intentionally minimal to reduce complexity while providing a robust foundation for the menu scraping and display functionality.
