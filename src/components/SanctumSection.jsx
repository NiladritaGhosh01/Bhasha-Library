import React, { useState } from 'react';

export function SanctumSection({ onOpenModal, onTriggerWaxSeal }) {
  const [activeTab, setActiveTab] = useState('signin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('reader');
  
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

    setTimeout(() => {
      setIsSubmitting(false);
      onOpenModal();
    }, 600);
  };

  return (
    <section className="sanctum-section" id="stage-sanctum" data-purpose="authentication-sanctum">
      <div className="sanctum-container" id="sanctumContainer">
        {/* Header */}
        <div className="sanctum-header">
          <div className="sanctum-category-label">Library Admission</div>
          <h2 className="sanctum-title">Portals of Admission</h2>
          <p className="sanctum-subtitle-bengali">
            গ্রন্থাগারের রুদ্ধদ্বার উন্মোচনে নিজের পরিচয় লিপিবদ্ধ করুন
          </p>
        </div>

        {/* Auth Card */}
        <div className="sanctum-card">
          {/* Tab Switcher */}
          <div className="sanctum-tabs" role="tablist" aria-label="Authentication Type">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signin'}
              className={`sanctum-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => setActiveTab('signin')}
            >
              Sign In (প্রবেশ)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'signup'}
              className={`sanctum-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Join Guild (নিবন্ধন)
            </button>
          </div>

          {/* Form */}
          <form className="sanctum-form" onSubmit={handleSubmit} method="POST" action="#">
            {activeTab === 'signin' ? (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="signinEmail">
                    Pen Name or Manuscript Email
                  </label>
                  <input
                    id="signinEmail"
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
                    <label className="form-label" htmlFor="signinPassword">
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
                    id="signinPassword"
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
                  <label htmlFor="rememberMeCheckbox" className="checkbox-label">
                    <input
                      id="rememberMeCheckbox"
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
                  <label className="form-label" htmlFor="regName">
                    Honorary Pen Name (লেখক বা পাঠকের নাম)
                  </label>
                  <input
                    id="regName"
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
                  <label className="form-label" htmlFor="regEmail">
                    Communication Email
                  </label>
                  <input
                    id="regEmail"
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
                        name="guildRole"
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
                        name="guildRole"
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
                        name="guildRole"
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
                  <label className="form-label" htmlFor="regPassword">
                    Inscribe New Cipher (পাসওয়ার্ড)
                  </label>
                  <input
                    id="regPassword"
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
                className="btn-spring sanctum-submit-btn"
              >
                {isSubmitting ? (
                  <span>Breaking Parchment Seals...</span>
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
                  aria-label="Inscribe with Google Manuscript"
                  className="btn-spring wax-seal-btn"
                  onClick={() => onTriggerWaxSeal('Google Manuscript')}
                >
                  <i className="fa-brands fa-google" aria-hidden="true"></i>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  title="Inscribe with Apple Codex"
                  aria-label="Inscribe with Apple Codex"
                  className="btn-spring wax-seal-btn"
                  onClick={() => onTriggerWaxSeal('Apple Codex')}
                >
                  <i className="fa-brands fa-apple" aria-hidden="true"></i>
                  <span>Apple</span>
                </button>
                <button
                  type="button"
                  title="Inscribe with Literary Guild"
                  aria-label="Inscribe with Royal Guild Fellowship"
                  className="btn-spring wax-seal-btn"
                  onClick={() => onTriggerWaxSeal('Bengal Literary Guild')}
                >
                  <i className="fa-solid fa-feather-pointed" aria-hidden="true"></i>
                  <span>Guild</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Guarantees */}
        <div className="sanctum-guarantee">
          <p>Manuscripts and translations protected by historical preservation covenants.</p>
          <p className="sanctum-guarantee-bengali">লেখক ও পাঠকদের যৌথ মিলনতীর্থ (সর্বস্বত্ব সংরক্ষিত ২০২৬)</p>
        </div>
      </div>
    </section>
  );
}
