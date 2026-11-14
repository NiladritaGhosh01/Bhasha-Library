import React, { useState, useMemo } from 'react';
import { bookService } from '../services/bookService';
import { BookCoverCard } from './BookCoverCard';

export function BookCatalogueBrowser({ onSelectBook, title = 'Reader Sanctuary Catalogue', subtitle = 'Search and discover classical manuscripts preserved across our archives' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  const decades = useMemo(() => bookService.getDecades(), []);
  const genres = useMemo(() => bookService.getGenres(), []);

  // Filtered and sorted books
  const books = useMemo(() => {
    return bookService.getBooks({
      search: searchQuery,
      decade: selectedDecade,
      genre: selectedGenre,
      sortBy: sortBy
    });
  }, [searchQuery, selectedDecade, selectedGenre, sortBy]);

  const popularCount = books.length;

  const handleBookClick = (book) => {
    // Record click telemetry (popularity metric)
    bookService.recordBookClick(book.id);
    if (onSelectBook) {
      onSelectBook(book);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDecade('All');
    setSelectedGenre('All');
    setSortBy('popular');
  };

  return (
    <div className="catalogue-browser-container" data-purpose="letterboxd-style-book-catalogue">
      {/* Header Banner */}
      <div className="catalogue-header">
        <div className="catalogue-header-text">
          <span className="catalogue-kicker">Letterboxd-Style Archival Discovery</span>
          <h2 className="catalogue-title">{title}</h2>
          <p className="catalogue-subtitle">{subtitle}</p>
        </div>

        <div className="catalogue-stat-badge">
          <i className="fa-solid fa-book-bookmark"></i>
          <span>{popularCount} Manuscripts Available</span>
        </div>
      </div>

      {/* Ribbon Bar: Search, Decade, Genre, and Sort Controls */}
      <div className="catalogue-ribbon-bar">
        {/* Search Bar */}
        <div className="ribbon-search-wrap">
          <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
          <input
            type="search"
            className="ribbon-search-input"
            placeholder="Search by title, author, keyword, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search books in database"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="ribbon-filters-row">
          {/* Decade Filter Dropdown */}
          <div className="ribbon-filter-group">
            <label htmlFor="decadeSelect">Decade:</label>
            <select
              id="decadeSelect"
              className="ribbon-select"
              value={selectedDecade}
              onChange={(e) => setSelectedDecade(e.target.value)}
            >
              {decades.map(decade => (
                <option key={decade} value={decade}>
                  {decade === 'All' ? 'All Decades' : decade}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Filter Dropdown */}
          <div className="ribbon-filter-group">
            <label htmlFor="genreSelect">Genre:</label>
            <select
              id="genreSelect"
              className="ribbon-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>
                  {genre === 'All' ? 'All Genres' : genre}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="ribbon-filter-group">
            <label htmlFor="sortSelect">Sort By:</label>
            <select
              id="sortSelect"
              className="ribbon-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popular">Most Popular (Clicks)</option>
              <option value="year-asc">Year Published (Earliest)</option>
              <option value="year-desc">Year Published (Latest)</option>
              <option value="title">Title (A - Z)</option>
              <option value="pages">Page Count</option>
            </select>
          </div>

          {/* Active Filter Clear */}
          {(searchQuery || selectedDecade !== 'All' || selectedGenre !== 'All' || sortBy !== 'popular') && (
            <button
              type="button"
              className="ribbon-reset-btn"
              onClick={handleResetFilters}
            >
              <i className="fa-solid fa-rotate-left"></i>
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Popularity Metrics Banner */}
      <div className="catalogue-popularity-banner">
        <div className="popularity-banner-left">
          <i className="fa-solid fa-chart-line-up"></i>
          <span>
            Showing <strong>{books.length}</strong> works ranked by reader circulation and popularity metrics
          </span>
        </div>
        <div className="popularity-banner-right">
          <span>Click any folio to open and read in this tab</span>
        </div>
      </div>

      {/* Book Grid */}
      {books.length > 0 ? (
        <div className="catalogue-grid">
          {books.map((book, index) => (
            <div
              key={book.id}
              className="catalogue-card"
              onClick={() => handleBookClick(book)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleBookClick(book);
                }
              }}
            >
              {/* Popularity Rank Badge */}
              <div className="card-rank-badge">
                #{index + 1}
              </div>

              {/* Cover Representation */}
              <div className="card-cover-wrapper">
                <BookCoverCard book={book} size="medium" />
              </div>

              {/* Details & Telemetry */}
              <div className="card-details">
                <div className="card-meta-top">
                  <span className="card-genre">{book.genre}</span>
                  <span className="card-decade">{book.decade}</span>
                </div>

                <h3 className="card-title">{book.name}</h3>
                <p className="card-author">{book.author}</p>

                <p className="card-summary">{book.summary}</p>

                <div className="card-telemetry">
                  <div className="telemetry-stat clicks-stat">
                    <i className="fa-solid fa-fire"></i>
                    <span>{book.clicks.toLocaleString()} reads</span>
                  </div>
                  <div className="telemetry-stat pages-stat">
                    <i className="fa-regular fa-file-lines"></i>
                    <span>{book.pages} pages</span>
                  </div>
                  <div className="telemetry-stat year-stat">
                    <i className="fa-regular fa-calendar"></i>
                    <span>{book.yearPublished}</span>
                  </div>
                </div>

                <div className="card-action-bar">
                  <button type="button" className="btn-spring card-read-btn">
                    <i className="fa-solid fa-book-open"></i>
                    <span>Read Folio • পাঠ শুরু করুন</span>
                  </button>
                  <span className="card-isbn">ISBN: {book.isbn}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="catalogue-empty">
          <i className="fa-solid fa-book-bookmark empty-icon"></i>
          <h3>No Manuscripts Match Your Query</h3>
          <p>We could not find any titles matching "{searchQuery}" under the selected filters.</p>
          <button
            type="button"
            className="btn-spring catalogue-reset-large"
            onClick={handleResetFilters}
          >
            Show All Manuscripts
          </button>
        </div>
      )}
    </div>
  );
}
