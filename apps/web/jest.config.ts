import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  displayName: 'web',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@reci/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    '!**/*.d.ts',
  ],
}

export default createJestConfig(config)
