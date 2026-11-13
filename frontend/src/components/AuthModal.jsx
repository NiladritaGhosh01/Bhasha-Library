import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, t, langMode }) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, isFirebaseConfigured } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-glass-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose} aria-label="Close">✕</button>

        <div className="auth-header">
          <div className="auth-icon-ring">✨</div>
          <h3>{isSignUp ? (langMode === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account') : (langMode === 'bn' ? 'লগইন করুন' : 'Sign in to Bhasha')}</h3>
          <p className="auth-sub">
            {langMode === 'bn' 
              ? 'ফায়ারবেস অথেন্টিকেশন দিয়ে আপনার দ্বিভাষিক গল্প সংগ্রহ সংরক্ষণ করুন।' 
              : 'Save and synchronize your bilingual creations with Firebase.'}
          </p>
        </div>

        {errorMsg && <div className="auth-error-box">{errorMsg}</div>}

        {/* Google Sign In */}
        <button className="google-auth-btn" onClick={handleGoogleSignIn} disabled={isLoading}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{langMode === 'bn' ? 'গুগল দিয়ে চালিয়ে যান' : 'Continue with Google'}</span>
        </button>

        <div className="auth-separator">
          <span>{langMode === 'bn' ? 'অথবা' : 'or'}</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="auth-form">
          <input
            type="email"
            placeholder={langMode === 'bn' ? 'আপনার ইমেইল' : 'Email address'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={langMode === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading 
              ? '...' 
              : isSignUp 
                ? (langMode === 'bn' ? 'অ্যাকাউন্ট তৈরি' : 'Create Account') 
                : (langMode === 'bn' ? 'প্রবেশ করুন' : 'Sign In')}
          </button>
        </form>

        <div className="auth-footer-toggle">
          <span>{isSignUp ? (langMode === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?') : (langMode === 'bn' ? 'নতুন ব্যবহারকারী?' : 'Need an account?')}</span>
          <button type="button" className="auth-toggle-btn" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? (langMode === 'bn' ? 'লগইন' : 'Sign In') : (langMode === 'bn' ? 'রেজিস্টার' : 'Sign Up')}
          </button>
        </div>
      </div>
    </div>
  );
}
