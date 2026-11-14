import React, { useRef } from 'react';
import { BookCoverCard } from './BookCoverCard';
import { bookService } from '../services/bookService';

export function BookCoverMarquee({ onSelectBook }) {
  const books = bookService.getAllBooks();
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="book-marquee-container" data-purpose="kindle-style-book-preview">
      <div className="book-marquee-header">
        <div className="marquee-label-group">
          <span className="marquee-badge">Manuscript Preview Carousel</span>
          <h3 className="marquee-title">Archival Folios on Display • সংরক্ষিত গ্রন্থের প্রদর্শনী</h3>
          <p className="marquee-subtext">
            Glance through classic works available across the sanctuary vaults. Click any folio to inspect.
          </p>
        </div>

        {/* Scroll Controls */}
        <div className="marquee-controls" aria-label="Carousel navigation">
          <button
            type="button"
            className="marquee-control-btn"
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            title="Scroll left"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button
            type="button"
            className="marquee-control-btn"
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            title="Scroll right"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Infinite/Continuous Moving Track */}
      <div className="book-marquee-track-wrap" ref={scrollContainerRef}>
        <div className="book-marquee-track">
          {/* First loop of books */}
          {books.map((book) => (
            <div key={`m1-${book.id}`} className="marquee-item">
              <BookCoverCard
                book={book}
                size="medium"
                onClick={() => onSelectBook && onSelectBook(book)}
              />
              <div className="marquee-item-meta">
                <span className="meta-clicks">
                  <i className="fa-solid fa-fire-flame-curved"></i> {book.clicks.toLocaleString()} reads
                </span>
                <span className="meta-year">{book.yearPublished}</span>
              </div>
            </div>
          ))}

          {/* Seamless duplicate loop for continuous flow */}
          {books.map((book) => (
            <div key={`m2-${book.id}`} className="marquee-item" aria-hidden="true">
              <BookCoverCard
                book={book}
                size="medium"
                onClick={() => onSelectBook && onSelectBook(book)}
              />
              <div className="marquee-item-meta">
                <span className="meta-clicks">
                  <i className="fa-solid fa-fire-flame-curved"></i> {book.clicks.toLocaleString()} reads
                </span>
                <span className="meta-year">{book.yearPublished}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
