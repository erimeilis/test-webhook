#!/usr/bin/env node

/**
 * Version Bump Script
 * Bumps version in all package.json files and Cargo.toml
 *
 * Usage:
 *   node scripts/bump-version.js patch   # 1.0.0 -> 1.0.1
 *   node scripts/bump-version.js minor   # 1.0.0 -> 1.1.0
 *   node scripts/bump-version.js major   # 1.0.0 -> 2.0.0
 *   node scripts/bump-version.js 1.2.3   # Set specific version
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = resolve(__dirname, '..')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green')
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number)
  return { major, minor, patch }
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`
}

function bumpVersion(version, type) {
  const parsed = parseVersion(version)

  switch (type) {
    case 'major':
      return formatVersion({ major: parsed.major + 1, minor: 0, patch: 0 })
    case 'minor':
      return formatVersion({ major: parsed.major, minor: parsed.minor + 1, patch: 0 })
    case 'patch':
      return formatVersion({ major: parsed.major, minor: parsed.minor, patch: parsed.patch + 1 })
    default:
      // Assume it's a specific version
      if (/^\d+\.\d+\.\d+$/.test(type)) {
        return type
      }
      throw new Error(`Invalid version type: ${type}. Use 'major', 'minor', 'patch', or a specific version like '1.2.3'`)
  }
}

function updatePackageJson(filePath, newVersion) {
  const content = readFileSync(filePath, 'utf-8')
  const pkg = JSON.parse(content)
  const oldVersion = pkg.version
  pkg.version = newVersion
  writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n')
  return oldVersion
}

function updateCargoToml(filePath, newVersion) {
  const content = readFileSync(filePath, 'utf-8')
  const versionMatch = content.match(/^version\s*=\s*"([^"]+)"/m)
  const oldVersion = versionMatch ? versionMatch[1] : 'unknown'
  const updated = content.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`)
  writeFileSync(filePath, updated)
  return oldVersion
}

function main() {
  const type = process.argv[2]

  if (!type) {
    console.log('Usage: node scripts/bump-version.js <patch|minor|major|x.x.x>')
    console.log('')
    console.log('Examples:')
    console.log('  node scripts/bump-version.js patch   # 1.0.0 -> 1.0.1')
    console.log('  node scripts/bump-version.js minor   # 1.0.0 -> 1.1.0')
    console.log('  node scripts/bump-version.js major   # 1.0.0 -> 2.0.0')
    console.log('  node scripts/bump-version.js 1.2.3   # Set specific version')
    process.exit(1)
  }

  // Read current version from root package.json
  const rootPkg = JSON.parse(readFileSync(resolve(ROOT_DIR, 'package.json'), 'utf-8'))
  const currentVersion = rootPkg.version

  // Calculate new version
  const newVersion = bumpVersion(currentVersion, type)

  log(`\n${colors.bright}Bumping version: ${currentVersion} → ${newVersion}${colors.reset}\n`, 'cyan')

  // Files to update
  const files = [
    { path: resolve(ROOT_DIR, 'package.json'), type: 'json' },
    { path: resolve(ROOT_DIR, 'admin/package.json'), type: 'json' },
    { path: resolve(ROOT_DIR, 'webhook-worker/Cargo.toml'), type: 'toml' },
  ]

  for (const file of files) {
    try {
      let oldVersion
      if (file.type === 'json') {
        oldVersion = updatePackageJson(file.path, newVersion)
      } else {
        oldVersion = updateCargoToml(file.path, newVersion)
      }
      const relativePath = file.path.replace(ROOT_DIR + '/', '')
      logSuccess(`${relativePath}: ${oldVersion} → ${newVersion}`)
    } catch (error) {
      console.error(`Failed to update ${file.path}:`, error.message)
      process.exit(1)
    }
  }

  log(`\n${colors.bright}Version bumped to ${newVersion}${colors.reset}\n`, 'green')
  console.log(`Next steps:`)
  console.log(`  git add .`)
  console.log(`  git commit -m "Release v${newVersion}"`)
  console.log(`  git tag v${newVersion}`)
  console.log(`  git push && git push --tags`)
}

main()
