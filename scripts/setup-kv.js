#!/usr/bin/env node

/**
 * KV Namespace Setup Script
 * Creates KV namespace for Better Auth sessions if it doesn't exist
 * Updates wrangler.toml with the correct namespace ID
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
function updateWranglerToml(namespaceId) {
  const wranglerPath = join('./admin', 'wrangler.toml');
  let content = readFileSync(wranglerPath, 'utf8');

  // Replace the placeholder ID
  content = content.replace(
    /id\s*=\s*"YOUR_KV_NAMESPACE_ID"/,
    `id = "${namespaceId}"`
  );

  writeFileSync(wranglerPath, content, 'utf8');
}

async function main() {
  console.log('🗄️  Setting up KV Namespace for Sessions...');
  console.log('═'.repeat(60));

  const adminDir = './admin';
  const wranglerPath = join(adminDir, 'wrangler.toml');

  try {
    // Check current wrangler.toml
    const currentConfig = readFileSync(wranglerPath, 'utf8');

    // Check if KV namespace is already configured
    if (currentConfig.includes('id = "YOUR_KV_NAMESPACE_ID"') ||
        !currentConfig.includes('[[kv_namespaces]]')) {

      console.log('\n📝 KV namespace not configured, creating...');

      // Create KV namespace
      console.log('   Creating SESSIONS namespace...');
      const { stdout, stderr } = await runCommand(
        'wrangler',
        ['kv', 'namespace', 'create', 'SESSIONS'],
        { cwd: adminDir }
      );

      // Extract namespace ID from output
      const output = stdout + stderr;
      const namespaceId = extractNamespaceId(output);

      if (!namespaceId) {
        throw new Error('Could not extract namespace ID from wrangler output');
      }

      console.log(`   ✅ Created KV namespace: ${namespaceId}`);

      // Update wrangler.toml
      console.log('\n📝 Updating wrangler.toml...');
      updateWranglerToml(namespaceId);
      console.log('   ✅ wrangler.toml updated with namespace ID');

    } else {
      console.log('\n✅ KV namespace already configured');

      // Extract existing ID for verification
      const match = currentConfig.match(/binding\s*=\s*"SESSIONS"[\s\S]*?id\s*=\s*"([^"]+)"/);
      if (match) {
        console.log(`   Namespace ID: ${match[1]}`);
      }
    }

    console.log('\n═'.repeat(60));
    console.log('✅ KV namespace setup complete!');

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
