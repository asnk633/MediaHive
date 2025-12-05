// Mock firebase auth file for build purposes
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Mock Firebase configuration - using valid format to avoid initialization errors
const firebaseConfig = {
  apiKey: "AIzaSyBb79Z0H0Z0H0Z0H0Z0H0Z0H0Z0H0Z0H0Z0",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project-id",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth and firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);