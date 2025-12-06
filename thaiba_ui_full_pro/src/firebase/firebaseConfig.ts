// Use Vite environment variables
// Copy .env.example to .env.local and fill in your values
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'FAKE-API-KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fake.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fake-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fake.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:fakekey'
};

console.log('DEBUG: Firebase Config Loaded', {
  apiKey: firebaseConfig.apiKey === 'FAKE-API-KEY' ? 'FAKE' : 'SET (' + firebaseConfig.apiKey.slice(0, 5) + '...)',
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});
