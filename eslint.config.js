import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'scratch']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // These rules produce false positives for legitimate Three.js / R3F patterns:
      // - Math.random() inside useMemo is intentional (memoized, not re-run on render)
      // - Mutating Three.js uniforms inside useFrame is the canonical pattern
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      // Allow _-prefixed params like `_error` in getDerivedStateFromError
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
])
