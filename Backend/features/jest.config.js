import base from '../test-config/jest.base.js';

export default {
  ...base,
  displayName: 'features',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};