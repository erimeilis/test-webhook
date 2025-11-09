# Changelog

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
