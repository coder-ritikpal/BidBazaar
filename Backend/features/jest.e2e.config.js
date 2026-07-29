import base from "../test-config/jest.base.js";

export default {
  ...base,
  displayName: "features-e2e",
  rootDir: ".",
  testMatch: ["<rootDir>/__tests__/e2e/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  // This is crucial to prevent race conditions between test files using the same DB setup.
//   maxWorkers: 1,
};