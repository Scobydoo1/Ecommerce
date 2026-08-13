import base from '@ecommerce/config/eslint';

export default [
  ...base,
  {
    rules: {
      // NestJS dung decorator metadata nen interface rong la hop le trong DTO.
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
];
