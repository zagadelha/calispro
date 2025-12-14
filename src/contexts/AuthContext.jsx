import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, googleProvider, db, storage } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sign up with email and password
    const signup = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: name,
            email: email,
            created_at: new Date().toISOString(),
            profile_completed: false
        });

        return userCredential;
    };

    // Sign in with email and password
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // Sign in with Google
    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);

        // Check if user profile exists, if not create one
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
                name: result.user.displayName,
                email: result.user.email,
                created_at: new Date().toISOString(),
                profile_completed: false
            });
        }

        return result;
    };

    // Sign out
    const logout = () => {
        return signOut(auth);
    };

    // Load user profile from Firestore
    const loadUserProfile = async (uid) => {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            setUserProfile(userDoc.data());
        }
    };

    // Update user profile
    const updateUserProfile = async (uid, data) => {
        await setDoc(doc(db, 'users', uid), data, { merge: true });
        setUserProfile(prev => ({ ...prev, ...data }));
    };

    // Upload profile photo
    const uploadProfilePhoto = async (uid, file) => {
        try {
            // Create a reference to the storage location
            const storageRef = ref(storage, `profile_photos/${uid}`);

            // Upload the file
            await uploadBytes(storageRef, file);

            // Get the download URL
            const photoURL = await getDownloadURL(storageRef);

            // Update user profile with the photo URL
            await updateUserProfile(uid, { photoURL });

            return photoURL;
        } catch (error) {
            console.error('Error uploading photo:', error);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                await loadUserProfile(user.uid);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userProfile,
        signup,
        login,
        loginWithGoogle,
        logout,
        updateUserProfile,
        loadUserProfile,
        uploadProfilePhoto
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
