import * as esbuild from 'esbuild'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

const isDev = process.env.NODE_ENV === 'development'

await esbuild.build({
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
})

// Copy static assets to dist
try {
  mkdirSync('dist', { recursive: true })
  copyFileSync('public/favicon.svg', 'dist/favicon.svg')
  console.log('✅ Static assets copied')
} catch (err) {
  console.error('⚠️  Failed to copy static assets:', err.message)
}

console.log('✅ Client bundle built successfully')
