// src/app/api/_lib/test-utils/asserts.ts
// Shared assertion utilities for tests

export function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
  }
}

export function assertTrue(actual: boolean, message: string) {
  assertEqual(actual, true, message);
}

export function assertFalse(actual: boolean, message: string) {
  assertEqual(actual, false, message);
}