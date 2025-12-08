// __mocks__/firebaseAuthMock.ts
// Mock for "@/firebase/auth" import

// Mock user object
export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  providerData: [],
  refreshToken: '',
  tenantId: null,
};

// Mock auth object
export const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: jest.fn(() => jest.fn()), // returns unsubscribe function
  signOut: jest.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: mockUser })),
};

// Mock functions
export const getAuth = jest.fn(() => mockAuth);
export const onAuthStateChanged = jest.fn((auth, callback) => {
  callback(mockUser);
  return jest.fn(); // unsubscribe function
});
export const signOut = jest.fn(() => Promise.resolve());
export const signInWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: mockUser }));
export const createUserWithEmailAndPassword = jest.fn(() => Promise.resolve({ user: mockUser }));

export default mockAuth;