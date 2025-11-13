<div align="center">

<img src="admin/public/favicon.svg" alt="Webhook System Logo" width="120" height="120">

# Webhook System

**High-performance webhook ingestion and management system**

Built with Rust + TypeScript • Deployed on Cloudflare Workers ⚡

[![Deployed on Cloudflare Workers](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.dev)

</div>

---

## 🏗️ Architecture

- **⚡ Webhook Worker** (Rust): High-performance ingestion (1k+ RPS)
- **🎨 Admin Worker** (TypeScript/Hono): Management UI with React 19

## 🛠️ Tech Stack

**Backend:** Rust (worker-rs) • Hono • TypeScript 5 • Drizzle ORM

**Frontend:** React 19 • Tailwind CSS v4 • shadcn/ui

**Authentication:** Better Auth • Google OAuth • Email/Password

**Database:** Cloudflare D1 (SQLite) • Cloudflare Queues

**Deployment:** Cloudflare Workers

---

## 🚀 Quick Start

### 📋 Prerequisites

- 🟢 Node.js 20+
- 🦀 Rust (for webhook worker)
- 🔧 Wrangler CLI (`npm install -g wrangler`)
- ☁️ Cloudflare account

### ⚡ One-Command Setup

```bash
git clone <repository-url>
cd test-webhook
npm run setup
```

This will:
- ✅ Install admin worker dependencies
- ✅ Build webhook worker (Rust)
- ✅ Set up the development environment

### 💻 One-Command Local Development

```bash
npm run dev
```

This starts both workers with:
- 🎨 **Admin Worker**: http://localhost:5173
- ⚡ **Webhook Worker**: http://localhost:5174
- 💾 **Shared D1 Database**: `.wrangler-shared/`

The script automatically:
- 🔍 Checks and kills any processes on ports 5173 and 5174
- 🚀 Starts both workers with shared database persistence
- 📊 Shows logs from both services with `[ADMIN]` and `[WEBHOOK]` prefixes

Press `Ctrl+C` to stop both services.

### 🚀 One-Command Deployment

```bash
npm run deploy
```

This will:
1. ✅ Run type checking
2. ✅ Run linting
3. ✅ Build CSS and client bundle
4. ☁️ Deploy admin worker
5. ☁️ Deploy webhook worker

All with a single command!

---

### ⚙️ Initial Configuration

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
   wrangler secret put ADMIN_EMAIL
   ```

   Alternatively, use automated secrets upload from `.env`:
   ```bash
   npm run secrets:upload
   ```

---

### 🔧 Additional Commands

**💾 Database management**:
```bash
npm run db:migrate   # Apply schema migrations
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed with test data
npm run db:generate  # Generate new migration
```

**🔍 Development**:
```bash
npm run type-check   # TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
```

**☁️ Individual deployments**:
```bash
npm run deploy:admin    # Deploy admin worker only
npm run deploy:webhook  # Deploy webhook worker only
```

**📊 Load testing**:
```bash
npm run load-test              # Medium profile (1K RPS)
npm run load-test:light        # Light profile (100 RPS)
npm run load-test:heavy        # Heavy profile (5K RPS)
npm run load-test:extreme      # Extreme profile (10K RPS)
npm run load-test:stress       # Stress test (find breaking point)

# Local development testing
npm run load-test:local        # Test local webhook worker
npm run load-test:local:light  # Light load against local
```

**📊 Load Testing Details**:

The load testing system uses [k6](https://k6.io/) with automatic webhook discovery:

1. **🔍 Dynamic Webhook Fetching**: Automatically queries D1 database to get the admin user's first webhook
2. **🔄 Fallback Strategies**:
   - 🥇 Primary: Query production database for admin user's webhook
   - 🥈 Fallback 1: Read from `.webhook-uuid` file (gitignored)
   - 🥉 Fallback 2: Use `WEBHOOK_UUID` environment variable
   - 🏁 Fallback 3: Use `WEBHOOK_URL` environment variable

3. **⚡ Test Profiles**:
   - **Light**: 100 RPS for 60 seconds (6K requests)
   - **Medium**: 1K RPS for 60 seconds (60K requests)
   - **Heavy**: 5K RPS for 60 seconds (300K requests)
   - **Extreme**: 10K RPS for 60 seconds (600K requests)
   - **Stress**: Progressive ramp-up to find breaking point (24 minutes)

4. **💾 Results**: Saved to `load-test-results/` directory (gitignored)

**📋 Prerequisites for load testing**:
- ⚙️ Install k6: `brew install k6` (macOS) or [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation/)
- 📧 Set `ADMIN_EMAIL` in `admin/.env` to match your admin user
- 💾 Ensure database is migrated: `npm run db:migrate`
- 🪝 Create at least one webhook in the admin panel

---

### 🔧 Troubleshooting

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

---

## ✨ Features

### 🔐 Authentication
- ✅ Google OAuth integration
- ✅ Email/Password authentication
- ✅ Account merging by email
- ✅ Email verification

### 🪝 Webhook Management
- ✅ Multiple webhooks per user
- ✅ Custom webhook names and tags
- ✅ GET/POST/PUT/PATCH methods
- ✅ Store HTTP method, headers, and data
- ✅ Webhook sharing and collaboration
- ✅ Code examples (curl, JS, PHP, Python, Node.js)

### 📊 Data Management
- ✅ Real-time data viewer
- ✅ Sort and filter by date, method, headers
- ✅ Data retention (1 day or 10MB per user)
- ✅ Scheduled cleanup jobs (see [Log Retention Guide](LOG_RETENTION.md))

### 👥 Admin Features
- ✅ User statistics dashboard
- ✅ Admin impersonation for support
- ✅ User management

### 📈 Performance Testing
- ✅ k6 load testing integration
- ✅ Multiple test profiles (Light, Medium, Heavy, Extreme, Stress)
- ✅ Dynamic webhook discovery
- ✅ Automated result reporting

---

## 📁 Project Structure

```
/
├── ⚡ webhook-worker/     # Rust webhook ingestion worker
├── 🎨 admin/              # TypeScript admin panel worker
│   ├── src/
│   │   ├── handlers/      # Route handlers
│   │   ├── components/    # React components (shadcn/ui)
│   │   ├── client/        # Client-side code
│   │   └── middleware/    # Auth & session middleware
├── 🔗 shared/             # Shared schemas and types
├── 📊 scripts/            # Load testing & deployment scripts
└── 💾 migrations/         # D1 database migrations
```

---

## 🙏 Acknowledgments

This project is built with amazing open-source technologies:

### ⚡ Core Technologies
- [Hono](https://hono.dev/) - Ultrafast web framework for Cloudflare Workers
- [Rust](https://www.rust-lang.org/) & [worker-rs](https://github.com/cloudflare/workers-rs) - High-performance webhook ingestion
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [Cloudflare D1](https://developers.cloudflare.com/d1/) - SQLite at the edge
- [React 19](https://react.dev/) - UI library

### 🛠️ Development Tools
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database queries
- [Better Auth](https://www.better-auth.com/) - Authentication system
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare Workers CLI
- [esbuild](https://esbuild.github.io/) - Fast JavaScript bundler
- [k6](https://k6.io/) - Load testing tool

### 🎨 UI & Styling
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable UI components
- [Tabler Icons](https://tabler.io/icons) - Beautiful open-source icons
- [highlight.js](https://highlightjs.org/) - Syntax highlighting

### 📧 Services
- [Resend](https://resend.com/) - Email delivery
- [React Email](https://react.email/) - Email templates

Thank you to all maintainers and contributors of these projects! 🙏

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with 💙💛 using Hono, Rust and Cloudflare Workers**
