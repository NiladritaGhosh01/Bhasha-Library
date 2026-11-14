import React from 'react';
import { ART_ASSETS } from '../assets/artAssets';

export function HeroSection() {
  return (
    <section className="hero-section" id="stage-hero" data-purpose="hero-initial-screen">
      <div className="hero-content-wrapper">
        {/* Triad Composition: Balanced Literary Plates */}
        <div className="hero-triad">
          {/* Flanking Left: Renaissance Humanism */}
          <div className="hero-flank-portrait hero-flank-left" id="heroFlankLeft">
            <div className="hero-arch-frame-card">
              <div className="hero-arch-inner-window">
                <img
                  src={ART_ASSETS.renaissanceNobleman}
                  alt="Renaissance Humanism Folio"
                />
                <div className="hero-arch-caption">
                  <span className="caption-tag">Continental Folio</span>
                  <p className="caption-title">Florentine Humanism</p>
                </div>
              </div>
            </div>
          </div>

          {/* Central Sanctuary Seal */}
          <div className="hero-medallion-wrap" id="heroMedallionWrap">
            <div className="hero-emblem-disc">
              <div className="hero-emblem-inner">
                <img
                  src={ART_ASSETS.bhashaLogo}
                  alt="Bhasha Library Seal: Open book with Bengali script and quill"
                />
              </div>
            </div>
          </div>

          {/* Flanking Right: Indian Pattachitra Art */}
          <div className="hero-flank-portrait hero-flank-right" id="heroFlankRight">
            <div className="hero-arch-frame-card">
              <div className="hero-arch-inner-window">
                <img
                  src={ART_ASSETS.pattachitraMaiden}
                  alt="Pattachitra Literary Lore"
                />
                <div className="hero-arch-caption">
                  <span className="caption-tag">বঙ্গীয় চিত্রকলা</span>
                  <p className="caption-title">The Lotus Lore</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Headings: Dignified Classical Typography */}
        <div className="hero-text-block" id="heroContent">
          <div className="hero-category-label">
            Bengal Pattachitra &amp; European Renaissance
          </div>

          <h1 className="hero-main-title">
            <span className="hero-title-bengali">ভাষা</span>
            <span className="hero-title-latin">Library</span>
          </h1>

          <p className="hero-bengali-desc">
            বর্ণমালার আদি সুর থেকে আধুনিক সাহিত্যের দিগন্তে, বাংলা শব্দের এক চিরন্তন আশ্রয়।
          </p>

          <p className="hero-english-subtitle">
            An open sanctuary for independent authors, literary translators, and archival readers.
          </p>
        </div>
      </div>
    </section>
  );
}
