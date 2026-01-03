#!/usr/bin/env node

/**
 * Full-Stack Deployment Script
 * Deploys both admin and webhook workers to Cloudflare
 *
 * Usage: npm run deploy
 *        npm run deploy admin     # Deploy admin worker only
 *        npm run deploy webhook   # Deploy webhook worker only
 *        npm run deploy --skip-migrations  # Skip database migrations
 *
 * Steps:
 * 0. Update wrangler to latest version
 * 1. Load environment variables
 * 2. Check/create D1 database
 * 3. Create KV namespaces (SESSIONS, WEBHOOK_CACHE)
 * 4. Generate wrangler.toml from templates
 * 5. Upload secrets to Cloudflare
 * 6. Run database migrations
 * 7. Build workers (type-check, lint, CSS, client)
 * 8. Deploy workers
 */

import { execSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const ROOT_DIR = process.cwd()
const ADMIN_DIR = resolve(ROOT_DIR, 'admin')
const WEBHOOK_DIR = resolve(ROOT_DIR, 'webhook-worker')

const DATABASE_NAME = 'webhook-db'

// Parse command line arguments
const args = process.argv.slice(2)
const skipMigrations = args.includes('--skip-migrations')
const deployTarget = args.find(a => !a.startsWith('--')) || 'all'

// Colors for logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
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

// Execute command and return output
function exec(command, options = {}) {
  const { silent = false, cwd = ROOT_DIR } = options
  try {
    const result = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
    })
    return result
  } catch (error) {
    if (silent) {
      return error.stdout || ''
    }
    throw error
  }
}

// Execute command and capture output
function execCapture(command, options = {}) {
  const { cwd = ROOT_DIR } = options
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    })
  } catch (error) {
    return error.stdout || error.stderr || ''
  }
}

// Parse .env file
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {}
  }
  const content = readFileSync(filePath, 'utf8')
  const secrets = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const match = trimmed.match(/^([A-Z_]+)=(.+)$/)
    if (match) {
      secrets[match[1]] = match[2]
    }
  }

  return secrets
}

// Step 0: Update wrangler to latest version
function updateWrangler() {
  logStep('0/8', 'Updating wrangler to latest version...')

  const directories = [
    { name: 'root', path: ROOT_DIR },
    { name: 'admin', path: ADMIN_DIR },
  ]

  for (const dir of directories) {
    try {
      exec('npm update wrangler', { cwd: dir.path, silent: true })
      logSuccess(`Updated wrangler in ${dir.name}`)
    } catch (error) {
      logWarning(`Failed to update wrangler in ${dir.name}`)
    }
  }
}

// Step 1: Load environment variables
function loadEnvironment() {
  logStep('1/8', 'Loading environment variables...')

  const envPath = resolve(ROOT_DIR, '.env')
  const envLocalPath = resolve(ROOT_DIR, '.env.local')

  let secrets = {}
  let envFile = ''

  if (existsSync(envPath)) {
    secrets = parseEnvFile(envPath)
    envFile = '.env'
    logSuccess(`Loaded ${Object.keys(secrets).length} variables from .env`)
  } else if (existsSync(envLocalPath)) {
    secrets = parseEnvFile(envLocalPath)
    envFile = '.env.local'
    logWarning('Using .env.local (create .env for production)')
  } else {
    logError('No .env file found!')
    console.log('   Create .env from .env.example and fill in your values')
    process.exit(1)
  }

  // Validate required secrets
  const required = ['BASE_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'RESEND_API_KEY', 'FROM_EMAIL', 'BETTER_AUTH_SECRET']
  const missing = required.filter(key => !secrets[key])

  if (missing.length > 0) {
    logError(`Missing required secrets: ${missing.join(', ')}`)
    process.exit(1)
  }

  // Warn if using localhost for production
  if (secrets.BASE_URL && secrets.BASE_URL.includes('localhost')) {
    logWarning('BASE_URL contains localhost - this will break OAuth in production!')
  } else {
    logSuccess(`BASE_URL: ${secrets.BASE_URL}`)
  }

  return secrets
}

// Get account ID from wrangler whoami
function getAccountId() {
  const output = execCapture('wrangler whoami')
  // Look for account ID in the table output (32-character hex string)
  const match = output.match(/([a-f0-9]{32})\s*│?\s*$/m)
  if (!match) {
    logError('Failed to get account ID from wrangler whoami')
    console.log('Output:', output)
    process.exit(1)
  }
  return match[1]
}

// Step 2: Check/create D1 database
function setupDatabase() {
  logStep('2/8', 'Setting up D1 database...')

  // List existing databases
  const output = execCapture('wrangler d1 list --json')
  let databases = []

  try {
    databases = JSON.parse(output)
  } catch {
    databases = []
  }

  const existing = databases.find(db => db.name === DATABASE_NAME)

  if (existing) {
    logSuccess(`Database exists: ${DATABASE_NAME} (${existing.uuid})`)
    return existing.uuid
  }

  // Create new database
  log(`   Creating database: ${DATABASE_NAME}...`)
  const createOutput = execCapture(`wrangler d1 create ${DATABASE_NAME}`)

  // Extract database ID from output (handles both TOML and JSON formats)
  const idMatch = createOutput.match(/database_id["\s:=]+["']?([a-f0-9-]{36})["']?/i)
  if (!idMatch) {
    logError('Failed to create database or extract ID')
    console.log(createOutput)
    process.exit(1)
  }

  const databaseId = idMatch[1]
  logSuccess(`Created database: ${DATABASE_NAME} (${databaseId})`)
  return databaseId
}

// Step 3: Create KV namespaces
function setupKVNamespaces() {
  logStep('3/8', 'Setting up KV namespaces...')

  const namespaces = {}

  // List existing namespaces (wrangler outputs JSON by default)
  const output = execCapture('wrangler kv namespace list')
  let existingNamespaces = []

  try {
    // Output is JSON array
    existingNamespaces = JSON.parse(output)
  } catch {
    // Try to find JSON in the output (may have leading text)
    const jsonMatch = output.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        existingNamespaces = JSON.parse(jsonMatch[0])
      } catch {
        existingNamespaces = []
      }
    }
  }

  // Setup SESSIONS namespace
  const sessionsNs = existingNamespaces.find(ns =>
    ns.title === 'SESSIONS' ||
    ns.title === 'webhook-admin-SESSIONS' ||
    ns.title.includes('SESSIONS')
  )
  if (sessionsNs) {
    namespaces.SESSIONS = sessionsNs.id
    logSuccess(`SESSIONS namespace exists: ${sessionsNs.id}`)
  } else {
    log('   Creating SESSIONS namespace...')
    const createOutput = execCapture('wrangler kv namespace create SESSIONS', { cwd: ADMIN_DIR })
    // Handle both TOML and JSON output formats
    const idMatch = createOutput.match(/id["\s:=]+["']?([a-f0-9]{32})["']?/i)
    if (idMatch) {
      namespaces.SESSIONS = idMatch[1]
      logSuccess(`Created SESSIONS namespace: ${idMatch[1]}`)
    } else {
      logError('Failed to create SESSIONS namespace')
      console.log(createOutput)
      process.exit(1)
    }
  }

  // Setup WEBHOOK_CACHE namespace
  const cacheNs = existingNamespaces.find(ns =>
    ns.title === 'WEBHOOK_CACHE' ||
    ns.title === 'webhook-admin-WEBHOOK_CACHE' ||
    ns.title.includes('WEBHOOK_CACHE')
  )
  if (cacheNs) {
    namespaces.WEBHOOK_CACHE = cacheNs.id
    logSuccess(`WEBHOOK_CACHE namespace exists: ${cacheNs.id}`)
  } else {
    log('   Creating WEBHOOK_CACHE namespace...')
    const createOutput = execCapture('wrangler kv namespace create WEBHOOK_CACHE', { cwd: ADMIN_DIR })
    // Handle both TOML and JSON output formats
    const idMatch = createOutput.match(/id["\s:=]+["']?([a-f0-9]{32})["']?/i)
    if (idMatch) {
      namespaces.WEBHOOK_CACHE = idMatch[1]
      logSuccess(`Created WEBHOOK_CACHE namespace: ${idMatch[1]}`)
    } else {
      logError('Failed to create WEBHOOK_CACHE namespace')
      console.log(createOutput)
      process.exit(1)
    }
  }

  return namespaces
}

// Extract domain from URL (e.g., https://webhooks.admice.com -> webhooks.admice.com)
function extractDomain(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
}

// Extract zone name from domain (e.g., webhooks.admice.com -> admice.com)
function extractZoneName(domain) {
  const parts = domain.split('.')
  if (parts.length >= 2) {
    return parts.slice(-2).join('.')
  }
  return domain
}

// Step 4: Generate wrangler.toml from templates
function generateWranglerConfigs(databaseId, kvNamespaces, secrets) {
  logStep('4/8', 'Generating wrangler.toml from templates...')

  // Get account ID from wrangler
  const accountId = getAccountId()
  logSuccess(`Account ID: ${accountId}`)

  // Extract domains from URLs
  const adminDomain = extractDomain(secrets.BASE_URL)
  const webhookDomain = secrets.WEBHOOK_WORKER_URL ? extractDomain(secrets.WEBHOOK_WORKER_URL) : ''
  const zoneName = extractZoneName(adminDomain)

  logSuccess(`Admin domain: ${adminDomain}`)
  if (webhookDomain) logSuccess(`Webhook domain: ${webhookDomain}`)
  logSuccess(`Zone: ${zoneName}`)

  const replacements = {
    '{{ACCOUNT_ID}}': accountId,
    '{{DATABASE_ID}}': databaseId,
    '{{SESSIONS_KV_ID}}': kvNamespaces.SESSIONS,
    '{{WEBHOOK_CACHE_KV_ID}}': kvNamespaces.WEBHOOK_CACHE,
    '{{ENVIRONMENT}}': 'production',
    '{{ADMIN_DOMAIN}}': adminDomain,
    '{{WEBHOOK_DOMAIN}}': webhookDomain,
    '{{ZONE_NAME}}': zoneName,
  }

  // Generate admin wrangler.toml
  const adminTemplate = readFileSync(resolve(ADMIN_DIR, 'wrangler.toml.template'), 'utf8')
  let adminConfig = adminTemplate
  for (const [placeholder, value] of Object.entries(replacements)) {
    adminConfig = adminConfig.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
  }
  writeFileSync(resolve(ADMIN_DIR, 'wrangler.toml'), adminConfig)
  logSuccess('Generated admin/wrangler.toml')

  // Generate webhook wrangler.toml
  const webhookTemplate = readFileSync(resolve(WEBHOOK_DIR, 'wrangler.toml.template'), 'utf8')
  let webhookConfig = webhookTemplate
  for (const [placeholder, value] of Object.entries(replacements)) {
    webhookConfig = webhookConfig.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
  }
  writeFileSync(resolve(WEBHOOK_DIR, 'wrangler.toml'), webhookConfig)
  logSuccess('Generated webhook-worker/wrangler.toml')
}

// Step 5: Upload secrets to Cloudflare
function uploadSecrets(secrets) {
  logStep('5/8', 'Uploading secrets to Cloudflare...')

  for (const [key, value] of Object.entries(secrets)) {
    try {
      const proc = spawn('wrangler', ['secret', 'put', key], {
        cwd: ADMIN_DIR,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      })

      proc.stdin.write(value)
      proc.stdin.end()

      // Wait synchronously (simplified for script)
      execSync(`echo "${value}" | wrangler secret put ${key}`, {
        cwd: ADMIN_DIR,
        stdio: 'pipe',
        shell: true,
      })
      logSuccess(`Uploaded ${key}`)
    } catch (error) {
      logWarning(`Failed to upload ${key} (may already exist)`)
    }
  }
}

// Step 6: Run database migrations
function runMigrations() {
  if (skipMigrations) {
    logStep('6/8', 'Skipping database migrations (--skip-migrations flag)')
    return
  }

  logStep('6/8', 'Running database migrations...')

  try {
    exec(`wrangler d1 migrations apply ${DATABASE_NAME} --remote`, { cwd: ADMIN_DIR })
    logSuccess('Migrations applied successfully')
  } catch (error) {
    logError(`Migration failed: ${error.message}`)
    process.exit(1)
  }
}

// Step 7: Build workers
function buildWorkers() {
  logStep('7/8', 'Building workers...')

  if (deployTarget === 'all' || deployTarget === 'admin') {
    // Type check
    log('   Running type check...')
    exec('npm run type-check', { cwd: ADMIN_DIR })
    logSuccess('Type check passed')

    // Lint
    log('   Running linter...')
    exec('npm run lint', { cwd: ADMIN_DIR })
    logSuccess('Lint check passed')

    // Build info
    log('   Generating build info...')
    exec('npm run build:info', { cwd: ADMIN_DIR })
    logSuccess('Build info generated')

    // Build CSS
    log('   Building CSS...')
    exec('npm run build:css', { cwd: ADMIN_DIR })
    logSuccess('CSS built')

    // Build client
    log('   Building client bundle...')
    exec('npm run build:client', { cwd: ADMIN_DIR })
    logSuccess('Client bundle built')
  }

  if (deployTarget === 'all' || deployTarget === 'webhook') {
    // Webhook worker builds during deploy (Rust/WASM)
    logSuccess('Webhook worker will build during deployment')
  }
}

// Step 8: Deploy workers
function deployWorkers() {
  logStep('8/8', 'Deploying workers...')

  if (deployTarget === 'all' || deployTarget === 'admin') {
    log('   Deploying admin worker...')
    exec('wrangler deploy', { cwd: ADMIN_DIR })
    logSuccess('Admin worker deployed')
  }

  if (deployTarget === 'all' || deployTarget === 'webhook') {
    log('   Deploying webhook worker...')
    exec('wrangler deploy', { cwd: WEBHOOK_DIR })
    logSuccess('Webhook worker deployed')
  }
}

// Main execution
async function main() {
  log('\n' + '═'.repeat(60), 'cyan')
  log('  Webhook System Deployment', 'bright')
  log('═'.repeat(60), 'cyan')

  if (deployTarget !== 'all') {
    log(`\nDeploying: ${deployTarget} only`, 'yellow')
  }

  try {
    // Step 0: Update wrangler
    updateWrangler()

    // Step 1: Load environment
    const secrets = loadEnvironment()

    // Step 2: Setup database
    const databaseId = setupDatabase()

    // Step 3: Setup KV namespaces
    const kvNamespaces = setupKVNamespaces()

    // Step 4: Generate wrangler configs
    generateWranglerConfigs(databaseId, kvNamespaces, secrets)

    // Step 5: Upload secrets
    uploadSecrets(secrets)

    // Step 6: Run migrations
    runMigrations()

    // Step 7: Build workers
    buildWorkers()

    // Step 8: Deploy workers
    deployWorkers()

    log('\n' + '═'.repeat(60), 'green')
    log('  Deployment Complete!', 'bright')
    log('═'.repeat(60), 'green')

    console.log('\nNext steps:')
    console.log('  1. Verify admin worker at your production domain')
    console.log('  2. Test authentication (Google OAuth + Email/Password)')
    console.log('  3. Test webhook ingestion endpoint')
    console.log('  4. Check Cloudflare dashboard for worker logs')

  } catch (error) {
    log('\n' + '═'.repeat(60), 'red')
    logError(`Deployment failed: ${error.message}`)
    log('═'.repeat(60), 'red')
    process.exit(1)
  }
}

// Verify we're in the right directory
try {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
  if (pkg.name !== 'test-webhook') {
    throw new Error('Wrong directory')
  }
} catch {
  console.error('❌ This script must be run from the project root directory.')
  console.error('   Current directory:', process.cwd())
  process.exit(1)
}

main()
