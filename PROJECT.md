# Project: LinkStash Dashboard Redesign

## Architecture
LinkStash is a Telegram bot & web dashboard application for capturing, categorizing, and organizing links.
The backend is an Express server in TypeScript with SQLite storage, serving REST API endpoints at `/api/*` and static SPA files from `public/`.

### Frontend Redesign Architecture
- **Framework**: React 19 with Vite compiler
- **Styling**: Tailwind CSS with custom glassmorphism utilities, dark mode palette (deep slate/zinc backgrounds `#0b0f19`, frosted glass card overlays, neon glowing accents `#3b82f6`, `#8b5cf6`, `#10b981`).
- **Animations & Micro-interactions**: Framer Motion (`framer-motion` / `motion`), Animate UI / React Bits inspired UI patterns (staggered list entry, smooth layout transitions, fluid modal spring physics, glowing hover cards, interactive status toggles).
- **Icons**: Lucide React icons (`lucide-react`).
- **Build Output**: Compiled Vite build targets `public/` directory so Express `app.use(express.static('public'))` automatically serves the modernized SPA.

## Interface Contracts

### Backend API Endpoints (`/api`)
- `GET /api/links`: Accepts query parameters `category`, `status` (`pending` | `reviewed`), `platform`, `search`, `page`, `limit`. Returns `{ links: Link[], total: number, page: number, totalPages: number }`.
- `POST /api/links`: Body `{ url: string, category?: string }`. Returns created `Link`.
- `PATCH /api/links/:id`: Body `{ category?: string, status?: string, notes?: string, title?: string, url?: string }`. Returns updated `Link`.
- `DELETE /api/links/:id`: Returns `{ success: boolean }`.
- `GET /api/categories`: Returns list of categories `Category[]` (`id`, `name`, `icon`, `keywords`).
- `PUT /api/categories/:id/keywords`: Body `{ keywords: string[] }`. Accepts category ID. Returns `{ success: boolean }`.
- `GET /api/stats`: Returns `{ totalLinks: number, unreadCount: number, readCount: number, archivedCount: number, categoryCounts: Record<string, number> }`.

## Code Layout
```
LinkStash/
├── src/
│   ├── api/             # Express API router & server
│   ├── bot/             # Telegram bot logic
│   ├── db/              # SQLite database queries & schemas
│   ├── services/        # AI metadata extraction & categorizer
│   └── frontend/        # React + Vite source code
│       ├── components/  # Glassmorphic UI components (Navbar, Sidebar, LinkCard, AddLinkModal, StatsOverview, CategoryManager, Filters)
│       ├── hooks/       # React state & data fetching hooks
│       ├── services/    # API client methods
│       ├── styles/      # Tailwind & custom CSS / glassmorphism
│       ├── App.tsx      # Main dashboard application shell
│       └── main.tsx     # Vite entry point
├── public/              # Production static build output (index.html, assets/)
├── tests/               # E2E Test Suite (Tier 1 to 4)
└── package.json
```

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Test Suite Creation | Opaque-box E2E tests for features, boundary conditions, combinations, real-world workloads | None | DONE |
| M1 | Frontend Infrastructure & React/Vite Setup | Vite + React + Tailwind + Motion dependencies setup in `src/frontend`, API client service, basic app scaffold building to `public/` | None | DONE |
| M2 | Core Glassmorphic Layout & Navbar | Responsive dark glassmorphism layout, sidebar/topbar navigation, stats banner cards with skeleton loaders | M1 | DONE |
| M3 | Link Feed, Filtering & Category Management | Glass link cards with favicon/preview, filter bar (category, status, search), modal for adding links, category keyword manager modal | M2 | IN_PROGRESS |
| M4 | Motion, React Bits UI Polish & Mobile Responsiveness | Smooth entry animations, spring layout transitions, responsive drawer/hamburger navigation, micro-interactions, dark mode glows | M3 | PLANNED |
| M5 | E2E Test Integration & Hardening | Pass 100% of E2E Test Suite (Tiers 1-4) & Adversarial Coverage Hardening (Tier 5) | E2E, M4 | PLANNED |
