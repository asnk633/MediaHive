// src/__tests__/setup-textencoder.ts
// Setup file for Jest tests

// Polyfill TextEncoder and TextDecoder for older Node.js versions
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill fetch for jsdom environment
if (!global.fetch) {
  // @ts-ignore
  global.fetch = require('node-fetch');
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Import EventSource polyfill
require('event-source-polyfill');