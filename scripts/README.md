# Deployment Scripts

This directory contains automation scripts for development and deployment workflows following the Cloudflare project standards.

## Core Scripts

### `deploy.js`

**Purpose**: Complete deployment pipeline to Cloudflare with automatic resource creation.

**Usage**:
```bash
npm run deploy               # Deploy everything
npm run deploy admin         # Deploy admin worker only
npm run deploy webhook       # Deploy webhook worker only
npm run deploy --skip-migrations  # Skip database migrations
```

**Deployment Steps**:
1. **Step 0**: Update wrangler to latest version
2. **Step 1**: Load environment variables from `.env`
3. **Step 2**: Check/create D1 database
4. **Step 3**: Create KV namespaces (SESSIONS, WEBHOOK_CACHE)
5. **Step 4**: Generate `wrangler.toml` from templates
6. **Step 5**: Upload secrets to Cloudflare
7. **Step 6**: Run database migrations
8. **Step 7**: Build workers (type-check, lint, CSS, client)
9. **Step 8**: Deploy workers

**Features**:
- Automatically creates D1 database if it doesn't exist
- Automatically creates KV namespaces if they don't exist
- Generates `wrangler.toml` from `.template` files with correct IDs
- Uploads all secrets from `.env` to Cloudflare
- Applies all pending migrations to production database
- Runs full quality checks before deployment

### `dev.js`

**Purpose**: Start both admin and webhook workers in local development mode.

**Usage**:
```bash
npm run dev           # Local development with local D1
npm run dev:remote    # Local development with remote D1
```

**Startup Steps**:
1. **Step 0**: Update wrangler to latest version
2. **Step 1**: Load environment variables from `.env.local`
3. **Step 2**: Generate `wrangler.toml` from templates (for dev)
4. **Step 3**: Generate `.dev.vars` file with secrets
5. **Step 4**: Kill existing processes on ports
6. **Step 5**: Setup database / Apply migrations
7. **Step 6**: Start admin worker (port 5173)
8. **Step 7**: Start webhook worker (port 5174)

**Features**:
- Automatically kills processes on ports 5173 and 5174
- Admin worker: http://localhost:5173
- Webhook worker: http://localhost:5174
- Shared D1 database in `.wrangler-shared/`
- Hot reload for both workers

## Configuration Files

### Environment Variables

Located in **root directory** (not admin/):

| File | Purpose |
|------|---------|
| `.env` | Production secrets (used by `npm run deploy`) |
| `.env.local` | Development secrets (used by `npm run dev`) |
| `.env.example` | Template file (committed to git) |

### Wrangler Configuration

| File | Purpose |
|------|---------|
| `admin/wrangler.toml.template` | Template for admin worker config |
| `webhook-worker/wrangler.toml.template` | Template for webhook worker config |
| `admin/wrangler.toml` | **Generated** - do not edit directly |
| `webhook-worker/wrangler.toml` | **Generated** - do not edit directly |

**Template Placeholders**:
- `{{DATABASE_ID}}`: D1 database UUID
- `{{SESSIONS_KV_ID}}`: Sessions KV namespace ID
- `{{WEBHOOK_CACHE_KV_ID}}`: Webhook cache KV namespace ID
- `{{ENVIRONMENT}}`: "development" or "production"

## Utility Scripts

### `load-test.js`

Load testing framework for webhook ingestion.

```bash
npm run load-test         # Medium load (1K RPS)
npm run load-test:light   # Light load (100 RPS)
npm run load-test:heavy   # Heavy load (5K RPS)
npm run load-test:extreme # Extreme load (10K RPS)
npm run load-test:stress  # Stress test - find breaking point
```

See `LOAD_TESTING.md` for detailed documentation.

### `get-admin-webhook.js`

Utility to get webhook URL for testing.

## Script Development

All scripts are written in ES modules (Node.js 18+) and follow these patterns:

### Logging Pattern

```javascript
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`, 'cyan')
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green')
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow')
}

function logError(message) {
  log(`  ✗ ${message}`, 'red')
}
```

### Directory Validation

```javascript
try {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
  if (pkg.name !== 'test-webhook') {
    throw new Error('Wrong directory')
  }
} catch {
  console.error('This script must be run from the project root directory.')
  process.exit(1)
}
```

## Troubleshooting

### Port Already in Use

If `npm run dev` fails with port conflicts:
```bash
# The script automatically kills processes on ports 5173 and 5174
# But if it still fails, manually kill:
lsof -ti:5173 | xargs kill -9
lsof -ti:5174 | xargs kill -9
```

### Deployment Failures

1. Check type errors: `npm run type-check`
2. Check lint errors: `npm run lint`
3. Ensure wrangler is authenticated: `wrangler whoami`
4. Check `.env` file exists with valid secrets

### Migration Failures

If migrations fail during deployment:
```bash
npm run deploy --skip-migrations  # Skip migrations
npm run db:migrate:prod          # Apply migrations manually
```

## Adding New Scripts

When adding new scripts:

1. Use ES module syntax (`import`/`export`)
2. Add shebang: `#!/usr/bin/env node`
3. Follow the standard logging pattern
4. Include Step 0: Update wrangler (if using wrangler)
5. Add to `package.json` scripts
6. Document in this README
