import '@testing-library/jest-dom';
import React from 'react';

// Silence some console noise from tests (optional)
const orig = console.error;
beforeAll(() => {
  // keep it, but you can filter when necessary
});
afterAll(() => {
  console.error = orig;
});

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, whileTap, transition, ...validProps } = props;
        return <div ref={ref} {...validProps}>{children}</div>;
      }),
      ul: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, whileTap, transition, ...validProps } = props;
        return <ul ref={ref} {...validProps}>{children}</ul>;
      }),
      li: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, whileTap, transition, ...validProps } = props;
        return <li ref={ref} {...validProps}>{children}</li>;
      }),
      aside: React.forwardRef(({ children, ...props }: any, ref: any) => {
        const { initial, animate, exit, whileTap, transition, ...validProps } = props;
        return <aside ref={ref} {...validProps}>{children}</aside>;
      }),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => { };
  }),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  onSnapshot: jest.fn(() => () => { }),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
}));

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

jest.mock('@/firebase/auth', () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock('@/firebase/roles', () => ({
  getUserRole: jest.fn().mockResolvedValue({ role: 'guest', tags: [] }),
  setUserRole: jest.fn(),
}));
