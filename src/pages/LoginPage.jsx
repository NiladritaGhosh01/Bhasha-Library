import React, { useState, useEffect } from 'react';
import { ART_ASSETS } from '../assets/artAssets';
import { supabase, isSupabaseConfigured, getOAuthRedirectUrl } from '../services/supabaseClient';
import { 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';

function getInitialOAuthError() {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const hashStr = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    const hashParams = new URLSearchParams(hashStr);

    const errDesc = searchParams.get('error_description') || hashParams.get('error_description');
    const errCode = searchParams.get('error') || hashParams.get('error');

    if (errCode || errDesc) {
      const message = decodeURIComponent(errDesc || errCode || 'Authentication was cancelled or failed.');
      console.error('OAuth callback error detected:', { code: errCode, description: errDesc });
      // Clean up URL parameters so errors do not persist in address bar
      window.history.replaceState(null, '', `${window.location.origin}/#login`);
      return {
        type: 'error',
        text: `Authentication failed: ${message}`
      };
    }
  } catch (e) {
    console.warn('Notice parsing OAuth URL parameters:', e);
  }
  return null;
}

export function LoginPage({ onNavigate, onLoginSuccess }) {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('reader');
  const [statusMessage, setStatusMessage] = useState(getInitialOAuthError);

  // Form states
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // If user becomes authenticated (e.g. via OAuth redirect callback)
  useEffect(() => {
    if (currentUser) {
      const dest = sessionStorage.getItem('oauth_destination') || 'home';
      sessionStorage.removeItem('oauth_destination');
      sessionStorage.removeItem('oauth_intended_role');
      const timer = setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(selectedRole);
        } else {
          onNavigate(dest);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentUser, onLoginSuccess, onNavigate, selectedRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    const email = (activeTab === 'signin' ? signinEmail : regEmail).trim();
    const password = activeTab === 'signin' ? signinPassword : regPassword;

    // Form validation: non-empty email, password min 6 chars
    if (!email) {
      setIsSubmitting(false);
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid email address.'
      });
      return;
    }

    if (!password || password.length < 6) {
      setIsSubmitting(false);
      setStatusMessage({
        type: 'error',
        text: 'Password must be at least 6 characters in length.'
      });
      return;
    }

    try {
      if (activeTab === 'signin') {
        let authSuccess = false;
        let displayName = email.split('@')[0];

        // 1. Attempt Supabase authentication if configured
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (!error && data?.user) {
            authSuccess = true;
            displayName = data.user.user_metadata?.full_name || data.user.email || displayName;
          } else if (error) {
            const errStr = (error.message || '').toLowerCase();
            // Smart Fallback: If user not registered yet, attempt automatic sign up
            if (errStr.includes('invalid login credentials') || errStr.includes('user not found')) {
              const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password
              });

              if (!signUpError && signUpData?.user) {
                if (signUpData.session) {
                  authSuccess = true;
                  displayName = signUpData.user.email || displayName;
                  setStatusMessage({
                    type: 'success',
                    text: `New chamber inscribed and seal validated! Welcome to Bhasha Library, ${displayName}!`
                  });
                } else {
                  // Confirmation email required by Supabase settings
                  setStatusMessage({
                    type: 'success',
                    text: 'Account inscribed! Please check your email inbox to confirm your registration.'
                  });
                  setIsSubmitting(false);
                  return;
                }
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }
        } else {
          // Fallback to Firebase authentication
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          authSuccess = true;
          displayName = userCredential.user.displayName || userCredential.user.email || displayName;
        }

        if (authSuccess) {
          setStatusMessage({
            type: 'success',
            text: `Cipher validated. Welcome to the Sanctuary, ${displayName}!`
          });

          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess(selectedRole);
            } else {
              onNavigate('home');
            }
          }, 700);
        }
      } else {
        // Register Tab
        let regSuccess = false;
        const regDisplayName = regName.trim() || email.split('@')[0];

        if (isSupabaseConfigured) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: regDisplayName,
                role: selectedRole
              }
            }
          });

          if (error) {
            throw error;
          }

          if (data?.session) {
            regSuccess = true;
            setStatusMessage({
              type: 'success',
              text: 'Guild charter inscribed. Welcome to the fellowship!'
            });
          } else if (data?.user) {
            setStatusMessage({
              type: 'success',
              text: 'Guild charter inscribed. Please check your email to confirm your account.'
            });
            setIsSubmitting(false);
            return;
          }
        } else {
          // Fallback to Firebase registration
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          if (regName.trim()) {
            try {
              await updateProfile(userCredential.user, { displayName: regName.trim() });
            } catch {
              // non-fatal
            }
          }
          regSuccess = true;
          setStatusMessage({
            type: 'success',
            text: 'Guild charter inscribed. Welcome to the fellowship!'
          });
        }

        if (regSuccess) {
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess(selectedRole);
            } else {
              onNavigate('home');
            }
          }, 700);
        }
      }
    } catch (err) {
      let errorText = 'Authentication failed. Please verify your credentials.';
      const msg = err.message || '';
      if (
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/user-not-found' || 
        msg.includes('Invalid login credentials')
      ) {
        errorText = 'Invalid email or password. Please verify credentials or switch to Register.';
      } else if (err.code === 'auth/email-already-in-use' || msg.includes('already registered')) {
        errorText = 'This email is already inscribed. Please switch to Sign In.';
      } else if (err.code === 'auth/weak-password' || msg.includes('weak') || msg.includes('at least 6 characters')) {
        errorText = 'Password cipher too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email' || msg.includes('invalid email')) {
        errorText = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests' || msg.includes('rate limit')) {
        errorText = 'Too many attempts. Access temporarily paused for security.';
      } else if (msg) {
        errorText = msg;
      }
      setStatusMessage({ type: 'error', text: errorText });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFederatedSeal = async (provider) => {
    const key = provider.toLowerCase();
    setStatusMessage(null);
    const redirectUrl = getOAuthRedirectUrl();

    if (key.includes('google')) {
      setIsSubmitting(true);
      setStatusMessage({
        type: 'success',
        text: 'Opening Google Authentication Seal...'
      });

      try {
        if (isSupabaseConfigured) {
          sessionStorage.setItem('oauth_intended_role', selectedRole);
          sessionStorage.setItem('oauth_destination', selectedRole === 'author' ? 'author-fellowship' : 'home');

          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: redirectUrl
            }
          });
          if (error) {
            console.error('Supabase Google OAuth error:', error);
            throw error;
          }
        } else {
          // Fallback to Firebase popup when Supabase credentials are not in .env
          const result = await signInWithPopup(auth, googleProvider);
          const name = result.user.displayName || result.user.email;
          setStatusMessage({
            type: 'success',
            text: `Inscribed with Google: Welcome, ${name}!`
          });

          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess(selectedRole);
            } else {
              onNavigate('home');
            }
          }, 700);
        }
      } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
          let errorMsg = err.message || 'Google authentication was not completed.';
          if (err.code === 'auth/unauthorized-domain') {
            errorMsg = 'This domain is not authorized for sign-in. Please check your domain authorization settings.';
          }
          console.error('Google sign-in error:', err);
          setStatusMessage({ type: 'error', text: errorMsg });
        } else {
          setStatusMessage(null);
        }
      } finally {
        setIsSubmitting(false);
      }
    } else if (key.includes('linkedin')) {
      setIsSubmitting(true);
      setStatusMessage({
        type: 'success',
        text: 'Opening LinkedIn Authentication Seal...'
      });

      try {
        if (isSupabaseConfigured) {
          sessionStorage.setItem('oauth_intended_role', selectedRole);
          sessionStorage.setItem('oauth_destination', selectedRole === 'author' ? 'author-fellowship' : 'home');

          let { error } = await supabase.auth.signInWithOAuth({
            provider: 'linkedin_oidc',
            options: {
              redirectTo: redirectUrl
            }
          });

          // Auto-fallback to legacy 'linkedin' provider if 'linkedin_oidc' is unrecognized
          if (error && (error.message?.toLowerCase().includes('provider') || error.status === 400)) {
            console.warn('Supabase linkedin_oidc notice, attempting legacy linkedin provider name...');
            const retry = await supabase.auth.signInWithOAuth({
              provider: 'linkedin',
              options: {
                redirectTo: redirectUrl
              }
            });
            error = retry.error;
          }

          if (error) {
            console.error('Supabase LinkedIn OAuth error:', error);
            throw error;
          }
        } else {
          setStatusMessage({
            type: 'error',
            text: 'LinkedIn sign-in requires Supabase OAuth configuration. Please add Supabase keys to your .env file.'
          });
        }
      } catch (err) {
        console.error('LinkedIn authentication error:', err);
        setStatusMessage({
          type: 'error',
          text: err.message || 'LinkedIn authentication could not be completed.'
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStatusMessage({
        type: 'error',
        text: `${provider} sign-in is not configured. Please use Google or Email/Password.`
      });
    }
  };
  return (
    <div className="login-page-wrapper">
      {/* Background Ambience */}
      <div className="login-backdrop-decorations" aria-hidden="true">
        <div className="decor-ornament decor-top-left">❦</div>
        <div className="decor-ornament decor-bottom-right">❧</div>
      </div>

      <header className="login-top-bar">
        <button
          type="button"
          className="btn-spring login-back-btn"
          onClick={() => onNavigate('home')}
        >
          <i className="fa-solid fa-arrow-left"></i>
          <span>Return to Sanctuary Home</span>
        </button>

        <div className="login-brand-pill" onClick={() => onNavigate('home')} role="button" tabIndex={0}>
          <img src={ART_ASSETS.bhashaLogo} alt="Bhasha Library Logo" className="brand-logo-small" />
          <span className="brand-name">Bhasha Library • ভাষা লাইব্রেরি</span>
        </div>
      </header>

      <main className="login-main-container">
        <div className="login-card-container">
          {/* Header */}
          <div className="login-card-header">
            <span className="login-sacred-kicker">Admission Chamber • প্রবেশদ্বার</span>
            <h1 className="login-card-title">Portals of Admission</h1>
            <p className="login-card-subtitle">
              গ্রন্থাগারের রুদ্ধদ্বার উন্মোচনে নিজের পরিচয় লিপিবদ্ধ করুন
            </p>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`login-status-banner ${statusMessage.type}`} role="alert">
              <i className="fa-solid fa-circle-check"></i>
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Signed In State or Admission Form */}
          {currentUser ? (
            <div className="login-signed-in-chamber" style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: 'var(--color-terracotta)' }}>
                <i className="fa-solid fa-scroll"></i>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', margin: '0 0 0.5rem', color: 'var(--color-on-surface)' }}>
                Seal Currently Inscribed
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-on-surface-muted)', margin: '0 0 1.5rem' }}>
                Active Session: <strong>{currentUser.displayName || currentUser.email}</strong>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-spring login-submit-btn"
                  onClick={() => onNavigate('reader-sanctuary')}
                >
                  Enter Reader Sanctuary →
                </button>
                <button
                  type="button"
                  className="btn-spring login-submit-btn"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', border: '1px solid var(--border-medium)' }}
                  onClick={() => onNavigate('author-fellowship')}
                >
                  Enter Author Studio →
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="btn-spring"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-cherry-maroon)',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: '6px' }}></i>
                  Sign Out of Sanctuary • প্রস্থান করুন
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="login-tabs" role="tablist" aria-label="Authentication Type">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'signin'}
                  className={`login-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('signin'); setStatusMessage(null); }}
                >
                  Sign In (প্রবেশ)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'register'}
                  className={`login-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                  onClick={() => { setActiveTab('register'); setStatusMessage(null); }}
                >
                  Register (নিবন্ধন)
                </button>
              </div>

              {/* Form */}
              <form className="login-form" onSubmit={handleSubmit}>
                {activeTab === 'signin' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pageSigninEmail">
                        Email Address
                      </label>
                      <input
                        id="pageSigninEmail"
                        name="username"
                        type="text"
                        autoComplete="username"
                        required
                        value={signinEmail}
                        onChange={(e) => setSigninEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <div className="form-label-row">
                        <label className="form-label" htmlFor="pageSigninPassword">
                          Password (পাসওয়ার্ড)
                        </label>
                        <button
                          type="button"
                          onClick={() => alert('A royal messenger owl will send your password reset talisman.')}
                          className="forgot-cipher-link"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <input
                        id="pageSigninPassword"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={signinPassword}
                        onChange={(e) => setSigninPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="form-input"
                      />
                    </div>

                    <div className="remember-me-row">
                      <label htmlFor="pageRememberMe" className="checkbox-label">
                        <input
                          id="pageRememberMe"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="form-checkbox"
                        />
                        <span>Keep seal inscribed (Remember Me)</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="pageRegName">
                        Honorary Pen Name (লেখক বা পাঠকের নাম)
                      </label>
                      <input
                        id="pageRegName"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Michael Madhusudan or বনলতা সেন"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="pageRegEmail">
                        Communication Email
                      </label>
                      <input
                        id="pageRegEmail"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="scribe@guild.com"
                        className="form-input"
                      />
                    </div>

                    <fieldset className="form-fieldset">
                      <legend className="form-legend">
                        Literary Role (আপনার ভূমিকা)
                      </legend>
                      <div className="role-options-grid">
                        <label className={`role-radio-card ${selectedRole === 'reader' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="guildRolePage"
                            value="reader"
                            checked={selectedRole === 'reader'}
                            onChange={() => setSelectedRole('reader')}
                          />
                          <span className="role-title">Reader</span>
                          <span className="role-sub-bengali">পাঠক</span>
                        </label>

                        <label className={`role-radio-card ${selectedRole === 'author' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="guildRolePage"
                            value="author"
                            checked={selectedRole === 'author'}
                            onChange={() => setSelectedRole('author')}
                          />
                          <span className="role-title">Author</span>
                          <span className="role-sub-bengali">লেখক</span>
                        </label>

                        <label className={`role-radio-card ${selectedRole === 'both' ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="guildRolePage"
                            value="both"
                            checked={selectedRole === 'both'}
                            onChange={() => setSelectedRole('both')}
                          />
                          <span className="role-title">Both</span>
                          <span className="role-sub-bengali">উভয়ই</span>
                        </label>
                      </div>
                    </fieldset>

                    <div className="form-group">
                      <label className="form-label" htmlFor="pageRegPassword">
                        Inscribe New Cipher (পাসওয়ার্ড)
                      </label>
                      <input
                        id="pageRegPassword"
                        name="new-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="form-input"
                      />
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <div className="form-submit-row">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-spring login-submit-btn"
                  >
                    {isSubmitting ? (
                      <span>Unlocking Parchment Seals...</span>
                    ) : (
                      <span>
                        {activeTab === 'signin'
                          ? 'Enter the Library • প্রবেশ করুন'
                          : 'Sign the Guild Charter • নিবন্ধন করুন'}
                      </span>
                    )}
                  </button>
                </div>

                {/* Federated Sign-in Options */}
                <div className="wax-seals-section">
                  <div className="wax-seals-divider-wrap">
                    <span className="wax-seals-line"></span>
                    <span className="wax-seals-label">or continue with manuscript seal</span>
                    <span className="wax-seals-line"></span>
                  </div>

                  <div className="wax-seals-row">
                    <button
                      type="button"
                      title="Inscribe with Google Manuscript"
                      className="btn-spring wax-seal-btn"
                      onClick={() => handleFederatedSeal('Google Manuscript')}
                    >
                      <i className="fa-brands fa-google" aria-hidden="true"></i>
                      <span>Google</span>
                    </button>
                    <button
                      type="button"
                      title="Inscribe with Apple Codex"
                      className="btn-spring wax-seal-btn"
                      onClick={() => handleFederatedSeal('Apple Codex')}
                    >
                      <i className="fa-brands fa-apple" aria-hidden="true"></i>
                      <span>Apple</span>
                    </button>
                    <button
                      type="button"
                      title="Inscribe with Linkedin"
                      className="btn-spring wax-seal-btn"
                      onClick={() => handleFederatedSeal('Linkedin')}
                    >
                      <i className="fa-brands fa-linkedin" aria-hidden="true"></i>
                      <span>Linkedin</span>
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {/* Quick Access Footnote */}
          <div className="login-card-footer">
            <p className="login-guarantee-text">
              Manuscripts and translations protected by historical preservation covenants.
            </p>
            <div className="login-direct-links">
              <span>Quick chamber entry without login:</span>
              <button 
                type="button" 
                className="link-action-btn" 
                onClick={() => {
                  if (!currentUser) {
                    setStatusMessage({
                      type: 'error',
                      text: 'Authentication required. Please sign in or register to enter Reader Sanctuary.'
                    });
                    return;
                  }
                  onNavigate('reader-sanctuary');
                }}
              >
                Open Reader Sanctuary →
              </button>
              <button 
                type="button" 
                className="link-action-btn" 
                onClick={() => {
                  if (!currentUser) {
                    setStatusMessage({
                      type: 'error',
                      text: 'Authentication required. Please sign in or register to enter Author Studio.'
                    });
                    return;
                  }
                  onNavigate('author-fellowship');
                }}
              >
                Open Author Studio →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
