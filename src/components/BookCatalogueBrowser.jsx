import React, { useState, useMemo, useEffect } from 'react';
import { bookService } from '../services/bookService';
import { BookCoverCard } from './BookCoverCard';
import { useAuth } from '../hooks/useAuth';

export function BookCatalogueBrowser({ 
  onSelectBook, 
  title = 'Reader Sanctuary Catalogue', 
  subtitle = 'Search and discover classical manuscripts preserved across our archives',
  onOpenAddModal
}) {
  const { user } = useAuth();
  const [allBooks, setAllBooks] = useState(() => bookService.getAllBooks());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecade, setSelectedDecade] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedCollection, setSelectedCollection] = useState('all'); // 'all' | 'admin' | 'community'
  const [sortBy, setSortBy] = useState('popular');
  const [seedStatus, setSeedStatus] = useState('');

  // Real-time subscription to bookService (Firestore + local cache)
  useEffect(() => {
    const unsubscribe = bookService.subscribe((updated) => {
      setAllBooks(updated);
    });
    return unsubscribe;
  }, []);

  const decades = useMemo(() => {
    const set = new Set(allBooks.map(b => b.decade).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [allBooks]);

  const genres = useMemo(() => {
    const set = new Set(allBooks.map(b => b.genre).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [allBooks]);

  // Filtered and sorted books
  const filteredBooks = useMemo(() => {
    let list = [...allBooks];

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(b => 
        (b.name && b.name.toLowerCase().includes(q)) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.genre && b.genre.toLowerCase().includes(q)) ||
        (b.summary && b.summary.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    }

    if (selectedDecade && selectedDecade !== 'All') {
      list = list.filter(b => b.decade === selectedDecade);
    }

    if (selectedGenre && selectedGenre !== 'All') {
      list = list.filter(b => b.genre && b.genre.toLowerCase().includes(selectedGenre.toLowerCase()));
    }

    if (selectedCollection === 'admin') {
      list = list.filter(b => b.isOfficialCanonical);
    } else if (selectedCollection === 'community') {
      list = list.filter(b => !b.isOfficialCanonical);
    }

    // Sort order
    if (sortBy === 'popular') {
      list.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    } else if (sortBy === 'year-asc') {
      list.sort((a, b) => a.yearPublished - b.yearPublished);
    } else if (sortBy === 'year-desc') {
      list.sort((a, b) => b.yearPublished - a.yearPublished);
    } else if (sortBy === 'title') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'pages') {
      list.sort((a, b) => (b.pages || 0) - (a.pages || 0));
    }

    return list;
  }, [allBooks, searchQuery, selectedDecade, selectedGenre, selectedCollection, sortBy]);

  const popularCount = filteredBooks.length;

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
    setSelectedCollection('all');
    setSortBy('popular');
  };

  const handleSeedClassics = async () => {
    if (!user) {
      alert('Please log in with an author account to sync classical folios.');
      return;
    }
    try {
      setSeedStatus('Syncing archival folios to library vault...');
      const res = await bookService.seedInitialManuscripts();
      setSeedStatus(`✓ Successfully synced ${res.count} manuscripts to library vault!`);
      setTimeout(() => setSeedStatus(''), 4000);
    } catch (err) {
      console.error(err);
      setSeedStatus(`Vault Notice: ${err.message}`);
      setTimeout(() => setSeedStatus(''), 6000);
    }
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

        <div className="catalogue-header-actions-group">
          <div className="catalogue-stat-badge">
            <i className="fa-solid fa-book-bookmark"></i>
            <span>{popularCount} Manuscripts Available</span>
          </div>

          {user && (
            <button
              type="button"
              className="btn-spring seed-classics-btn"
              onClick={handleSeedClassics}
              title="Sync initial classical folios to library vault"
            >
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <span>Sync to Vault</span>
            </button>
          )}

          {onOpenAddModal && (
            <div className="catalogue-upload-buttons-wrap">
              <button
                type="button"
                className="btn-spring add-manuscript-btn user-upload-btn"
                onClick={() => onOpenAddModal('user')}
                title="Upload book PDF or text with Bengali & English OCR"
              >
                <i className="fa-solid fa-file-arrow-up"></i>
                <span>Upload Book (OCR)</span>
              </button>

              <button
                type="button"
                className="btn-spring add-manuscript-btn admin-upload-btn"
                onClick={() => onOpenAddModal('admin')}
                title="Admin: Inscribe reference books for visitor exploration"
              >
                <i className="fa-solid fa-certificate"></i>
                <span>Admin Inscription</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {seedStatus && (
        <div className="catalogue-feedback-banner">
          <i className="fa-solid fa-circle-info"></i>
          <span>{seedStatus}</span>
        </div>
      )}

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

          {/* Collection Filter Dropdown */}
          <div className="ribbon-filter-group">
            <label htmlFor="collectionSelect">Folio Vault:</label>
            <select
              id="collectionSelect"
              className="ribbon-select"
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
            >
              <option value="all">All Folios</option>
              <option value="admin">★ Admin Reference (Visitor Guide)</option>
              <option value="community">✒ Community Manuscripts</option>
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
          {(searchQuery || selectedDecade !== 'All' || selectedGenre !== 'All' || selectedCollection !== 'all' || sortBy !== 'popular') && (
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
            Showing <strong>{filteredBooks.length}</strong> works ranked by reader circulation and popularity metrics
          </span>
        </div>
        <div className="popularity-banner-right">
          <span>Click any folio to open and read in this tab</span>
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length > 0 ? (
        <div className="catalogue-grid">
          {filteredBooks.map((book, index) => (
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
                  {book.isOfficialCanonical ? (
                    <span className="card-admin-badge" title="Curated Reference Book for Visitors">
                      <i className="fa-solid fa-certificate"></i> Admin Reference
                    </span>
                  ) : (
                    <span className="card-community-badge" title="Community Contributed Manuscript">
                      <i className="fa-solid fa-feather"></i> Community
                    </span>
                  )}
                </div>

                <h3 className="card-title">{book.name}</h3>
                <p className="card-author">{book.author}</p>

                <p className="card-summary">{book.summary}</p>

                <div className="card-telemetry">
                  <div className="telemetry-stat clicks-stat">
                    <i className="fa-solid fa-fire"></i>
                    <span>{(book.clicks || 0).toLocaleString()} reads</span>
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
                  {book.isbn && <span className="card-isbn">ISBN: {book.isbn}</span>}
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
