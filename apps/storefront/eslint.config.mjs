import base from '@ecommerce/config/eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  ...base,
  {
    files: ['**/*.tsx', '**/*.ts'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      globals: { React: 'readonly' },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];
