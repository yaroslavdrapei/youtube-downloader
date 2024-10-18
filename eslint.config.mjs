import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  { 
    files: ['**/*.{js,mjs,cjs,ts}'] 
  },
  { 
    languageOptions: { 
      globals: {
        ...globals.node, 
        NodeJS: true
      },
    } 
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {    
    rules: {
      'semi': 'error',
      'no-undef': 'error',
      '@typescript-eslint/no-unused-vars': 'warn',
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-member-accessibility": "error",
    }
  }
];
