import React from 'react';

export default function Hero({
  searchTerm,
  setSearchTerm,
  selectedGenre,
  setSelectedGenre,
  t
}) {
  const genres = [
    { id: 'all', label: t.hero.genres.all },
    { id: 'Folklore', label: t.hero.genres.folklore },
    { id: 'Literary', label: t.hero.genres.literary },
    { id: 'Sci-Fi', label: t.hero.genres.scifi },
    { id: 'Adventure', label: t.hero.genres.adventure },
  ];

  return (
    <section className="hero-minimal">
      <div className="hero-tag">
        <span>{t.hero.tag}</span>
      </div>

      <h1 className="hero-heading">
        {t.hero.title} <span className="gradient-text">{t.hero.titleAccent}</span>
      </h1>

      {/* Floating Glass Search & Genre Filter */}
      <div className="glass-search-container">
        <div className="search-row">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            className="minimal-search-input"
            placeholder={t.hero.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>✕</button>
          )}
        </div>

        <div className="genre-strip">
          {genres.map((g) => (
            <button
              key={g.id}
              className={`genre-chip ${selectedGenre === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGenre(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
