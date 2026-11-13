import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, langMode, setLangMode, openCreateStory, openAuthModal, t }) {
  const { user, signOutUser } = useAuth();

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand */}
        <div className="brand" onClick={() => setActiveTab('explore')} role="button" tabIndex={0}>
          <div className="brand-dot"></div>
          <span className="brand-title">
            {t.nav.brand}<span className="brand-accent">{t.nav.brandAccent}</span>
          </span>
        </div>

        {/* Minimal Navigation Tabs */}
        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            {t.nav.explore}
          </button>
          <button
            className={`nav-btn ${activeTab === 'reader' ? 'active' : ''}`}
            onClick={() => setActiveTab('reader')}
          >
            {t.nav.reader}
          </button>
          <button
            className={`nav-btn ${activeTab === 'studio' ? 'active' : ''}`}
            onClick={() => setActiveTab('studio')}
          >
            {t.nav.studio}
          </button>
          <button
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            {t.nav.dashboard}
          </button>
        </nav>

        {/* Right Controls */}
        <div className="navbar-actions">
          {/* Global Language Toggle */}
          <div className="lang-toggle-group">
            <button
              className={`lang-pill ${langMode === 'en' ? 'active' : ''}`}
              onClick={() => setLangMode('en')}
              title="English interface"
            >
              EN
            </button>
            <button
              className={`lang-pill bangla-font ${langMode === 'bn' ? 'active' : ''}`}
              onClick={() => setLangMode('bn')}
              title="বাংলা ইন্টারফেস"
            >
              বাংলা
            </button>
            <button
              className={`lang-pill ${langMode === 'dual' ? 'active' : ''}`}
              onClick={() => setLangMode('dual')}
              title="Dual / দ্বৈত"
            >
              Dual
            </button>
          </div>

          {/* User Auth or Sign In */}
          {user ? (
            <div className="nav-user-badge" onClick={signOutUser} title="Click to Sign Out">
              <span className="user-avatar-dot">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="user-nav-name">{user.displayName || user.email?.split('@')[0]}</span>
            </div>
          ) : (
            <button className="nav-auth-btn" onClick={openAuthModal}>
              {langMode === 'bn' ? 'লগইন' : 'Sign In'}
            </button>
          )}

          {/* Minimal Write Button */}
          <button className="minimal-cta-btn" onClick={openCreateStory}>
            <span>+ {t.nav.write}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
