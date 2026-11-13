import React from 'react';

export default function StoryCard({ story, langMode, onSelect, onLike, isLiked, t }) {
  // Title according to language
  const titleDisplay = langMode === 'bn'
    ? (story.title?.bn || story.title?.en || story.title)
    : langMode === 'en'
    ? (story.title?.en || story.title)
    : (story.title?.en || story.title);

  const titleSecondary = langMode === 'dual' ? (story.title?.bn || '') : null;

  // Synopsis according to language
  const synopsisPrimary = langMode === 'bn'
    ? (story.synopsis?.bn || story.paragraphs?.[0]?.bn || '')
    : (story.synopsis?.en || story.paragraphs?.[0]?.en || '');

  const synopsisSecondary = langMode === 'dual' ? (story.synopsis?.bn || '') : null;

  // Genre display
  const genreDisplay = langMode === 'bn'
    ? (story.genreBn || story.genre || 'গল্প')
    : (story.genre || 'Story');

  // Read time unit
  const readTimeDisplay = `${story.readTime?.replace(/[^0-9]/g, '') || '3'} ${t.card.min}`;

  return (
    <article className="minimal-card" onClick={() => onSelect(story)}>
      {/* Top Meta */}
      <div className="card-top-meta">
        <span className="card-genre-pill">{genreDisplay}</span>
        <span className="card-time">{readTimeDisplay}</span>
      </div>

      {/* Main Title */}
      <div className="card-title-wrap">
        <h3 className={`card-main-title ${langMode === 'bn' ? 'bangla-font' : ''}`}>
          {titleDisplay}
        </h3>
        {titleSecondary && (
          <h4 className="card-sub-title bangla-font">
            {titleSecondary}
          </h4>
        )}
      </div>

      {/* Description that ONLY appears on hover */}
      <div className="card-hover-drawer">
        <p className={`hover-synopsis ${langMode === 'bn' ? 'bangla-font' : ''}`}>
          {synopsisPrimary}
        </p>
        {synopsisSecondary && (
          <p className="hover-synopsis sub bangla-font">
            {synopsisSecondary}
          </p>
        )}
      </div>

      {/* Minimal Footer */}
      <div className="card-bottom-bar" onClick={(e) => e.stopPropagation()}>
        <span className="card-author-name">{story.author || 'Author'}</span>

        <div className="card-btn-group">
          <button
            className={`card-fav-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => onLike(story.id)}
            title="Favorite"
          >
            {isLiked ? '♥' : '♡'}
          </button>
          <button className="card-read-action" onClick={() => onSelect(story)}>
            <span>{t.card.read}</span>
            <span className="arrow-icon">→</span>
          </button>
        </div>
      </div>
    </article>
  );
}
