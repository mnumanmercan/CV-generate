import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

const tsRecommendedRules = tsPlugin.configs.recommended.rules

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'packages/shared/dist/**',
      'server/dist/**',
      'server/prisma/migrations/**',
      'coverage/**',
      '*.local',
    ],
  },

  js.configs.recommended,

  ...vuePlugin.configs['flat/recommended'],

  {
    files: ['src/**/*.{ts,tsx,vue}', 'packages/shared/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.es2022 },
    },
  },

  {
    files: ['server/src/**/*.{ts,tsx}', 'server/tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
    },
  },

  {
    files: [
      '*.{js,cjs,mjs,ts}',
      '*.config.{js,cjs,mjs,ts}',
      'vite.config.ts',
      'tailwind.config.js',
      'postcss.config.cjs',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsRecommendedRules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsRecommendedRules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'vue/multi-word-component-names': ['error', { ignores: ['App'] }],
    },
  },

  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/**/__tests__/**'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest, vi: 'readonly' },
    },
  },

  prettierConfig,

  {
    files: ['**/*.{ts,tsx,vue,js,cjs,mjs}'],
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',
    },
  },
]
