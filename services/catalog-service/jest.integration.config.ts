import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: 'test/integration/.*\\.int-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@ecommerce/types$': '<rootDir>/../../packages/types/src',
  },
  // Testcontainers can thoi gian pull image va chay migration.
  testTimeout: 180_000,
};

export default config;
