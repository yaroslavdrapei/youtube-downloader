import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  {
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        Buffer: 'readonly',
      },
    },
  },
  pluginJs.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      semi: 'error',
      'no-undef': 'error',
    },
  },
];
