import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'jsdom',
  testRegex: 'test/.*\\.spec\\.tsx?$',
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      { tsconfig: { jsx: 'react-jsx', esModuleInterop: true, module: 'commonjs' } },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@ecommerce/types$': '<rootDir>/../../packages/types/src',
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default config;
