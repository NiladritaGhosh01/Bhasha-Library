import React from 'react';
import { ART_ASSETS } from '../assets/artAssets';

export function Footer() {
  return (
    <footer className="manuscript-footer">
      <div className="footer-inner">
        {/* Brand Colophon */}
        <div className="footer-brand">
          <img src={ART_ASSETS.bhashaLogo} alt="Bhasha Seal" className="footer-seal-img" />
          <span className="footer-bengali-title">ভাষা</span>
          <span className="footer-latin-title">Library</span>
          <span style={{ fontFamily: 'var(--font-bengali)' }}>• ভাষা লাইব্রেরি</span>
        </div>

        {/* Tagline Statement with Natural Colon (R-02) */}
        <div className="footer-tagline-statement">
          <span className="footer-tagline-bengali">“গল্প সবার জমবে এবার”</span>:{' '}
          <span style={{ fontStyle: 'italic', color: 'var(--color-on-surface-muted)' }}>
            Sanctuary of Bengali Lore &amp; Continental Enlightenment.
          </span>
        </div>

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
