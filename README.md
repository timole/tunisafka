### Tunisafka Food Menu
Discover delicious meals available at the TTY university cafeterias. The app fetches menus from `https://unisafka.fi/tty/`, shows them in a clean UI, and lets you pick a random menu.

This demo was created during a guest lecture on the course Software Testing at Tampere University in September 2025.

![Tunisafka demo](docs/tunisafka-demo.gif)

### Quick start
- Prereqs: Node.js 18+, npm 9+

- Install dependencies
  - Backend: `cd backend && npm install`
  - Frontend: `cd frontend && npm install`

- Start services
  - Backend: `cd backend && npm start` (http://localhost:3001)
  - Frontend: `cd frontend && npm start` (http://localhost:3000)

### Run tests
- Backend: `cd backend && npm test`
- Frontend: `cd frontend && npm test`

### API
- GET `/api/health` → service health
- GET `/api/menus` → all menus
- GET `/api/menus/random` → one random menu

### Notes
- Scraper uses a fast test-data path by default for development. Puppeteer scraping can be enabled later when needed.
- CORS, rate limiting, and centralized error handling are enabled on the API.

### Project structure
```
backend/     Express API, scraping & services
frontend/    React app (React 18)
specs/       Feature specs, plans, contracts
```

