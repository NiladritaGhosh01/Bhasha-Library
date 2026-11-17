import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { auth, onAuthStateChanged, signOut as firebaseSignOut } from '../services/firebaseConfig';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Normalizes Supabase user to maintain consistent fields (email, uid, displayName)
    const normalizeSupabaseUser = (sbUser, sbSession) => {
      if (!sbUser) return null;
      return {
        ...sbUser,
        uid: sbUser.id,
        displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0],
        email: sbUser.email,
        isSupabase: true,
        session: sbSession
      };
    };

    let supabaseSubscription = null;

    // 1. Initial check & listener for Supabase authentication
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (!error && initialSession?.user) {
          setSession(initialSession);
          setCurrentUser(normalizeSupabaseUser(initialSession.user, initialSession));
        }
        setLoading(false);
      }).catch((err) => {
        console.warn('Supabase getSession notice:', err);
        if (isMounted) setLoading(false);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        if (newSession?.user) {
          setCurrentUser(normalizeSupabaseUser(newSession.user, newSession));
          setLoading(false);
        } else if (!auth.currentUser) {
          setCurrentUser(null);
          setLoading(false);
        }
      });
      supabaseSubscription = data?.subscription;
    }

    // 2. Firebase authentication listener (dual compatibility)
    const unsubscribeFirebase = onAuthStateChanged(auth, (fbUser) => {
      if (!isMounted) return;
      if (fbUser) {
        setCurrentUser(fbUser);
        setLoading(false);
      } else {
        // If Firebase logs out, keep Supabase user if active, otherwise set null
        setCurrentUser((prev) => {
          if (prev?.isSupabase) return prev;
          return null;
        });
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (supabaseSubscription) {
        supabaseSubscription.unsubscribe();
      }
      unsubscribeFirebase();
    };
  }, []);

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.warn('Supabase sign out error:', error);
    }

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.warn('Firebase sign out error:', error);
    }

    setCurrentUser(null);
    setSession(null);
  };

  return { 
    currentUser, 
    user: currentUser, 
    session,
    isAuthenticated: Boolean(currentUser), 
    loading, 
    logout 
  };
}
