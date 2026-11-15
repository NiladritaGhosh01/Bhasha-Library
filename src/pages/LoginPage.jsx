import React, { useState } from 'react';
import { ART_ASSETS } from '../assets/artAssets';
import { 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  updateProfile 
} from '../services/firebaseConfig';
import { useAuth } from '../hooks/useAuth';

export function LoginPage({ onNavigate, onLoginSuccess }) {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('reader');
  const [statusMessage, setStatusMessage] = useState(null);

  // Form states
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (activeTab === 'signin') {
        const userCredential = await signInWithEmailAndPassword(auth, signinEmail.trim(), signinPassword);
        const displayName = userCredential.user.displayName || userCredential.user.email;
        setStatusMessage({
          type: 'success',
          text: `Cipher validated. Welcome to the Sanctuary, ${displayName}!`
        });

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(selectedRole);
          } else {
            onNavigate(selectedRole === 'author' ? 'author-fellowship' : 'reader-sanctuary');
          }
        }, 700);
      } else {
        if (regPassword.length < 6) {
          setIsSubmitting(false);
          setStatusMessage({
            type: 'error',
            text: 'Password must be at least 6 characters in length.'
          });
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
        if (regName.trim()) {
          try {
            await updateProfile(userCredential.user, { displayName: regName.trim() });
          } catch {
            // non-fatal profile name update
          }
        }

        setStatusMessage({
          type: 'success',
          text: 'Guild charter inscribed. Welcome to the fellowship!'
        });

        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(selectedRole);
          } else {
            onNavigate(selectedRole === 'author' ? 'author-fellowship' : 'reader-sanctuary');
          }
        }, 700);
      }
    } catch (err) {
      let errorText = 'Authentication failed. Please verify your details.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorText = 'Invalid email or password. Please verify credentials or register.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorText = 'This email is already inscribed. Please switch to Sign In.';
      } else if (err.code === 'auth/weak-password') {
        errorText = 'Password cipher too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorText = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorText = 'Too many attempts. Access temporarily paused for security.';
      } else if (err.message) {
        errorText = err.message;
      }
      setStatusMessage({ type: 'error', text: errorText });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFederatedSeal = async (provider) => {
    const key = provider.toLowerCase();
    setStatusMessage(null);

    if (key.includes('google')) {
      setIsSubmitting(true);
      setStatusMessage({
        type: 'success',
        text: 'Opening Google Authentication Seal...'
      });

      try {
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
            onNavigate(selectedRole === 'author' ? 'author-fellowship' : 'reader-sanctuary');
          }
        }, 700);
      } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
          let errorMsg = err.message || 'Google authentication was not completed.';
          if (err.code === 'auth/unauthorized-domain') {
            errorMsg = 'This domain is not authorized for sign-in. Please check your domain authorization settings.';
          }
          setStatusMessage({ type: 'error', text: errorMsg });
        } else {
          setStatusMessage(null);
        }
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
              <button type="button" className="link-action-btn" onClick={() => onNavigate('reader-sanctuary')}>
                Open Reader Sanctuary →
              </button>
              <button type="button" className="link-action-btn" onClick={() => onNavigate('author-fellowship')}>
                Open Author Studio →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
