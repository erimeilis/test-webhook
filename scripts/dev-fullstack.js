#!/usr/bin/env node

/**
 * Full-Stack Development Script
 * Runs both admin and webhook workers simultaneously with shared database
 *
 * Usage: npm run dev
 *
 * Ports:
 * - Admin Worker: http://localhost:5173
 * - Webhook Worker: http://localhost:5174
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

const PORTS = {
  admin: 5173,
  webhook: 5174
};

// Kill any existing processes on our ports
function killExistingProcesses() {
  console.log('🔄 Checking for existing processes on ports 5173 and 5174...');

  const killPort = (port, name) => {
    try {
      const lsofProcess = spawn('lsof', [`-ti:${port}`], { stdio: 'pipe' });

      lsofProcess.stdout.on('data', (data) => {
        const pids = data.toString().trim().split('\n').filter(pid => pid);
        if (pids.length > 0) {
          pids.forEach(pid => {
            console.log(`   Killing ${name} process ${pid} on port ${port}`);
            try {
              spawn('kill', ['-9', pid], { stdio: 'inherit' });
            } catch (e) {
              // Process might already be dead
            }
          });
        }
      });

      lsofProcess.on('close', () => {
        // Continue regardless
      });
    } catch (e) {
      // Port not in use, continue
    }
  };

  killPort(PORTS.admin, 'admin worker');
  killPort(PORTS.webhook, 'webhook worker');

  // Wait a moment for processes to die
  setTimeout(startServices, 1500);
}

// Start both services
function startServices() {
  console.log('🚀 Starting Webhook System Development Environment...');
  console.log('');
  console.log('📡 Admin Worker: http://localhost:5173');
  console.log('📡 Webhook Worker: http://localhost:5174');
  console.log('🗄️  Shared D1 Database: .wrangler-shared/');
  console.log('');
  console.log('Press Ctrl+C to stop both services');
  console.log('─'.repeat(60));

  // Start admin worker
  console.log('🎨 Starting admin worker...');
  const admin = spawn('npm', ['run', 'dev'], {
    cwd: './admin',
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });

  admin.stdout.on('data', (data) => {
    process.stdout.write(`[ADMIN] ${data}`);
  });

  admin.stderr.on('data', (data) => {
    process.stderr.write(`[ADMIN] ${data}`);
  });

  // Start webhook worker after a short delay
  setTimeout(() => {
    console.log('⚡ Starting webhook worker...');
    const webhook = spawn('wrangler', ['dev', '--port', '5174', '--local', '--persist-to', '../.wrangler-shared'], {
      cwd: './webhook-worker',
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    webhook.stdout.on('data', (data) => {
      process.stdout.write(`[WEBHOOK] ${data}`);
    });

    webhook.stderr.on('data', (data) => {
      process.stderr.write(`[WEBHOOK] ${data}`);
    });

    // Handle process cleanup
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down services...');
      admin.kill('SIGTERM');
      webhook.kill('SIGTERM');
      setTimeout(() => process.exit(0), 1000);
    });

    admin.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`❌ Admin worker exited with code ${code}`);
      }
      webhook.kill('SIGTERM');
      setTimeout(() => process.exit(code || 0), 500);
    });

    webhook.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`❌ Webhook worker exited with code ${code}`);
      }
      admin.kill('SIGTERM');
      setTimeout(() => process.exit(code || 0), 500);
    });
  }, 2000);
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

// Start the process
killExistingProcesses();
