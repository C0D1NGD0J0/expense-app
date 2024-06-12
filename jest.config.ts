import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  automock: false,
  clearMocks: true,
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  testMatch: ['<rootDir>/server/__tests__/**/*.[jt]s?(x)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  forceExit: true,
  detectOpenHandles: true,
  testPathIgnorePatterns: ['./node_modules'],
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.ts'],
  moduleNameMapper: {
    '@db/(.*)': ['<rootDir>/server/db/$1'],
    '@services/(.*)': ['<rootDir>/server/services/$1'],
    '@utils/(.*)': ['<rootDir>/server/utils/$1'],
    '@graphql/(.*)': ['<rootDir>/server/graphql/$1'],
    '@root/(.*)': ['<rootDir>/$1'],
  },
  collectCoverageFrom: ['<rootDir>/server/**/*.ts', '!**/node_modules/**', '!server/__tests__/**/*.ts?(x)'],
  coverageReporters: ['text-summary', 'lcov'],
};

export default config;
