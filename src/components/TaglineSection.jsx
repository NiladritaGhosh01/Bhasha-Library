import React from 'react';
import { ART_ASSETS } from '../assets/artAssets';
import { BookCoverMarquee } from './BookCoverMarquee';

export function TaglineSection({ onNavigate, onSelectBookPreview }) {
  return (
    <section className="tagline-section" id="stage-tagline" data-purpose="scroll-tagline-scene">
      <div className="tagline-card" id="taglineCard">
        <div className="tagline-content">
          <div className="tagline-sacred-label">Folio Inscription • মূল লিপি</div>

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

          {/* User Prompt Banner Clarifying Interactive Tool Buttons */}
          <div className="fellowship-tool-prompt">
            <div className="prompt-badge">
              <i className="fa-solid fa-compass-drafting"></i>
              <span>Interactive Workspaces • আপনার প্রয়োজন অনুযায়ী টুল নির্বাচন করুন</span>
            </div>
            <p className="prompt-text">
              The two cards below are <strong>interactive workspace tools</strong>. Click to launch into either the <em>Author Research Studio</em> or the <em>Reader Database Sanctuary</em>.
            </p>
          </div>

          {/* Intuitive Author & Reader Workspace Tool Launchers */}
          <div className="fellowship-tools-grid">
            {/* Tool 1: Author Fellowship */}
            <div
              className="fellowship-tool-card tool-author"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('author-fellowship')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate && onNavigate('author-fellowship');
                }
              }}
              aria-label="Launch Author Fellowship Studio"
            >
              <div className="tool-card-glow-edge"></div>
              
              <div className="tool-card-top">
                <div className="tool-icon-wrapper">
                  <img src={ART_ASSETS.renaissanceScholar} alt="Author Fellowship" className="tool-avatar-img" />
                  <span className="tool-badge-pill">
                    <i className="fa-solid fa-feather-pointed"></i> Author Tool
                  </span>
                </div>
                <div className="tool-indicator-arrow">
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </div>
              </div>

              <div className="tool-content">
                <h3 className="tool-title-latin">Author Fellowship Studio</h3>
                <p className="tool-title-bengali">লেখকদের গবেষণা ও আড্ডা</p>
                <p className="tool-desc">
                  A dedicated research workspace for writers, essayists, and scribes. Read manuscripts side-by-side with a database-aware AI co-scribe, listen via text-to-speech, and take floating running notes.
                </p>
              </div>

              <div className="tool-action-cta">
                <span className="tool-cta-button btn-spring">
                  <span>Open Author Studio</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
                <span className="tool-feature-tag">Split Reading + AI Co-Scribe</span>
              </div>
            </div>

            {/* Tool 2: Reader Sanctuary */}
            <div
              className="fellowship-tool-card tool-reader"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate && onNavigate('reader-sanctuary')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate && onNavigate('reader-sanctuary');
                }
              }}
              aria-label="Launch Reader Sanctuary"
            >
              <div className="tool-card-glow-edge"></div>

              <div className="tool-card-top">
                <div className="tool-icon-wrapper">
                  <img src={ART_ASSETS.pattachitraMaiden} alt="Reader Sanctuary" className="tool-avatar-img" />
                  <span className="tool-badge-pill">
                    <i className="fa-solid fa-book-bookmark"></i> Reader Tool
                  </span>
                </div>
                <div className="tool-indicator-arrow">
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                </div>
              </div>

              <div className="tool-content">
                <h3 className="tool-title-latin">Reader Sanctuary</h3>
                <p className="tool-title-bengali">অনাবিল পাঠাগার</p>
                <p className="tool-desc">
                  Explore our curated literary database with Letterboxd-style search, popularity metrics, decade and genre filters. Open multiple manuscripts concurrently across reading tabs.
                </p>
              </div>

              <div className="tool-action-cta">
                <span className="tool-cta-button btn-spring">
                  <span>Enter Reader Sanctuary</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </span>
                <span className="tool-feature-tag">Letterboxd Discovery + Multi-Tab</span>
              </div>
            </div>
          </div>

          {/* Kindle-Style Moving Line of Book Covers Preview */}
          <BookCoverMarquee
            onSelectBook={(book) => {
              if (onSelectBookPreview) {
                onSelectBookPreview(book);
              } else if (onNavigate) {
                onNavigate('reader-sanctuary');
              }
            }}
          />
        </div>
      </div>
    </section>
  );
}
