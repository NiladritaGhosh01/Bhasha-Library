import React from 'react';

/**
 * Stylized Manuscript Book Cover
 * Designed with illuminated classical book jacket typography,
 * border ornamentation, and placeholder motifs that can be replaced with custom artwork.
 */
export function BookCoverCard({ book, onClick, size = 'medium', className = '' }) {
  if (!book) return null;

  const sizeClasses = {
    small: 'book-cover-sm',
    medium: 'book-cover-md',
    large: 'book-cover-lg'
  };

  return (
    <div
      className={`manuscript-book-cover ${sizeClasses[size] || 'book-cover-md'} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : 'figure'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${book.name} by ${book.author}`}
      style={{
        '--cover-base-color': book.coverColor || '#2F020D',
        '--cover-accent-color': book.coverAccent || '#FED65B'
      }}
    >
      {/* Book Spine Texture Edge */}
      <div className="book-cover-spine"></div>

      {/* Gilded Inner Ruling Frame */}
      <div className="book-cover-frame">
        {/* Top Ornament Header */}
        <div className="book-cover-head">
          <span className="book-cover-crest">❦</span>
          <span className="book-cover-decade">{book.decade || `${book.yearPublished}s`}</span>
        </div>

        {/* Title & Author */}
        <div className="book-cover-typography">
          <h4 className="book-cover-title">{book.name.split('(')[0].trim()}</h4>
          {book.name.includes('(') && (
            <p className="book-cover-bengali-title">
              {book.name.slice(book.name.indexOf('(') + 1, book.name.indexOf(')')).trim()}
            </p>
          )}
          <div className="book-cover-author-rule"></div>
          <p className="book-cover-author">{book.author.split('(')[0].trim()}</p>
        </div>

        {/* Bottom Motif & Folio Footer */}
        <div className="book-cover-footer">
          <span className="book-cover-genre-tag">{book.genre}</span>
          <span className="book-cover-pages">{book.pages} pp.</span>
        </div>
      </div>
    </div>
  );
}
