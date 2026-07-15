// auth/jest.config.js
import base from '../test-config/jest.base.js';

export default {
  ...base,
  displayName: 'auth',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/**/*.test.js', ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};