import base from "../test-config/jest.base.js";

export default {
  ...base,
  displayName: "auth-e2e",
  rootDir: ".",
  testMatch: ["<rootDir>/e2e/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
};