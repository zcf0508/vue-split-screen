import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: true,
  vue: true,
  stylistic: {
    quotes: 'single',
    semi: true,
  },
  ignores: [
    '**/dist',
    '**/node_modules',
    '**/coverage',
    'playground/src/auto-import.d.ts',
    'playground/src/components.d.ts',
  ],
}, {
  files: ['**/*.ts', '**/*.vue'],
  rules: {
    'no-console': 'warn',
    'unused-imports/no-unused-vars': ['warn', {
      args: 'after-used',
      argsIgnorePattern: '^_',
      vars: 'all',
      varsIgnorePattern: '^_',
    }],
    'vue/html-self-closing': 'off',
    'vue/max-attributes-per-line': ['error', {
      singleline: { max: 3 },
      multiline: { max: 1 },
    }],
    'vue/multi-word-component-names': 'off',
  },
}, {
  files: ['test/**/*.ts'],
  rules: {
    'no-console': 'off',
  },
}, {
  ignores: ['playground/public/**/*'],
});
