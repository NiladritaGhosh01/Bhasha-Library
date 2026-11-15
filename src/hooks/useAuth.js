import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut } from '../services/firebaseConfig';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return { 
    currentUser, 
    user: currentUser, 
    isAuthenticated: Boolean(currentUser), 
    loading, 
    logout 
  };
}
