# Changelog

## [0.4.0] - 2025-11-12

### Added ✨
- **Dynamic webhook fetching for load tests** - Automatically queries D1 database for admin user's first webhook
- `scripts/get-admin-webhook.js` - Node.js script to fetch admin webhook UUID from database
- Multi-tiered fallback strategy for webhook resolution:
  - Primary: Database query (production or local)
  - Fallback 1: `.webhook-uuid` file (gitignored)
  - Fallback 2: `WEBHOOK_UUID` environment variable
  - Fallback 3: `WEBHOOK_URL` environment variable
- Local vs production testing support via `USE_LOCAL_DB` environment variable
- Load testing documentation in README with prerequisites and test profile details

### Changed 🔄
- Load test scripts now default to production webhook testing
- Updated `npm run load-test:*` scripts to use dynamic webhook fetching
- Added `npm run load-test:local` and `npm run load-test:local:light` for local testing
- Enhanced `scripts/run-load-test.sh` with intelligent webhook resolution and error messaging

### Security 🔒
- **Removed hardcoded production webhook UUIDs** from all scripts and package.json
- Added `.webhook-uuid` to `.gitignore` (stores local production webhook UUID)
- Added `load-test-results/` to `.gitignore` (contains test data with webhook URLs)
- All webhook UUIDs now resolved dynamically at runtime

### Fixed 🐛
- Shell escaping issues in database queries (switched to temp file approach)
- Database query timeout handling (5-second timeout in bash, 10-second in Node.js)
- JSON parsing for wrangler D1 execute output
- Connection handling for local vs production database selection

---

## [0.3.0] - 2025-11-10

### Added ✨
- Integrated impersonation indicator into header (next to user gravatar and email)
- Dynamic header button: "Sign Out" becomes "Return to Admin" when impersonating
- Visual "Impersonating" label in amber color above user email
- Mobile-responsive impersonation UI in dropdown menu
- **Mobile-optimized admin panel** with card-based user list
- 2x2 stats grid layout for compact mobile display (Webhooks, Requests, Storage, Verified)
- Full-width impersonate button on mobile matching webhook card design

### Changed 🔄
- Removed separate impersonation banner component
- Simplified and compacted impersonation UX
- Improved header layout with better visual hierarchy
- **Renamed environment files** to standard convention:
  - `.dev.vars` → `.env.local` (local development)
  - `.dev.vars.production` → `.env` (production)
  - `.dev.vars.example` → `.env.example` (template)
- Updated all scripts and documentation references
- Center-aligned admin table columns (Role, Verified, Webhooks, Requests, Storage, Joined, Actions)
- Dual-view admin panel: table for desktop, cards for mobile

### Fixed 🐛
- Fixed stop-impersonation endpoint 500 error (missing JSON body)
- Fixed client-side stop-impersonation handler
- Fixed table header alignment to respect column className settings

---

## [0.2.0] - 2025-11-10

### Added ✨
- **Admin impersonation system** using Better Auth admin plugin
- Admin panel showing all users with statistics (webhooks, data count, storage used)
- Impersonate user functionality with session tracking
- Stop impersonation to return to admin session
- Database migration for `impersonated_by` field in session table
- Automatic migration application on initial setup (`npm run setup`)
- Database setup script for new repository users

### Changed 🔄
- Authentication middleware now detects impersonation state via `session.impersonatedBy`
- Added `isImpersonating` flag to Hono Variables type
- Admin role detection and auto-update based on `ADMIN_EMAIL` environment variable

### Technical 🔧
- Created `/scripts/setup-database.js` for automated migration application
- Updated deployment script to apply migrations to production
- Better Auth CLI integration for schema generation
- Modal system for impersonation confirmation dialogs

---

## [0.1.0] - 2025-11-09

### What Works ✅

#### Core Functionality
- **Webhook ingestion** - Rust worker receives webhooks at `/w/{uuid}` (GET/POST/PUT/PATCH)
- **Data storage** - Stores method, headers, body/query params in D1 database
- **Admin panel** - View, manage, and monitor received webhooks
- **Authentication** - Google OAuth + Email/Password with Better Auth
- **Webhook management** - Create, edit, delete webhooks with names and tags
- **Data viewing** - Paginated list (50 items), sort by date, filter by method/headers
- **Sharing** - Share webhooks with other users
- **Code examples** - Show curl, JS, PHP, Python, Node.js examples with copy buttons

#### Technical Implementation
- Two-worker architecture (Rust for ingestion, TypeScript for admin)
- Shared D1 database between workers
- Server-side rendering with Hono + React 19
- Dark theme UI with Tailwind CSS v4
- Type-safe queries with Drizzle ORM
- Client-side navigation and modals
- Email verification via Resend
- Session management with Better Auth

#### Developer Tools
- One-command setup: `npm run setup`
- One-command dev: `npm run dev`
- One-command deploy: `npm run deploy`
- Database seeding and reset scripts
- TypeScript strict mode + ESLint
- Shared database persistence for local dev

### What's Not Done ❌

- Production deployment and testing
- Database cleanup (old data removal)
- Webhook requests data representation needs strong UI improvement

---

That's it. The app works. Just needs deployment.
