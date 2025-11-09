<div align="center">

<img src="admin/public/favicon.svg" alt="Webhook System Logo" width="120" height="120">

# Webhook System

High-performance webhook ingestion and management system built with Cloudflare Workers.

</div>

## Architecture

- **Webhook Worker** (Rust): High-performance ingestion (1k+ RPS)
- **Admin Worker** (TypeScript/Hono): Management UI with React

## Tech Stack

- **Rust** (worker-rs) for webhook ingestion
- **TypeScript** + **Hono** + **React 19** for admin panel
- **Drizzle ORM** for D1 database
- **Better Auth** for authentication (Google OAuth + Email/Password)
- **Tailwind CSS v4** + **shadcn/ui** for dark theme UI
- **Cloudflare D1** (SQLite) for database
- **Cloudflare Queues** for background jobs

## Quick Start

### Prerequisites

- Node.js 20+
- Rust (for webhook worker)
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### One-Command Setup

```bash
git clone <repository-url>
cd test-webhook
npm run setup
```

This will:
- Install admin worker dependencies
- Build webhook worker (Rust)
- Set up the development environment

### One-Command Local Development

```bash
npm run dev
```

This starts both workers with:
- **Admin Worker**: http://localhost:5173
- **Webhook Worker**: http://localhost:5174
- **Shared D1 Database**: `.wrangler-shared/`

The script automatically:
- Checks and kills any processes on ports 5173 and 5174
- Starts both workers with shared database persistence
- Shows logs from both services with `[ADMIN]` and `[WEBHOOK]` prefixes

Press `Ctrl+C` to stop both services.

### One-Command Deployment

```bash
npm run deploy
```

This will:
1. Run type checking
2. Run linting
3. Build CSS and client bundle
4. Deploy admin worker
5. Deploy webhook worker

All with a single command!

### Initial Configuration

Before first deployment, set up Cloudflare resources:

1. **Create D1 database**:
   ```bash
   wrangler d1 create webhook-db
   ```
   Copy the database ID to `wrangler.toml` files.

2. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

3. **Create KV namespace** (for sessions):
   ```bash
   wrangler kv:namespace create SESSIONS
   ```
   Copy the namespace ID to `admin/wrangler.toml`.

4. **Set secrets**:
   ```bash
   cd admin
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   wrangler secret put RESEND_API_KEY
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put FROM_EMAIL
   ```

### Additional Commands

**Database management**:
```bash
npm run db:migrate   # Apply schema migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed with test data
npm run db:generate  # Generate new migration
```

**Development**:
```bash
npm run type-check   # TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
```

**Individual deployments**:
```bash
npm run deploy:admin    # Deploy admin worker only
npm run deploy:webhook  # Deploy webhook worker only
```

### Troubleshooting

**Port conflicts**:
```bash
# Ports are automatically cleared by npm run dev, but if needed manually:
lsof -ti:5173 | xargs kill -9  # Admin worker
lsof -ti:5174 | xargs kill -9  # Webhook worker
```

**Database issues**:
```bash
cd admin
npm run db:reset     # Clear all data and reset schema
npm run db:migrate   # Reapply migrations
```

## Features

- ✅ User authentication (Google OAuth + Email/Password)
- ✅ Account merging by email
- ✅ Multiple webhooks per user
- ✅ Webhook names and tags for organization
- ✅ GET/POST webhook ingestion
- ✅ Store HTTP method, headers, and data
- ✅ Data viewer with sort/filter by date, method, headers
- ✅ Webhook sharing and collaboration
- ✅ Code examples (curl, JS, PHP, Python, Node.js)
- ✅ Data retention (1 month or 10MB per user)
- ✅ Scheduled cleanup jobs

## Project Structure

```
/
├── webhook-worker/     # Rust webhook ingestion worker
├── admin/              # TypeScript admin panel worker
├── shared/             # Shared schemas and types
└── migrations/         # D1 database migrations
```

## Acknowledgments

This project is built with amazing open-source technologies:

### Core Technologies
- [Hono](https://hono.dev/) - Ultrafast web framework for Cloudflare Workers
- [Rust](https://www.rust-lang.org/) & [worker-rs](https://github.com/cloudflare/workers-rs) - High-performance webhook ingestion
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - SQLite at the edge
- [React 19](https://react.dev/) - UI library

### Development Tools
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database queries
- [Better Auth](https://www.better-auth.com/) - Authentication system
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers CLI
- [esbuild](https://esbuild.github.io/) - Fast JavaScript bundler

### UI & Styling
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable UI components
- [Tabler Icons](https://tabler.io/icons) - Beautiful open-source icons
- [highlight.js](https://highlightjs.org/) - Syntax highlighting

### Services
- [Resend](https://resend.com/) - Email delivery
- [React Email](https://react.email/) - Email templates

Thank you to all maintainers and contributors of these projects! 🙏

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with 💙💛 using Hono, Rust and Cloudflare Workers**
