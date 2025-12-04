module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(t|j)sx?$": ["@swc/jest"]
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    testPathIgnorePatterns: [
        "/node_modules/",
        "/e2e/",
        "/tests.archived/",
        "/playwright.archived/",
        "/thaiba_ui_full_lite/",
        "/thaiba_ui_full_heavy/",
        "/thaiba_ui_full_pro/",
        "/src/__tests__/test-utils.tsx"
    ],
    // Map import aliases to relative paths
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^@/firebase/(.*)$": "<rootDir>/src/lib/$1",
        "^@/contexts/(.*)$": "<rootDir>/src/contexts/$1",
        "^@/db(.*)$": "<rootDir>/src/db$1"
    },
    // Ignore node_modules except when necessary
    transformIgnorePatterns: [
        "/node_modules/(?!(@firebase|@testing-library)/)"
    ],
    testTimeout: 20000
};
