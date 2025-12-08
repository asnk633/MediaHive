import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { firebaseConfig } from './firebaseConfig';

// Initialize with Compat SDK
// Check existing apps to avoid duplicates
const app = firebase.apps.length > 0 ? firebase.app() : firebase.initializeApp(firebaseConfig);

export const auth = app.auth();
export const db = app.firestore();

// --- Auth Polyfills for V9 Style Usage ---
// This allows us to keep the consuming code mostly the same, 
// just changing the import source.

export const onAuthStateChanged = (
    authInstance: firebase.auth.Auth,
    nextOrObserver: (user: firebase.User | null) => void,
    error?: (error: Error) => void
) => {
    return authInstance.onAuthStateChanged(nextOrObserver, error);
};

export const signInWithEmailAndPassword = (authInstance: firebase.auth.Auth, email: string, pass: string) => {
    return authInstance.signInWithEmailAndPassword(email, pass);
};

export const createUserWithEmailAndPassword = (authInstance: firebase.auth.Auth, email: string, pass: string) => {
    return authInstance.createUserWithEmailAndPassword(email, pass);
};

export const signOut = (authInstance: firebase.auth.Auth) => {
    return authInstance.signOut();
};

export const sendPasswordResetEmail = (authInstance: firebase.auth.Auth, email: string) => {
    return authInstance.sendPasswordResetEmail(email);
};

// Re-export types if needed, but usually we can use internal types or any
export type User = firebase.User;
