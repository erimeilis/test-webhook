/**
 * Generate build info for version display
 * Creates a TypeScript file with version and build datetime
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read package.json for version
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
)

// Generate build info
const buildInfo = {
  version: packageJson.version,
  buildTime: new Date().toISOString(),
}

// Generate TypeScript file
const content = `/**
 * Build Information
 * Auto-generated at build time
 * DO NOT EDIT MANUALLY
 */

export const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)} as const
`

// Write to src/lib/build-info.ts
writeFileSync(join(__dirname, '../src/lib/build-info.ts'), content, 'utf-8')

console.log('✅ Build info generated:', buildInfo)
