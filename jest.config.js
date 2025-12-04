module.exports = {
  testEnvironment: "jest-environment-jsdom",
  // keep whatever transforms / moduleNameMapper you already have
  transform: { "^.+\.(t|j)sx?$": ["@swc/jest"] },
  moduleFileExtensions: ["ts","tsx","js","jsx","json","node"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup-textencoder.ts"],
  // Map import aliases to relative paths
  moduleNameMapper: {
    "^@/firebase/auth$": "<rootDir>/__mocks__/@firebase/auth.ts",
    "^@/firebase/roles$": "<rootDir>/__mocks__/@firebase/roles.ts",
    "^@/contexts/AuthContext$": "<rootDir>/__mocks__/authContextMock.ts",
    "^@/app/\$shell\$/RoleContext$": "<rootDir>/__mocks__/@app/(shell)/RoleContext.tsx",
    "^@/firebase/(.*)$": "<rootDir>/src/lib/$1",
    "^@/contexts/(.*)$": "<rootDir>/src/contexts/$1",
    "^@/db(.*)$": "<rootDir>/src/db$1",
    "^@/(.*)$": "<rootDir>/src/$1"
  }
};
