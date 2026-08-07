// Backend/test-config/jest.base.js

export default {
    testEnvironment: "node",
    // Increased timeout to 2 minutes to allow for mongo-memory-server download
    testTimeout: 60000,


    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,

    

    collectCoverageFrom: [
        "src/**/*.js",
        "!src/index.js",
        "!src/server.js"
    ],

    coverageDirectory: "coverage",

    moduleFileExtensions: [
        "js",
        "json"
    ]
};