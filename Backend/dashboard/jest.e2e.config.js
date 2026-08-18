// dashboard
// /jest.config.js
import base from '../test-config/jest.base.js';

export default {
  ...base,
  displayName: 'dashboard-e2e',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/e2e/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};
