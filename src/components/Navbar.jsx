import React, { useState } from 'react';
import { ART_ASSETS } from '../assets/artAssets';
import { useAuth } from '../hooks/useAuth';

export function Navbar({ theme, onToggleTheme, currentPage, onNavigate }) {
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoClick = (e) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0];

  return (
    <header className="navbar-header">
      <div className="navbar-inner">
        {/* Brand Insignia */}
        <a href="#stage-hero" onClick={handleLogoClick} className="navbar-brand" aria-label="Bhasha Library Home">
          <div className="navbar-brand-emblem">
            <img src={ART_ASSETS.bhashaLogo} alt="Bhasha Library Logo" />
          </div>
          <div className="navbar-brand-text">
            <div className="navbar-brand-titles">
              <span className="navbar-title-bengali">ভাষা</span>
              <span className="navbar-title-latin">Library</span>
            </div>
            <span className="navbar-sub-bengali">ভাষা লাইব্রেরি</span>
          </div>
        </a>

        {/* Quick Nav Links (Desktop) */}
        <nav className="navbar-nav" aria-label="Sanctuary Navigation">
          <button
            type="button"
            className={`nav-link-btn ${currentPage === 'home' ? 'active-link' : ''}`}
            onClick={() => onNavigate && onNavigate('home')}
          >
            Sanctuary Home
          </button>

          <button
            type="button"
            className={`nav-link-btn ${currentPage === 'author-fellowship' ? 'active-link' : ''}`}
            onClick={() => onNavigate && onNavigate('author-fellowship')}
          >
            Author Fellowship
          </button>

          <button
            type="button"
            className={`nav-link-btn ${currentPage === 'reader-sanctuary' ? 'active-link' : ''}`}
            onClick={() => onNavigate && onNavigate('reader-sanctuary')}
          >
            Reader Sanctuary
          </button>

          {/* Dedicated Portal Login / User State */}
          {currentUser ? (
            <div className="navbar-user-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="navbar-portal-btn active-portal" title={currentUser.email}>
                <i className="fa-solid fa-user-feather" style={{ marginRight: '6px' }}></i>
                {displayName}
              </span>
              <button
                type="button"
                className="btn-spring"
                onClick={logout}
                title="Sign Out of Sanctuary • প্রস্থান"
                aria-label="Sign Out of Sanctuary"
                style={{
                  background: 'none',
                  border: '1px solid var(--border-medium)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-on-surface-muted)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-display)',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={`navbar-portal-btn ${currentPage === 'login' ? 'active-portal' : ''}`}
              onClick={() => onNavigate && onNavigate('login')}
            >
              <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i>
              Portal Login
            </button>
          )}
        </nav>

        {/* Right Actions: Chamber Badge, Theme Toggle & Mobile Menu Button */}
        <div className="navbar-actions">
          <div className="navbar-status-badge">
            <span className="navbar-status-dot"></span>
            <span>
              {currentPage === 'author-fellowship'
                ? 'Author Studio'
                : currentPage === 'reader-sanctuary'
                ? 'Reader Archives'
                : currentPage === 'login'
                ? 'Admission Chamber'
                : 'Chamber Unlocked'}
            </span>
          </div>
          
          <button
            type="button"
            id="themeToggleBtn"
            data-theme-toggle="true"
            onClick={(e) => {
              e?.stopPropagation?.();
              onToggleTheme?.(e);
            }}
            className="navbar-theme-btn"
            aria-label="Toggle parchment day and nocturne night theme"
          >
            {theme === 'dark' ? (
              <i className="fa-solid fa-sun" title="Switch to Sunlit Vellum Day"></i>
            ) : (
              <i className="fa-solid fa-moon" title="Switch to Nocturne Night"></i>
            )}
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile-drawer" role="dialog" aria-label="Mobile Navigation">
          <nav className="navbar-mobile-nav" aria-label="Mobile Sanctuary Links">
            <button
              type="button"
              className={`mobile-nav-link-btn ${currentPage === 'home' ? 'active-link' : ''}`}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate && onNavigate('home');
              }}
            >
              <i className="fa-solid fa-house-chimney"></i>
              <span>Sanctuary Home</span>
            </button>

            <button
              type="button"
              className={`mobile-nav-link-btn ${currentPage === 'author-fellowship' ? 'active-link' : ''}`}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate && onNavigate('author-fellowship');
              }}
            >
              <i className="fa-solid fa-feather-pointed"></i>
              <span>Author Fellowship</span>
            </button>

            <button
              type="button"
              className={`mobile-nav-link-btn ${currentPage === 'reader-sanctuary' ? 'active-link' : ''}`}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate && onNavigate('reader-sanctuary');
              }}
            >
              <i className="fa-solid fa-book-bookmark"></i>
              <span>Reader Sanctuary</span>
            </button>

            {/* Mobile User Profile or Portal Sign-In */}
            <div className="mobile-auth-section">
              {currentUser ? (
                <div className="mobile-user-row">
                  <div className="mobile-user-badge" title={currentUser.email}>
                    <i className="fa-solid fa-user-feather"></i>
                    <span>{displayName}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-spring mobile-signout-btn"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    title="Sign Out of Sanctuary"
                  >
                    <i className="fa-solid fa-arrow-right-from-bracket"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="mobile-portal-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate && onNavigate('login');
                  }}
                >
                  <i className="fa-solid fa-key"></i>
                  <span>Portal Login</span>
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
