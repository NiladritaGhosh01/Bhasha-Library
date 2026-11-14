import React from 'react';
import { ART_ASSETS } from '../assets/artAssets';

export function TaglineSection() {
  return (
    <section className="tagline-section" id="stage-tagline" data-purpose="scroll-tagline-scene">
      <div className="tagline-card" id="taglineCard">
        <div className="tagline-content">
          <div className="tagline-sacred-label">Folio Inscription</div>

          {/* Main Verbatim Bengali Headline */}
          <h2 className="tagline-headline-bengali">
            "গল্প সবার জমবে এবার"
          </h2>

          {/* European Renaissance Poetic Translation */}
          <p className="tagline-english-subtext">
            "Every story finds its noble voice, every wandering reader finds an endless world."
          </p>

          <div className="tagline-typographic-divider">
            <span className="divider-line"></span>
            <span className="divider-ornament">❦</span>
            <span className="divider-line"></span>
          </div>

          {/* Fellowship Cultural Cards: Author & Reader Categories */}
          <div className="fellowship-grid">
            <div className="fellowship-card">
              <div className="fellowship-avatar">
                <img src={ART_ASSETS.renaissanceScholar} alt="Author Fellowship" />
              </div>
              <h3 className="fellowship-title-latin">Author Fellowship</h3>
              <p className="fellowship-title-bengali">লেখকদের আড্ডা</p>
              <p className="fellowship-desc">A salon for independent scribes, translators, and literary craft.</p>
            </div>

            <div className="fellowship-card">
              <div className="fellowship-avatar">
                <img src={ART_ASSETS.pattachitraMaiden} alt="Reader Sanctuary" />
              </div>
              <h3 className="fellowship-title-latin">Reader Sanctuary</h3>
              <p className="fellowship-title-bengali">অনাবিল পাঠাগার</p>
              <p className="fellowship-desc">Curated long-form folios for contemplative readers.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
