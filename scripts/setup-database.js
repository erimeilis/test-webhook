#!/usr/bin/env node

/**
 * Database Setup Script
 * Applies all migrations to local D1 database
 *
 * Usage: npm run db:setup
 *
 * This runs during initial setup (npm run setup) to create all required tables
 */

import { spawn } from 'child_process';
import { readdirSync } from 'fs';
import { join } from 'path';

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
  console.log('🗄️  Setting up local database...');
  console.log('═'.repeat(60));

  try {
    // Get all migration files in order
    const migrationsDir = './migrations';
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found in', migrationsDir);
      return;
    }

    console.log(`\n📋 Found ${migrationFiles.length} migration(s):`);
    migrationFiles.forEach(f => console.log(`   - ${f}`));

    // Apply each migration
    console.log('\n🚀 Applying migrations...\n');
    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      console.log(`   Applying: ${file}`);

      await runCommand('wrangler', [
        'd1', 'execute', 'test-webhook',
        '--local',
        '--persist-to', './.wrangler-shared',
        `--file=${filePath}`
      ]);
    }

    console.log('\n✅ All migrations applied successfully!');
    console.log('═'.repeat(60));
    console.log('\n💡 Database is ready. You can now run: npm run dev');

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    console.error('\nPlease fix the errors above and try again.');
    process.exit(1);
  }
}

// Run setup
main();
