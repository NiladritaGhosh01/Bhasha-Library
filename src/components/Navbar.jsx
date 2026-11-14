import React from 'react';
import { ART_ASSETS } from '../assets/artAssets';

export function Navbar({ theme, onToggleTheme, currentPage, onNavigate }) {
  const handleLogoClick = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('home');
    }
  };

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

        {/* Quick Nav Links */}
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

          {/* Dedicated Portal Login Button */}
          <button
            type="button"
            className={`navbar-portal-btn ${currentPage === 'login' ? 'active-portal' : ''}`}
            onClick={() => onNavigate && onNavigate('login')}
          >
            <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i>
            Portal Login
          </button>
        </nav>

        {/* Right Actions: Chamber Badge & Theme Toggle */}
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
            onClick={onToggleTheme}
            className="navbar-theme-btn"
            aria-label="Toggle parchment day and nocturne night theme"
          >
            {theme === 'dark' ? (
              <i className="fa-solid fa-sun" title="Switch to Sunlit Vellum Day"></i>
            ) : (
              <i className="fa-solid fa-moon" title="Switch to Nocturne Night"></i>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
