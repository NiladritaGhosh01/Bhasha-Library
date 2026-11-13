import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      // Mock demo user when live Firebase credentials aren't yet added
      const demoUser = {
        uid: 'demo-google-user',
        displayName: 'Niladrita Ghosh',
        email: 'niladrita@example.com',
        photoURL: null
      };
      setUser(demoUser);
      return demoUser;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Google Sign In Error:', err);
      throw err;
    }
  };

  const signInWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      const demoUser = {
        uid: 'demo-email-user',
        displayName: email.split('@')[0],
        email: email,
        photoURL: null
      };
      setUser(demoUser);
      return demoUser;
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signUpWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      const demoUser = {
        uid: 'demo-signup-user',
        displayName: email.split('@')[0],
        email: email,
        photoURL: null
      };
      setUser(demoUser);
      return demoUser;
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signOutUser = async () => {
    if (auth && isFirebaseConfigured) {
      await signOut(auth);
    }
    setUser(null);
  };

  const getIdToken = async () => {
    if (user && typeof user.getIdToken === 'function') {
      return await user.getIdToken();
    }
    return user ? 'mock-firebase-token' : null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        getIdToken,
        isFirebaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
