module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/test'],
    testMatch: ['**/*.spec.ts'],
    coverageDirectory: 'coverage',
    setupFiles: ['<rootDir>/test/setup.ts'],
};
