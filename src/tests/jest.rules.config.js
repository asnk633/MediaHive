const path = require('path');

module.exports = {
    rootDir: path.resolve(__dirname, '../../'),
    testEnvironment: "node",
    transform: {
        "^.+\\.(t|j)sx?$": ["@swc/jest"]
    },
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1"
    },
    testMatch: [
        "<rootDir>/src/tests/notificationRules.test.ts"
    ],
};
