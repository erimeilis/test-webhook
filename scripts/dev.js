#!/usr/bin/env node

/**
 * Full-Stack Development Script
 * Runs both admin and webhook workers simultaneously with shared database
 *
 * Usage: npm run dev
 *        npm run dev --remote  # Use remote D1 database instead of local
 *
 * Ports:
 * - Admin Worker: http://localhost:5173
 * - Webhook Worker: http://localhost:5174
 *
 * Steps:
 * 0. Update wrangler to latest version
 * 1. Load environment variables
 * 2. Generate wrangler.toml from templates (for dev)
 * 3. Generate .dev.vars file
 * 4. Kill existing processes on ports
 * 5. Setup database / Apply migrations
 * 6. Start admin worker
 * 7. Start webhook worker
 */

import { execSync, spawn } from 'child_process'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

const ROOT_DIR = process.cwd()
const ADMIN_DIR = resolve(ROOT_DIR, 'admin')
const WEBHOOK_DIR = resolve(ROOT_DIR, 'webhook-worker')
const SHARED_DB_DIR = resolve(ROOT_DIR, '.wrangler-shared')

const DATABASE_NAME = 'webhook-db'

const PORTS = {
  admin: 5173,
  webhook: 5174,
}

// Parse command line arguments
const args = process.argv.slice(2)
const useRemoteDb = args.includes('--remote')

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

// Execute command silently and return output
function exec(command, options = {}) {
  const { silent = false, cwd = ROOT_DIR } = options
  try {
    return execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit',
    })
  } catch (error) {
    if (silent) return error.stdout || ''
    throw error
  }
}

// Parse .env file
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}

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
  logStep('0/7', 'Updating wrangler to latest version...')

  const directories = [
    { name: 'root', path: ROOT_DIR },
    { name: 'admin', path: ADMIN_DIR },
  ]

  for (const dir of directories) {
    try {
      exec('npm update wrangler', { cwd: dir.path, silent: true })
      logSuccess(`Updated wrangler in ${dir.name}`)
    } catch {
      logWarning(`Failed to update wrangler in ${dir.name}`)
    }
  }
}

// Step 1: Load environment variables
function loadEnvironment() {
  logStep('1/7', 'Loading environment variables...')

  const envLocalPath = resolve(ROOT_DIR, '.env.local')
  const envPath = resolve(ROOT_DIR, '.env')

  let secrets = {}

  // Prefer .env.local for development
  if (existsSync(envLocalPath)) {
    secrets = parseEnvFile(envLocalPath)
    logSuccess(`Loaded ${Object.keys(secrets).length} variables from .env.local`)
  } else if (existsSync(envPath)) {
    secrets = parseEnvFile(envPath)
    logSuccess(`Loaded ${Object.keys(secrets).length} variables from .env`)
    logWarning('Consider creating .env.local with localhost URLs for development')
  } else {
    logError('No .env or .env.local file found!')
    console.log('   Create .env.local from .env.example for local development')
    process.exit(1)
  }

  return secrets
}

// Step 2: Generate wrangler.toml from templates (for dev)
function generateWranglerConfigs() {
  logStep('2/7', 'Generating wrangler.toml from templates...')

  // For local dev, we use placeholder IDs - wrangler will create local resources
  const replacements = {
    '{{DATABASE_ID}}': 'local-dev-db',
    '{{SESSIONS_KV_ID}}': 'local-dev-sessions',
    '{{WEBHOOK_CACHE_KV_ID}}': 'local-dev-cache',
    '{{ENVIRONMENT}}': 'development',
  }

  // Generate admin wrangler.toml
  const adminTemplatePath = resolve(ADMIN_DIR, 'wrangler.toml.template')
  if (existsSync(adminTemplatePath)) {
    let adminConfig = readFileSync(adminTemplatePath, 'utf8')
    for (const [placeholder, value] of Object.entries(replacements)) {
      adminConfig = adminConfig.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
    }
    writeFileSync(resolve(ADMIN_DIR, 'wrangler.toml'), adminConfig)
    logSuccess('Generated admin/wrangler.toml')
  } else {
    logWarning('admin/wrangler.toml.template not found, using existing config')
  }

  // Generate webhook wrangler.toml
  const webhookTemplatePath = resolve(WEBHOOK_DIR, 'wrangler.toml.template')
  if (existsSync(webhookTemplatePath)) {
    let webhookConfig = readFileSync(webhookTemplatePath, 'utf8')
    for (const [placeholder, value] of Object.entries(replacements)) {
      webhookConfig = webhookConfig.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
    }
    writeFileSync(resolve(WEBHOOK_DIR, 'wrangler.toml'), webhookConfig)
    logSuccess('Generated webhook-worker/wrangler.toml')
  } else {
    logWarning('webhook-worker/wrangler.toml.template not found, using existing config')
  }
}

// Step 3: Generate .dev.vars file for admin worker
function generateDevVars(secrets) {
  logStep('3/7', 'Generating .dev.vars file...')

  // Create .dev.vars with all secrets for local development
  const devVarsContent = Object.entries(secrets)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  writeFileSync(resolve(ADMIN_DIR, '.dev.vars'), devVarsContent)
  logSuccess('Generated admin/.dev.vars')
}

// Step 4: Kill existing processes on ports
async function killExistingProcesses() {
  logStep('4/7', 'Killing existing processes on ports...')

  for (const [name, port] of Object.entries(PORTS)) {
    try {
      const pids = exec(`lsof -ti:${port}`, { silent: true }).trim()
      if (pids) {
        for (const pid of pids.split('\n').filter(Boolean)) {
          exec(`kill -9 ${pid}`, { silent: true })
          logSuccess(`Killed process ${pid} on port ${port} (${name})`)
        }
      } else {
        logSuccess(`Port ${port} (${name}) is free`)
      }
    } catch {
      logSuccess(`Port ${port} (${name}) is free`)
    }
  }

  // Wait for ports to be released
  await new Promise(resolve => setTimeout(resolve, 1000))
}

// Step 5: Setup database / Apply migrations
function setupDatabase() {
  logStep('5/7', 'Setting up database and applying migrations...')

  // Get all migration files
  const migrationsDir = resolve(ROOT_DIR, 'migrations')
  if (!existsSync(migrationsDir)) {
    logWarning('No migrations directory found')
    return
  }

  const migrationFiles = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  if (migrationFiles.length === 0) {
    logWarning('No migration files found')
    return
  }

  log(`   Found ${migrationFiles.length} migration(s)`)

  // Apply migrations to local database
  for (const file of migrationFiles) {
    const filePath = join(migrationsDir, file)
    try {
      exec(`wrangler d1 execute ${DATABASE_NAME} --local --persist-to ${SHARED_DB_DIR} --file=${filePath}`, {
        silent: true,
      })
    } catch {
      // Migration might already be applied, continue
    }
  }

  logSuccess('Migrations applied to local database')
}

// Step 6 & 7: Start services
function startServices() {
  logStep('6/7', 'Starting admin worker...')

  // Start admin worker
  const admin = spawn('npm', ['run', 'dev:full'], {
    cwd: ADMIN_DIR,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  })

  admin.stdout.on('data', (data) => {
    process.stdout.write(`${colors.cyan}[ADMIN]${colors.reset} ${data}`)
  })

  admin.stderr.on('data', (data) => {
    process.stderr.write(`${colors.cyan}[ADMIN]${colors.reset} ${data}`)
  })

  // Start webhook worker after delay
  setTimeout(() => {
    logStep('7/7', 'Starting webhook worker...')

    const localFlag = useRemoteDb ? '' : '--local'
    const persistFlag = useRemoteDb ? '' : `--persist-to ${SHARED_DB_DIR}`

    const webhook = spawn(
      'wrangler',
      ['dev', '--port', String(PORTS.webhook), localFlag, persistFlag].filter(Boolean),
      {
        cwd: WEBHOOK_DIR,
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
      }
    )

    webhook.stdout.on('data', (data) => {
      process.stdout.write(`${colors.yellow}[WEBHOOK]${colors.reset} ${data}`)
    })

    webhook.stderr.on('data', (data) => {
      process.stderr.write(`${colors.yellow}[WEBHOOK]${colors.reset} ${data}`)
    })

    // Show ready message
    setTimeout(() => {
      log('\n' + '═'.repeat(60), 'green')
      log('  Development Environment Ready!', 'bright')
      log('═'.repeat(60), 'green')
      console.log('')
      console.log(`  📡 Admin Worker:   http://localhost:${PORTS.admin}`)
      console.log(`  ⚡ Webhook Worker: http://localhost:${PORTS.webhook}`)
      console.log(`  🗄️  Database:       ${useRemoteDb ? 'Remote D1' : SHARED_DB_DIR}`)
      console.log('')
      console.log('  Press Ctrl+C to stop both services')
      console.log('')
    }, 3000)

    // Handle cleanup
    const cleanup = () => {
      log('\n🛑 Shutting down services...', 'yellow')
      admin.kill('SIGTERM')
      webhook.kill('SIGTERM')
      setTimeout(() => process.exit(0), 1000)
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)

    admin.on('close', (code) => {
      if (code !== 0 && code !== null) {
        logError(`Admin worker exited with code ${code}`)
      }
      webhook.kill('SIGTERM')
      setTimeout(() => process.exit(code || 0), 500)
    })

    webhook.on('close', (code) => {
      if (code !== 0 && code !== null) {
        logError(`Webhook worker exited with code ${code}`)
      }
      admin.kill('SIGTERM')
      setTimeout(() => process.exit(code || 0), 500)
    })

  }, 2000)
}

// Main execution
async function main() {
  log('\n' + '═'.repeat(60), 'cyan')
  log('  Webhook System Development Environment', 'bright')
  log('═'.repeat(60), 'cyan')

  if (useRemoteDb) {
    logWarning('Using remote D1 database (--remote flag)')
  }

  try {
    // Step 0: Update wrangler
    updateWrangler()

    // Step 1: Load environment
    const secrets = loadEnvironment()

    // Step 2: Generate wrangler configs
    generateWranglerConfigs()

    // Step 3: Generate .dev.vars
    generateDevVars(secrets)

    // Step 4: Kill existing processes
    await killExistingProcesses()

    // Step 5: Setup database
    setupDatabase()

    // Step 6 & 7: Start services
    startServices()

  } catch (error) {
    logError(`Startup failed: ${error.message}`)
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
