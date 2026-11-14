import React, { useState } from 'react';
import { ART_ASSETS } from '../assets/artAssets';

export function LoginPage({ onNavigate, onLoginSuccess }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    setTimeout(() => {
      setIsSubmitting(false);
      setStatusMessage({
        type: 'success',
        text: activeTab === 'signin'
          ? 'Cipher validated. Admission granted to the Sanctuary.'
          : 'Guild charter inscribed. Welcome to the fellowship.'
      });

      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(selectedRole);
        } else {
          onNavigate(selectedRole === 'author' ? 'author-fellowship' : 'reader-sanctuary');
        }
      }, 700);
    }, 700);
  };

  const handleFederatedSeal = (provider) => {
    setStatusMessage({
      type: 'success',
      text: `Authenticating with ${provider}... Chamber unlocked.`
    });
    setTimeout(() => {
      onNavigate('reader-sanctuary');
    }, 600);
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

          {/* Tab Switcher */}
          <div className="login-tabs" role="tablist" aria-label="Authentication Type">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signin'}
              className={`login-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign In (প্রবেশ)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signup'}
              className={`login-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Join Guild (নিবন্ধন)
            </button>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {activeTab === 'signin' ? (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="pageSigninEmail">
                    Pen Name or Manuscript Email
                  </label>
                  <input
                    id="pageSigninEmail"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    placeholder="poet@bhashalibrary.org or রবীন্দ্রনাথ"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <div className="form-label-row">
                    <label className="form-label" htmlFor="pageSigninPassword">
                      Secret Cipher (পাসওয়ার্ড)
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('A royal messenger owl will send your cipher reset talisman.')}
                      className="forgot-cipher-link"
                    >
                      Forgotten cipher?
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
                  title="Inscribe with Literary Guild"
                  className="btn-spring wax-seal-btn"
                  onClick={() => handleFederatedSeal('Bengal Literary Guild')}
                >
                  <i className="fa-solid fa-feather-pointed" aria-hidden="true"></i>
                  <span>Guild</span>
                </button>
              </div>
            </div>
          </form>

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
