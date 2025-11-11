#!/usr/bin/env node

/**
 * Get Admin User's First Webhook
 * Queries D1 database to get the first webhook UUID of the admin user
 *
 * Usage: node scripts/get-admin-webhook.js
 *
 * Returns: webhook UUID or exits with error if not found
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Run wrangler command and return output with timeout
function runWrangler(args, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const proc = spawn('wrangler', args, {
      cwd: join(process.cwd(), 'admin'),
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set timeout
    const timeout = setTimeout(() => {
      timedOut = true;
      proc.kill();
      reject(new Error('wrangler command timed out after 10 seconds'));
    }, timeoutMs);

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (timedOut) return;

      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`wrangler exited with code ${code}\n${stderr}`));
      }
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      if (!timedOut) {
        reject(error);
      }
    });
  });
}

// Get admin email from .env file
function getAdminEmail() {
  try {
    const envPath = join(process.cwd(), 'admin', '.env');
    const envContent = readFileSync(envPath, 'utf8');

    const match = envContent.match(/^ADMIN_EMAIL=(.+)$/m);
    if (match && match[1]) {
      return match[1].trim();
    }

    throw new Error('ADMIN_EMAIL not found in .env file');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('.env file not found in admin/ directory. Please create one from .env.example');
    }
    throw error;
  }
}

// Extract database name from wrangler.toml
function getDatabaseName() {
  try {
    const wranglerPath = join(process.cwd(), 'admin', 'wrangler.toml');
    const wranglerContent = readFileSync(wranglerPath, 'utf8');

    const match = wranglerContent.match(/database_name\s*=\s*"([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }

    throw new Error('database_name not found in wrangler.toml');
  } catch (error) {
    throw new Error(`Failed to read wrangler.toml: ${error.message}`);
  }
}

async function main() {
  try {
    // Get admin email from .env
    const adminEmail = getAdminEmail();
    console.error(`🔍 Looking up webhooks for admin user: ${adminEmail}`);

    // Get database name
    const dbName = getDatabaseName();
    console.error(`📊 Database: ${dbName}`);

    // Query D1 to get admin user's first webhook
    // Use a temporary file to avoid shell escaping issues
    const sql = `SELECT w.uuid, w.name FROM webhooks w JOIN user u ON w.user_id = u.id WHERE u.email = '${adminEmail}' ORDER BY w.created_at ASC LIMIT 1`;

    const tmpFile = join(tmpdir(), `webhook-query-${Date.now()}.sql`);
    writeFileSync(tmpFile, sql, 'utf8');

    console.error('📡 Querying D1 database...');

    // Check if we should use local or production database
    const useLocal = process.env.USE_LOCAL_DB === 'true';

    let stdout;
    try {
      const wranglerArgs = [
        'd1',
        'execute',
        dbName,
        '--file',
        tmpFile,
        '--json'
      ];

      // Add local flags only if explicitly requested
      if (useLocal) {
        wranglerArgs.push('--local', '--persist-to', join(process.cwd(), '.wrangler-shared'));
        console.error('🔧 Using local database');
      } else {
        console.error('☁️  Using production database');
      }

      const result = await runWrangler(wranglerArgs);
      stdout = result.stdout;
    } finally {
      // Clean up temp file
      try {
        unlinkSync(tmpFile);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Parse JSON output
    let results;
    try {
      // wrangler d1 execute --json returns an array of response objects
      const jsonArray = JSON.parse(stdout);

      // Find the first object with results
      for (const item of jsonArray) {
        if (item.results && Array.isArray(item.results)) {
          results = item.results;
          break;
        }
      }
    } catch (error) {
      console.error('❌ Failed to parse D1 output:', error.message);
      console.error('Raw output:', stdout);
      process.exit(1);
    }

    if (!results || results.length === 0) {
      console.error('❌ No webhooks found for admin user');
      console.error('');
      console.error('💡 Create a webhook first:');
      console.error('   1. Start the app: npm run dev');
      console.error('   2. Login as admin: http://localhost:5173');
      console.error('   3. Create a webhook in the dashboard');
      process.exit(1);
    }

    const webhook = results[0];
    console.error(`✅ Found webhook: ${webhook.name || 'Unnamed'} (${webhook.uuid})`);
    console.error('');

    // Output just the UUID to stdout (for piping)
    console.log(webhook.uuid);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Ensure .env file exists in admin/ directory');
    console.error('   2. Check ADMIN_EMAIL is set correctly');
    console.error('   3. Verify wrangler is logged in: wrangler login');
    console.error('   4. Ensure database has been migrated: npm run db:migrate');
    process.exit(1);
  }
}

// Check if we're in the right directory
try {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
  if (pkg.name !== 'test-webhook') {
    throw new Error('Wrong directory');
  }
} catch (error) {
  console.error('❌ This script must be run from the project root directory.');
  console.error('   Current directory:', process.cwd());
  process.exit(1);
}

// Run
main();
