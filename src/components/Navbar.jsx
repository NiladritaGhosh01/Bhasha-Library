import React from 'react';
import { ART_ASSETS } from '../assets/artAssets';

export function Navbar({ theme, onToggleTheme }) {
  return (
    <header className="navbar-header">
      <div className="navbar-inner">
        {/* Brand Insignia */}
        <a href="#stage-hero" className="navbar-brand" aria-label="Bhasha Library Home">
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
          <a href="#stage-hero" className="nav-link">Sanctuary</a>
          <a href="#stage-tagline" className="nav-link">The Inscription</a>
          <a href="#stage-sanctum" className="navbar-portal-btn">
            Portal Login
          </a>
        </nav>

        {/* Right Actions: Chamber Badge & Theme Toggle */}
        <div className="navbar-actions">
          <div className="navbar-status-badge">
            <span className="navbar-status-dot"></span>
            <span>Chamber Locked</span>
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
