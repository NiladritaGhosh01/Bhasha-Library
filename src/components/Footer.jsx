import React from 'react';
import { ART_ASSETS } from '../assets/artAssets';

export function Footer({ onNavigate }) {
  return (
    <footer className="manuscript-footer">
      <div className="footer-inner">
        {/* Brand Colophon */}
        <div className="footer-brand" onClick={() => onNavigate && onNavigate('home')} style={{ cursor: 'pointer' }}>
          <img src={ART_ASSETS.bhashaLogo} alt="Bhasha Seal" className="footer-seal-img" />
          <span className="footer-bengali-title">ভাষা</span>
          <span className="footer-latin-title">Library</span>
          <span style={{ fontFamily: 'var(--font-bengali)' }}>• ভাষা লাইব্রেরি</span>
        </div>

        {/* Tagline Statement with Natural Colon */}
        <div className="footer-tagline-statement">
          <span className="footer-tagline-bengali">“গল্প সবার জমবে এবার”</span>:{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--color-on-surface-muted)' }}>
            Sanctuary of Bengali Lore &amp; Continental Enlightenment.
          </span>
        </div>

        {/* Quick Navigation Gateways */}
        {onNavigate && (
          <div className="footer-nav-links">
            <button type="button" className="footer-link-btn" onClick={() => onNavigate('author-fellowship')}>
              Author Studio
            </button>
            <span className="footer-sep">•</span>
            <button type="button" className="footer-link-btn" onClick={() => onNavigate('reader-sanctuary')}>
              Reader Sanctuary
            </button>
            <span className="footer-sep">•</span>
            <button type="button" className="footer-link-btn" onClick={() => onNavigate('login')}>
              Portal Admission
            </button>
          </div>
        )}

        {/* Ascend Action */}
        <div>
          <a href="#stage-hero" className="btn-spring footer-ascend-link">
            <span>Ascend to Top</span>
            <i className="fa-solid fa-arrow-up" style={{ fontSize: '10px' }} aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </footer>
  );
}
