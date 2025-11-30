/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '../..',
    testMatch: [
        '<rootDir>/tests/unit/**/*.test.ts',
        '<rootDir>/tests/integration/**/*.test.ts',
        '<rootDir>/tests/security/**/*.test.ts'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1'
    },
    collectCoverageFrom: [
        'lib/**/*.{ts,tsx}',
        'app/api/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
    testTimeout: 10000,
    verbose: true
};
