import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        HTMLElement: 'readonly',
        HTMLFormElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLSelectElement: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        Element: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        Error: 'readonly',
        Date: 'readonly',
        JSON: 'readonly',
        Map: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        crypto: 'readonly',
        React: 'readonly',
        D1Database: 'readonly',
        KVNamespace: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': react,
      'react-hooks': reactHooks
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      'no-async-promise-executor': 'off',
      'react/no-unescaped-entities': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }
]
