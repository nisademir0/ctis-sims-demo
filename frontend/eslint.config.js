import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import noHardcodedTurkish from './eslint-rules/no-hardcoded-turkish.js'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'local-rules': {
        rules: {
          'no-hardcoded-turkish': noHardcodedTurkish,
        },
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      
      // Custom rule: Prevent hardcoded Turkish strings
      'local-rules/no-hardcoded-turkish': 'warn',
      
      // Additional i18n best practices
      'no-irregular-whitespace': 'error',
      
      // Warn on Turkish characters in JSX text (backup detection)
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'JSXText[value=/[çÇğĞıİöÖşŞüÜ]/]',
          message: 'Hardcoded Turkish text detected. Use t() for internationalization: t("category.key")',
        },
      ],
    },
  },
])
