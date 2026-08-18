// payment
// /jest.config.js
import base from '../test-config/jest.base.js';

export default {
  ...base,
  displayName: 'payment',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/unit/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
};
