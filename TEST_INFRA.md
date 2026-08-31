# Test Infrastructure & Strategy Documentation

## Architecture & Overview
The LinkStash E2E Test Suite is an opaque-box, HTTP-level testing framework designed to validate all backend API endpoints, domain services, auto-categorization rules, and state management flows without breaking encapsulation.

Tests interact directly with the Express API server via standard HTTP requests (`fetch`) over a dynamic loopback connection, ensuring 100% realistic end-to-end behavior matching production environments.

## Test Environment & Isolation Strategy
- **Isolated SQLite Test Database**: All tests execute against a dedicated database file at `data/test_linkstash.db` configured via `process.env.DB_PATH`.
- **Dynamic Port Allocation**: The test server binds to dynamic port `0`, automatically assigning an open loopback port for each run, eliminating port collisions (`EADDRINUSE`).
- **Clean State Teardown & Re-seeding**: Between test suites and test runs, `resetTestDatabase()` flushes links and category tables and re-seeds default domain categories ('Diseño Web', 'Impresión 3D', 'Cursos', 'Herramientas', 'Programación', 'Entretenimiento', 'Otros').

## Directory Structure
```
LinkStash/
└── tests/
    ├── helpers/
    │   └── test-server.ts         # Server lifecycle, dynamic port binding, isolated DB management, HTTP fetch wrapper
    ├── tier1-feature-coverage.test.ts  # Tier 1: Core endpoint feature coverage (>=5 test cases per feature)
    ├── tier2-boundary-corner.test.ts   # Tier 2: Edge cases, boundary conditions, invalid IDs, special chars, zero states
    ├── tier3-cross-feature.test.ts     # Tier 3: Multi-endpoint integrations, state propagation, auto-categorization learning
    ├── tier4-scenarios.test.ts         # Tier 4: End-to-end real-world user workflows & bulk ingestion pagination
    └── run-tests.ts               # Master test suite runner & CLI report generator
```

## How to Execute Tests
Run the entire E2E test suite using the standard npm command:
```bash
npm test
```
Or directly via `tsx`:
```bash
npx tsx tests/run-tests.ts
```

## Coverage Tiers Summary
1. **Tier 1: Feature Coverage (37 Test Cases)**
   - `GET /api/links`: Default fetching, category filter, status filter, platform filter, search query, pagination (`page`, `limit`, `totalPages`).
   - `POST /api/links`: Valid creation, custom category override, missing URL 400 validation, platform detection, domain-based auto-categorization, duplicate URL handling.
   - `PATCH /api/links/:id`: Status update to 'reviewed' with `reviewed_at`, category update, notes update, title & URL update, non-existent ID 404, empty body handling.
   - `DELETE /api/links/:id`: Deleting existing link, 404 for missing link, list removal verification, stats update verification, re-delete 404, non-numeric ID handling.
   - `GET /api/categories`: Status 200 response, schema validation, default categories presence, parsed JSON keywords array, application/json header.
   - `PUT /api/categories/:id/keywords`: Keyword update, 404 for missing category, 400 for non-array body, deduplication & trim normalization, database persistence check.
   - `GET /api/stats`: Response schema validation, sum consistency (`total = pending + reviewed`), category breakdown, platform breakdown, dynamic stat updates on patch/post, clean DB zero counts.

2. **Tier 2: Boundary & Corner Cases (9 Test Cases)**
   - Empty lists on zero-match search/filters.
   - Long search query string parameters (500+ characters).
   - Missing required body fields (POST with empty object or empty string URL).
   - Invalid IDs (negative, non-numeric, integer overflow) across PATCH, DELETE, and PUT endpoints.
   - Zero counts on clean database state.
   - Special characters, SQL injection security checks (`' OR '1'='1`), HTML script tags XSS checks (`<script>`), and Unicode emojis (`🚀🔥`).
   - Pagination out of bounds (high page numbers).

3. **Tier 3: Cross-Feature Combinations (5 Test Cases)**
   - Create links across categories/statuses -> filter `GET /api/links` with category and status combinations.
   - Update category keywords (`PUT /api/categories/:id/keywords`) -> verify auto-categorizer categorizes new link based on updated keyword.
   - Create pending link -> check initial stats -> PATCH status to 'reviewed' -> verify stats pending decrements and reviewed increments.
   - Create link -> delete link -> verify item removed from search list and stats total count decremented.
   - PATCH link category -> verify domain learning system automatically extracts keywords from title into target category.

4. **Tier 4: Real-World Scenarios (2 Workflow Test Cases)**
   - **Scenario 1**: Full bookmark lifecycle (Ingest multi-platform bookmarks -> View stats -> Search & Filter -> Read & Mark reviewed with notes -> Delete processed link -> Verify final stats).
   - **Scenario 2**: Bulk link ingestion & pagination workflow (Ingest 25 links -> Validate total counts -> Page through multi-page feed -> Bulk review items -> Verify updated status breakdown).
