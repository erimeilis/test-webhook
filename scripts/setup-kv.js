#!/usr/bin/env node

/**
 * KV Namespace Setup Script
 * Creates KV namespaces for Better Auth sessions and webhook cache if they don't exist
 * Updates wrangler.toml files with the correct namespace IDs
 *
 * Usage: node scripts/setup-kv.js
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Run a command and return a promise with output
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with exit code ${code}\n${stderr}`));
      }
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

// Extract namespace ID from wrangler output
function extractNamespaceId(output) {
  // Look for patterns like: id = "abc123..." or "id": "abc123..."
  const patterns = [
    /id\s*=\s*"([^"]+)"/,
    /"id":\s*"([^"]+)"/,
    /namespace-id:\s*([a-f0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = output.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Update wrangler.toml with KV namespace ID
function updateWranglerToml(filePath, binding, namespaceId) {
  let content = readFileSync(filePath, 'utf8');

  // Check if namespace binding already exists
  const bindingRegex = new RegExp(`binding\\s*=\\s*"${binding}"[\\s\\S]*?id\\s*=\\s*"([^"]+)"`, 'm');
  const match = content.match(bindingRegex);

  if (match && match[1] !== 'YOUR_KV_NAMESPACE_ID') {
    // Already configured with valid ID
    return match[1];
  }

  // Replace the placeholder ID or add new binding
  if (content.includes(`binding = "${binding}"`)) {
    // Binding exists, update ID
    content = content.replace(
      new RegExp(`(binding\\s*=\\s*"${binding}"[\\s\\S]*?id\\s*=\\s*)"YOUR_KV_NAMESPACE_ID"`, 'm'),
      `$1"${namespaceId}"`
    );
  } else {
    // Add new binding before the last line
    const lines = content.split('\n');
    const kvBinding = `\n# KV namespace for ${binding}\n[[kv_namespaces]]\nbinding = "${binding}"\nid = "${namespaceId}"\n`;

    // Insert before last empty lines
    let insertIndex = lines.length;
    while (insertIndex > 0 && lines[insertIndex - 1].trim() === '') {
      insertIndex--;
    }

    lines.splice(insertIndex, 0, kvBinding);
    content = lines.join('\n');
  }

  writeFileSync(filePath, content, 'utf8');
  return namespaceId;
}

// Setup a KV namespace
async function setupNamespace(binding, workerDir) {
  const wranglerPath = join(workerDir, 'wrangler.toml');
  const currentConfig = readFileSync(wranglerPath, 'utf8');

  // Check if already configured
  const bindingRegex = new RegExp(`binding\\s*=\\s*"${binding}"[\\s\\S]*?id\\s*=\\s*"([^"]+)"`, 'm');
  const match = currentConfig.match(bindingRegex);

  if (match && match[1] !== 'YOUR_KV_NAMESPACE_ID') {
    console.log(`   ✅ ${binding} already configured: ${match[1]}`);
    return match[1];
  }

  // Create KV namespace
  console.log(`   Creating ${binding} namespace...`);
  const { stdout, stderr } = await runCommand(
    'wrangler',
    ['kv', 'namespace', 'create', binding],
    { cwd: workerDir }
  );

  // Extract namespace ID from output
  const output = stdout + stderr;
  const namespaceId = extractNamespaceId(output);

  if (!namespaceId) {
    throw new Error(`Could not extract namespace ID for ${binding} from wrangler output`);
  }

  console.log(`   ✅ Created ${binding}: ${namespaceId}`);

  // Update wrangler.toml
  updateWranglerToml(wranglerPath, binding, namespaceId);
  console.log(`   ✅ Updated ${workerDir}/wrangler.toml`);

  return namespaceId;
}

async function main() {
  console.log('🗄️  Setting up KV Namespaces...');
  console.log('═'.repeat(60));

  const adminDir = './admin';
  const webhookDir = './webhook-worker';

  try {
    // Setup SESSIONS namespace for admin worker (Better Auth)
    console.log('\n📝 Setting up SESSIONS namespace (admin worker)...');
    await setupNamespace('SESSIONS', adminDir);

    // Setup WEBHOOK_CACHE namespace for both workers
    console.log('\n📝 Setting up WEBHOOK_CACHE namespace...');

    // Create namespace once (from admin worker)
    const webhookCacheId = await setupNamespace('WEBHOOK_CACHE', adminDir);

    // Update webhook worker wrangler.toml with same namespace ID
    console.log('   Updating webhook worker wrangler.toml...');
    const webhookWranglerPath = join(webhookDir, 'wrangler.toml');
    updateWranglerToml(webhookWranglerPath, 'WEBHOOK_CACHE', webhookCacheId);
    console.log('   ✅ Updated webhook-worker/wrangler.toml');

    console.log('\n═'.repeat(60));
    console.log('✅ All KV namespaces configured!');
    console.log('\n📋 Summary:');
    console.log('   • SESSIONS: Used by admin worker for Better Auth');
    console.log('   • WEBHOOK_CACHE: Shared by admin + webhook workers for performance');

  } catch (error) {
    console.error('\n❌ KV namespace setup failed:', error.message);
    console.error('\nPlease check your wrangler configuration and try again.');
    console.error('You may need to run: wrangler login');
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

// Run setup
main();
