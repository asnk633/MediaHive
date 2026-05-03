// src/tests/setup-globals.ts
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill fetch for jsdom environment
if (typeof (global as any).fetch === 'undefined') {
  // Try to use whatwg-fetch first
  try {
    require('whatwg-fetch');
  } catch (e) {
    // Fallback to node-fetch
    const fetch = require('node-fetch');
    (global as any).fetch = fetch.default || fetch;
    (global as any).Headers = fetch.Headers;
    (global as any).Request = fetch.Request;
    (global as any).Response = fetch.Response;
  }
}

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}

require('event-source-polyfill');

export {};
