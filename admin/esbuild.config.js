import * as esbuild from 'esbuild'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

const isDev = process.env.NODE_ENV === 'development'
const isWatch = process.argv.includes('--watch')

// Copy static assets to dist
function copyAssets() {
  try {
    mkdirSync('dist', { recursive: true })
    copyFileSync('public/favicon.svg', 'dist/favicon.svg')
    console.log('✅ Static assets copied')
  } catch (err) {
    console.error('⚠️  Failed to copy static assets:', err.message)
  }
}

const buildOptions = {
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  outfile: 'dist/client.js',
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: !isDev,
  sourcemap: isDev,
  jsx: 'automatic',
  jsxImportSource: 'react',
  define: {
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  alias: {
    '@': resolve('./src'),
    '@shared': resolve('../shared'),
  },
  external: [],
  loader: {
    '.ts': 'tsx',
    '.tsx': 'tsx',
  },
}

if (isWatch) {
  // Watch mode for development
  const ctx = await esbuild.context(buildOptions)
  await ctx.watch()
  copyAssets()
  console.log('👀 Watching for changes...')
} else {
  // Single build
  await esbuild.build(buildOptions)
  copyAssets()
  console.log('✅ Client bundle built successfully')
}
