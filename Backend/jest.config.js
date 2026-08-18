// Backend/jest.config.js
export default {
  verbose: true,
  // Run all projects sequentially to avoid race conditions with shared resources.
  maxWorkers: 1,

  collectCoverage: false,
  projects: [
    '<rootDir>/auth/jest.config.js',
    '<rootDir>/auth/jest.e2e.config.js',

    '<rootDir>/inventory/jest.config.js',
    '<rootDir>/inventory/jest.e2e.config.js',
    
    '<rootDir>/features/jest.config.js',
    '<rootDir>/features/jest.e2e.config.js',

    '<rootDir>/cart/jest.config.js',
    '<rootDir>/cart/jest.e2e.config.js',

    '<rootDir>/dashboard/jest.config.js',
    '<rootDir>/dashboard/jest.e2e.config.js',

    '<rootDir>/payment/jest.config.js',
    '<rootDir>/payment/jest.e2e.config.js',
  ],
};
