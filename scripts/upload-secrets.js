#!/usr/bin/env node

/**
 * Upload Secrets Script
 * Reads secrets from .env (production) or .env.local and uploads them to Cloudflare using wrangler
 *
 * Usage: node scripts/upload-secrets.js
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Run a command and return a promise
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      shell: true,
      ...options
    });

    let stdout = '';
    let stderr = '';

    if (options.silent) {
      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
    }

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

// Upload a single secret
async function uploadSecret(name, value, cwd) {
  try {
    console.log(`   📤 Uploading ${name}...`);

    // Create a child process to send the secret value via stdin
    const proc = spawn('wrangler', ['secret', 'put', name], {
      cwd,
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: true
    });

    // Write the secret value to stdin
    proc.stdin.write(value);
    proc.stdin.end();

    // Wait for the process to complete
    await new Promise((resolve, reject) => {
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to upload ${name} (exit code ${code})`));
        }
      });
      proc.on('error', reject);
    });

    console.log(`   ✅ ${name} uploaded successfully`);
  } catch (error) {
    throw new Error(`Failed to upload ${name}: ${error.message}`);
  }
}

// Parse .env file
function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const secrets = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE
    const match = trimmed.match(/^([A-Z_]+)=(.+)$/);
    if (match) {
      const [, key, value] = match;
      secrets[key] = value;
    }
  }

  return secrets;
}

async function main() {
  console.log('🔐 Uploading Secrets to Cloudflare...');
  console.log('═'.repeat(60));

  const adminDir = './admin';
  const prodEnvPath = join(adminDir, '.env');
  const localEnvPath = join(adminDir, '.env.local');

  // Determine which file to use
  let secretsPath;
  let environment;

  if (existsSync(prodEnvPath)) {
    secretsPath = prodEnvPath;
    environment = 'production';
    console.log('\n✅ Found .env - using PRODUCTION secrets');
  } else if (existsSync(localEnvPath)) {
    secretsPath = localEnvPath;
    environment = 'development';
    console.log('\n⚠️  Using .env.local (development secrets)');
    console.log('   💡 For production, create .env with production BASE_URL');
  } else {
    console.error('❌ No secrets file found!');
    console.error('   Expected either:');
    console.error('   - .env (recommended for deployment)');
    console.error('   - .env.local (fallback)');
    process.exit(1);
  }

  try {
    // Parse secrets from chosen file
    console.log(`\n📖 Reading secrets from ${secretsPath.split('/').pop()}...`);
    const secrets = parseEnvFile(secretsPath);

    const secretKeys = Object.keys(secrets);
    if (secretKeys.length === 0) {
      console.log('⚠️  No secrets found in file');
      return;
    }

    console.log(`   Found ${secretKeys.length} secrets: ${secretKeys.join(', ')}`);

    // Warn if using localhost BASE_URL for production
    if (secrets.BASE_URL && secrets.BASE_URL.includes('localhost')) {
      console.log('\n⚠️  WARNING: BASE_URL contains localhost!');
      console.log('   This will break OAuth in production.');
      console.log('   💡 Create .env with production BASE_URL');
    } else if (secrets.BASE_URL) {
      console.log(`\n✅ BASE_URL: ${secrets.BASE_URL}`);
    }

    // Upload each secret
    console.log('\n🚀 Uploading secrets to Cloudflare...');
    for (const [key, value] of Object.entries(secrets)) {
      await uploadSecret(key, value, adminDir);
    }

    console.log('\n═'.repeat(60));
    console.log('✅ All secrets uploaded successfully!');

  } catch (error) {
    console.error('\n❌ Secret upload failed:', error.message);
    console.error('\nPlease check your .env file and try again.');
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

// Run upload
main();
