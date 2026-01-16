const path = require('path');

module.exports = {
  testEnvironment: "jsdom",
  // minimal global setup (TextEncoder, fetch polyfills)
  setupFiles: [
    "<rootDir>/src/tests/setup-globals.ts"
  ],
  setupFilesAfterEnv: [
    "<rootDir>/node_modules/@testing-library/jest-dom",
    "<rootDir>/src/tests/jest-setup.js"
  ],
  moduleNameMapper: {
    "^@/contexts/AuthContext$": "<rootDir>/src/__tests__/__mocks__/authContext.ts",
    "^@/services/canonicalDataService$": "<rootDir>/src/__tests__/__mocks__/canonicalDataService.ts",
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  // only run meaningful unit tests from src/__tests__/components
  testMatch: [
    "<rootDir>/src/__tests__/components/**/*.test.ts?(x)",
    "<rootDir>/src/__tests__/components/**/*.spec.ts?(x)",
    "<rootDir>/src/__tests__/unit/**/*.test.ts?(x)"
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/e2e/",
    "/playwright/",
    "/tests.archived/",
    "\\.bak_uid_"
  ],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", {
      jsc: {
        transform: {
          react: {
            runtime: "automatic"
          }
        }
      }
    }]
  },
  // allow transforming some ESM packages used during tests
  transformIgnorePatterns: [
    "/node_modules/(?!(firebase|@firebase|lit-html|lit-element)/)"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  verbose: false,
  testEnvironmentOptions: {
    url: "http://localhost/"
  }
};