import base from '../test-config/jest.base.js';

export default {
  ...base,
  displayName: 'inventory',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/unit/**/*.test.js', ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};