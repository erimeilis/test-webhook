# Deployment Scripts

This directory contains automation scripts for development and deployment workflows.

## Available Scripts

### `dev-fullstack.js`

**Purpose**: Start both admin and webhook workers in local development mode with a shared database.

**Usage**:
```bash
npm run dev
```

**Features**:
- Automatically kills any processes on ports 5173 and 5174
- Starts admin worker on http://localhost:5173
- Starts webhook worker on http://localhost:5174
- Uses shared D1 database in `.wrangler-shared/` for persistence

### `deploy-fullstack.js`

**Purpose**: Deploy both workers to Cloudflare with comprehensive pre-deployment checks.

**Usage**:
```bash
npm run deploy
```

**Deployment Steps**:
1. ✅ Type checking (`npm run type-check`)
2. ✅ Linting (`npm run lint`)
3. ✅ CSS build (`npm run build:css`)
4. ✅ Client bundle build (`npm run build:client`)
5. 🗄️  KV namespace setup (`npm run kv:setup`)
6. 🔐 Secret upload from `.env` (`npm run secrets:upload`)
7. 🚀 Deploy admin worker
8. 🚀 Deploy webhook worker

**Exit Codes**:
- `0`: Successful deployment
- `1`: Deployment failed (type errors, lint errors, build failure, etc.)

### `setup-kv.js`

**Purpose**: Create and configure KV namespace for Better Auth sessions.

**Usage**:
```bash
npm run kv:setup
```

**Features**:
- Checks if KV namespace already exists
- Creates `SESSIONS` KV namespace if needed
- Automatically updates `wrangler.toml` with namespace ID
- Idempotent (safe to run multiple times)

**How It Works**:
1. Reads current `wrangler.toml` configuration
2. Checks if KV namespace is configured
3. Creates namespace using `wrangler kv:namespace create SESSIONS`
4. Extracts namespace ID from wrangler output
5. Updates `wrangler.toml` with the correct ID

**Output**:
```
🗄️  Setting up KV Namespace for Sessions...
📝 KV namespace not configured, creating...
   Creating SESSIONS namespace...
   ✅ Created KV namespace: abc123def456...
📝 Updating wrangler.toml...
   ✅ wrangler.toml updated with namespace ID
✅ KV namespace setup complete!
```

### `upload-secrets.js`

**Purpose**: Upload secrets from `admin/.env` to Cloudflare Workers.

**Usage**:
```bash
npm run secrets:upload
```

**Features**:
- Reads secrets from `admin/.env` (production) or `admin/.env.local` (development)
- Parses environment variables in `KEY=VALUE` format
- Uploads each secret using `wrangler secret put`
- Skips comments and empty lines
- Provides detailed progress feedback

**`.env` File Format**:
```env
# Comments start with #
BASE_URL=https://your-worker.your-subdomain.workers.dev
GOOGLE_CLIENT_ID=your-value
GOOGLE_CLIENT_SECRET=your-value
RESEND_API_KEY=your-value
FROM_EMAIL=your@email.com
BETTER_AUTH_SECRET=your-secret
```

**Error Handling**:
- Checks if `.env` or `.env.local` exists before processing
- Validates correct directory execution
- Provides clear error messages for failures

**Security Notes**:
- `.env` and `.env.local` are gitignored and should never be committed
- Secrets are uploaded to Cloudflare's secure secret storage
- Use `.env` for production and `.env.local` for development

## Script Development

All scripts are written in ES modules (Node.js 18+) and use:
- `spawn` for running child processes
- Promises for async operations
- Error handling with try/catch
- Clear console output with emojis for visual feedback

### Common Patterns

**Running Commands**:
```javascript
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}
```

**Directory Validation**:
```javascript
try {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  if (pkg.name !== 'test-webhook') {
    throw new Error('Wrong directory');
  }
} catch (error) {
  console.error('❌ This script must be run from the project root directory.');
  process.exit(1);
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

### Secret Upload Failures

If `npm run secrets:upload` fails:
1. Verify `.env` or `.env.local` exists in `admin/` directory
2. Check that all secrets are in `KEY=VALUE` format
3. Ensure you're logged in to Cloudflare: `wrangler login`
4. Verify you have write permissions for the worker

### Deployment Failures

If `npm run deploy` fails:
1. Check type errors: `npm run type-check`
2. Check lint errors: `npm run lint`
3. Ensure all dependencies installed: `npm install`
4. Verify wrangler authentication: `wrangler whoami`

## Adding New Scripts

When adding new scripts to this directory:

1. Use ES module syntax (`import`/`export`)
2. Add shebang: `#!/usr/bin/env node`
3. Make executable: `chmod +x scripts/your-script.js`
4. Add to `package.json` scripts
5. Document in this README
6. Include error handling and validation
7. Provide clear console output with emojis