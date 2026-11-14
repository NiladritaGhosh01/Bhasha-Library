import React from 'react';

const CHAPTERS = [
  { id: 'stage-hero', label: 'Sanctuary', num: 'I' },
  { id: 'stage-tagline', label: 'Folio Inscription', num: 'II' }
];

export function ChapterNav({ activeChapter = 'hero', onNavigate }) {
  const currentKey = activeChapter === 'hero' ? 'stage-hero' : 'stage-tagline';

  return (
    <nav aria-label="Reading Folio Index" className="chapter-nav-tracker">
      <ul className="chapter-nav-list">
        {CHAPTERS.map((chap) => {
          const isActive = currentKey === chap.id;
          return (
            <li key={chap.id}>
              <a
                href={`#${chap.id}`}
                className={`chapter-nav-link ${isActive ? 'active' : ''}`}
                title={chap.label}
                aria-label={`Go to Chapter ${chap.num}: ${chap.label}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="chapter-nav-pip"></span>
                <span className="chapter-nav-title">{chap.num}. {chap.label}</span>
              </a>
            </li>
          );
        })}
        {onNavigate && (
          <li>
            <button
              type="button"
              className="chapter-nav-link"
              onClick={() => onNavigate('login')}
              title="Admission Chamber"
              style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              <span className="chapter-nav-pip"></span>
              <span className="chapter-nav-title">III. Admission</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
