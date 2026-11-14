import React from 'react';

const CHAPTERS = [
  { id: 'stage-hero', label: 'Sanctuary', num: 'I' },
  { id: 'stage-tagline', label: 'The Inscription', num: 'II' },
  { id: 'stage-sanctum', label: 'Admission', num: 'III' }
];

export function ChapterNav({ activeChapter = 'hero' }) {
  const currentKey = activeChapter === 'hero' ? 'stage-hero' : activeChapter === 'tagline' ? 'stage-tagline' : 'stage-sanctum';

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
      </ul>
    </nav>
  );
}
