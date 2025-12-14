import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
// TODO: Replace with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBlsL9WwVJGrvQttMrE9P069fEIkagkJkg",
    authDomain: "calisprogress.firebaseapp.com",
    projectId: "calisprogress",
    storageBucket: "calisprogress.firebasestorage.app",
    messagingSenderId: "1033880045088",
    appId: "1:1033880045088:web:f70ca6ed8db68eb80f5e45"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
