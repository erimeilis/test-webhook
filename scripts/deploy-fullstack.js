#!/usr/bin/env node

/**
 * Full-Stack Deployment Script
 * Deploys both admin and webhook workers to Cloudflare
 *
 * Usage: npm run deploy
 *
 * Pre-deployment checks:
 * - Type checking
 * - Linting
 * - Build validation
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

// Run a command and return a promise
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

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log('🚀 Starting Full-Stack Deployment...');
  console.log('═'.repeat(60));

  try {
    // Step 1: Type checking
    console.log('\n📝 Step 1/8: Running type check...');
    await runCommand('npm', ['run', 'type-check'], { cwd: './admin' });
    console.log('✅ Type check passed');

    // Step 2: Linting
    console.log('\n🔍 Step 2/8: Running linter...');
    await runCommand('npm', ['run', 'lint'], { cwd: './admin' });
    console.log('✅ Lint check passed');

    // Step 3: Build CSS
    console.log('\n🎨 Step 3/8: Building CSS...');
    await runCommand('npm', ['run', 'build:css'], { cwd: './admin' });
    console.log('✅ CSS built successfully');

    // Step 4: Build client
    console.log('\n📦 Step 4/8: Building client bundle...');
    await runCommand('npm', ['run', 'build:client'], { cwd: './admin' });
    console.log('✅ Client bundle built successfully');

    // Step 5: Apply database migrations
    console.log('\n🗄️  Step 5/8: Applying database migrations to production...');
    await runCommand('wrangler', ['d1', 'migrations', 'apply', 'test-webhook', '--remote'], { cwd: './admin' });
    console.log('✅ Database migrations applied successfully');

    // Step 6: Setup KV namespace
    console.log('\n🔑 Step 6/8: Setting up KV namespace...');
    await runCommand('node', ['scripts/setup-kv.js']);
    console.log('✅ KV namespace configured');

    // Step 7: Upload secrets
    console.log('\n🔐 Step 7/8: Uploading secrets...');
    await runCommand('node', ['scripts/upload-secrets.js']);
    console.log('✅ Secrets uploaded successfully');

    // Step 8: Deploy workers
    console.log('\n🚀 Step 8/8: Deploying workers...');

    // Deploy admin worker
    console.log('\n   📡 Deploying admin worker...');
    await runCommand('wrangler', ['deploy'], { cwd: './admin' });
    console.log('   ✅ Admin worker deployed');

    // Deploy webhook worker
    console.log('\n   ⚡ Deploying webhook worker...');
    await runCommand('wrangler', ['deploy'], { cwd: './webhook-worker' });
    console.log('   ✅ Webhook worker deployed');

    console.log('\n═'.repeat(60));
    console.log('🎉 Full-Stack Deployment Complete!');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Verify admin worker at your production domain');
    console.log('  2. Test authentication (Google OAuth + Email/Password)');
    console.log('  3. Test webhook ingestion endpoint');
    console.log('  4. Check Cloudflare dashboard for worker logs');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.error('\nPlease fix the errors above and try again.');
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

// Run deployment
main();
