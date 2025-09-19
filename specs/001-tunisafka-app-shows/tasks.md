# Tasks: Tunisafka Food Menu App

**Input**: Design documents from `/specs/001-tunisafka-app-shows/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow ReactJS + NodeJS structure from plan.md

## Phase 3.1: Project Setup
- [ ] T001 Create web application project structure (backend/ and frontend/ directories)
- [ ] T002 Initialize backend Node.js project with Express.js, Cheerio, Jest, Supertest dependencies
- [ ] T003 Initialize frontend React project with Axios, React Testing Library dependencies
- [ ] T004 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.js
- [ ] T005 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.js
- [ ] T006 [P] Setup Jest configuration for backend in backend/jest.config.js
- [ ] T007 [P] Setup Jest configuration for frontend in frontend/src/setupTests.js

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [P] - All can run in parallel
- [ ] T008 [P] Contract test GET /api/menus in backend/tests/contract/test_menus_get.test.js
- [ ] T009 [P] Contract test GET /api/menus/random in backend/tests/contract/test_menus_random.test.js
- [ ] T010 [P] Contract test GET /api/health in backend/tests/contract/test_health.test.js

### Integration Tests [P] - All can run in parallel
- [ ] T011 [P] Integration test "Initial Menu Loading" scenario in backend/tests/integration/test_menu_loading.test.js
- [ ] T012 [P] Integration test "Random Menu Selection" scenario in backend/tests/integration/test_random_selection.test.js
- [ ] T013 [P] Integration test "Error Handling" scenarios in backend/tests/integration/test_error_handling.test.js

### Frontend Component Tests [P] - All can run in parallel
- [ ] T014 [P] Component test MenuList display in frontend/src/components/__tests__/MenuList.test.js
- [ ] T015 [P] Component test MenuCard rendering in frontend/src/components/__tests__/MenuCard.test.js
- [ ] T016 [P] Component test RandomButton interaction in frontend/src/components/__tests__/RandomButton.test.js
- [ ] T017 [P] Component test LoadingSpinner states in frontend/src/components/__tests__/LoadingSpinner.test.js
- [ ] T018 [P] Component test ErrorMessage display in frontend/src/components/__tests__/ErrorMessage.test.js

### Manual Testing Setup
- [ ] T019 [P] Create manual testing checklist in manual-testing.md based on quickstart.md scenarios

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Backend Models [P] - All can run in parallel
- [ ] T020 [P] Menu model with validation in backend/src/models/Menu.js
- [ ] T021 [P] MenuItem model with validation in backend/src/models/MenuItem.js
- [ ] T022 [P] ScrapingResult model in backend/src/models/ScrapingResult.js

### Backend Services [P] - All can run in parallel
- [ ] T023 [P] ScrapingService with Cheerio integration in backend/src/services/ScrapingService.js
- [ ] T024 [P] MenuService for data processing in backend/src/services/MenuService.js
- [ ] T025 [P] RandomSelectionService in backend/src/services/RandomSelectionService.js

### API Endpoints (Sequential - same Express app)
- [ ] T026 Express server setup and middleware in backend/src/app.js
- [ ] T027 GET /api/menus endpoint implementation in backend/src/routes/menus.js
- [ ] T028 GET /api/menus/random endpoint implementation in backend/src/routes/menus.js
- [ ] T029 GET /api/health endpoint implementation in backend/src/routes/health.js
- [ ] T030 Error handling middleware in backend/src/middleware/errorHandler.js
- [ ] T031 CORS configuration in backend/src/middleware/cors.js

### Frontend Components [P] - All can run in parallel (different files)
- [ ] T032 [P] MenuList component in frontend/src/components/MenuList.jsx
- [ ] T033 [P] MenuCard component in frontend/src/components/MenuCard.jsx
- [ ] T034 [P] RandomButton component in frontend/src/components/RandomButton.jsx
- [ ] T035 [P] LoadingSpinner component in frontend/src/components/LoadingSpinner.jsx
- [ ] T036 [P] ErrorMessage component in frontend/src/components/ErrorMessage.jsx

### Frontend Services and State
- [ ] T037 ApiService for HTTP requests in frontend/src/services/ApiService.js
- [ ] T038 Main App component with state management in frontend/src/App.jsx
- [ ] T039 App styling and responsive design in frontend/src/App.css

## Phase 3.4: Integration
- [ ] T040 Connect ScrapingService to MenuService in backend/src/services/MenuService.js
- [ ] T041 Integrate frontend components in App.jsx
- [ ] T042 Add request logging middleware in backend/src/middleware/logger.js
- [ ] T043 Add rate limiting for scraping endpoint in backend/src/middleware/rateLimiter.js
- [ ] T044 Environment configuration for development/production in backend/src/config/environment.js

## Phase 3.5: Polish
- [ ] T045 [P] Unit tests for Menu model validation in backend/tests/unit/Menu.test.js
- [ ] T046 [P] Unit tests for scraping logic in backend/tests/unit/ScrapingService.test.js
- [ ] T047 [P] Unit tests for random selection algorithm in backend/tests/unit/RandomSelectionService.test.js
- [ ] T048 Performance optimization for scraping timeout in backend/src/services/ScrapingService.js
- [ ] T049 Frontend error boundary in frontend/src/components/ErrorBoundary.jsx
- [ ] T050 [P] Add PropTypes validation to React components
- [ ] T051 Code cleanup and remove duplication across services
- [ ] T052 **Manual Testing Execution** - Run through manual-testing.md checklist manually

## Dependencies
- Project setup (T001-T007) before all tests and implementation
- All tests (T008-T019) before any implementation (T020-T051)
- Backend models (T020-T022) before services (T023-T025)
- Services (T023-T025) before API endpoints (T026-T031)
- API endpoints complete before frontend integration (T037-T039)
- Core functionality before integration (T040-T044)
- Everything before polish phase (T045-T052)

## Parallel Execution Examples

### Batch 1: Contract Tests (after setup complete)
```
Task: "Contract test GET /api/menus in backend/tests/contract/test_menus_get.test.js"
Task: "Contract test GET /api/menus/random in backend/tests/contract/test_menus_random.test.js" 
Task: "Contract test GET /api/health in backend/tests/contract/test_health.test.js"
```

### Batch 2: Integration Tests
```
Task: "Integration test menu loading scenario in backend/tests/integration/test_menu_loading.test.js"
Task: "Integration test random selection scenario in backend/tests/integration/test_random_selection.test.js"
Task: "Integration test error handling scenarios in backend/tests/integration/test_error_handling.test.js"
```

### Batch 3: Frontend Component Tests  
```
Task: "Component test MenuList display in frontend/src/components/__tests__/MenuList.test.js"
Task: "Component test MenuCard rendering in frontend/src/components/__tests__/MenuCard.test.js"
Task: "Component test RandomButton interaction in frontend/src/components/__tests__/RandomButton.test.js"
Task: "Component test LoadingSpinner states in frontend/src/components/__tests__/LoadingSpinner.test.js"
Task: "Component test ErrorMessage display in frontend/src/components/__tests__/ErrorMessage.test.js"
```

### Batch 4: Backend Models (after tests fail)
```
Task: "Menu model with validation in backend/src/models/Menu.js"
Task: "MenuItem model with validation in backend/src/models/MenuItem.js"
Task: "ScrapingResult model in backend/src/models/ScrapingResult.js"
```

### Batch 5: Backend Services
```
Task: "ScrapingService with Cheerio integration in backend/src/services/ScrapingService.js"
Task: "MenuService for data processing in backend/src/services/MenuService.js"
Task: "RandomSelectionService in backend/src/services/RandomSelectionService.js"
```

### Batch 6: Frontend Components
```
Task: "MenuList component in frontend/src/components/MenuList.jsx"
Task: "MenuCard component in frontend/src/components/MenuCard.jsx"
Task: "RandomButton component in frontend/src/components/RandomButton.jsx"
Task: "LoadingSpinner component in frontend/src/components/LoadingSpinner.jsx"
Task: "ErrorMessage component in frontend/src/components/ErrorMessage.jsx"
```

### Batch 7: Unit Tests (polish phase)
```
Task: "Unit tests for Menu model validation in backend/tests/unit/Menu.test.js"
Task: "Unit tests for scraping logic in backend/tests/unit/ScrapingService.test.js"
Task: "Unit tests for random selection algorithm in backend/tests/unit/RandomSelectionService.test.js"
```

## Manual Testing Protocol

**When to Execute Manual Testing**:
- After T052 (Manual Testing Execution task)
- Before considering implementation complete
- When all automated tests pass

**Manual Testing Steps**:
1. Start both backend and frontend servers
2. Open browser to frontend application
3. Follow each scenario in manual-testing.md checklist
4. Verify all functional requirements (FR-001 through FR-009)
5. Test performance goals (<3s loading, <1s selection)
6. Verify error handling with network simulation
7. Check browser compatibility across Chrome, Firefox, Safari, Edge
8. Document any issues found and create fix tasks if needed

## TDD Critical Path

**Phase 1**: Setup (T001-T007) → Must complete before any tests
**Phase 2**: Write ALL tests (T008-T019) → Must fail before implementation
**Phase 3**: Implement to make tests pass (T020-T051)
**Phase 4**: Manual validation (T052)

## Notes
- [P] tasks = different files, no dependencies, can run simultaneously
- Verify ALL tests fail before implementing ANY functionality
- Each contract must have corresponding implementation
- Manual testing is essential for user experience validation
- Commit after each task completion
- Run `npm test` after each implementation task to verify tests pass

## Task Generation Rules Applied

1. **From Contracts**: 
   - /api/menus → T008 contract test + T027 implementation
   - /api/menus/random → T009 contract test + T028 implementation  
   - /api/health → T010 contract test + T029 implementation

2. **From Data Model**:
   - Menu entity → T020 model + T045 unit test
   - MenuItem entity → T021 model
   - ScrapingResult entity → T022 model + T046 unit test

3. **From User Stories (quickstart scenarios)**:
   - Initial Menu Loading → T011 integration test
   - Random Menu Selection → T012 integration test
   - Error Handling → T013 integration test

4. **TDD Ordering Enforced**:
   - All tests (T008-T019) before implementation (T020-T051)
   - Models before services before endpoints
   - Core before integration before polish

## Validation Checklist

- [x] All contracts have corresponding tests (T008-T010)
- [x] All entities have model tasks (T020-T022)  
- [x] All tests come before implementation
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Manual testing included as final validation step
