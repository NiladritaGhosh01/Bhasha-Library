import React, { useState, useEffect, useRef } from 'react';

export function BookReader({ book, initialPage = 1, onBackToSearch }) {
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isContinuousScroll, setIsContinuousScroll] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'highlight' | 'underline' | null
  const [highlightedParas, setHighlightedParas] = useState({});
  const [underlinedParas, setUnderlinedParas] = useState({});
  const [bookmarkedPages, setBookmarkedPages] = useState({});
  
  // Text-To-Voice (TTS) state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const utteranceRef = useRef(null);

  const totalPages = book?.pagesData?.length || 1;
  const pageData = book?.pagesData?.[currentPage - 1] || book?.pagesData?.[0];

  // Clean up speech synthesis on page/book change or unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentPage, book?.id]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleToggleHighlight = (paraIndex) => {
    const key = `${book.id}-p${currentPage}-${paraIndex}`;
    setHighlightedParas(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleUnderline = (paraIndex) => {
    const key = `${book.id}-p${currentPage}-${paraIndex}`;
    setUnderlinedParas(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleBookmark = () => {
    const key = `${book.id}-p${currentPage}`;
    setBookmarkedPages(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Text-to-Voice Controls
  const handlePlayTTS = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser environment.');
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();

    if (!pageData || !pageData.paragraphs) return;
    const fullText = `${pageData.title}. ${pageData.paragraphs.join(' ')}`;

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Detect if text has Bengali script to prefer Bengali or fallback voices
    const isBengaliText = /[\u0980-\u09FF]/.test(fullText);
    const voices = window.speechSynthesis.getVoices();
    if (isBengaliText) {
      const bnVoice = voices.find(v => v.lang.includes('bn') || v.lang.includes('IN'));
      if (bnVoice) utterance.voice = bnVoice;
    } else {
      const enVoice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US'));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handlePauseTTS = () => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  const handleStopTTS = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  if (!book) {
    return (
      <div className="empty-reader-state">
        <div className="empty-reader-card">
          <i className="fa-solid fa-book-open empty-icon"></i>
          <h3>No Manuscript Selected</h3>
          <p>Select a book from the catalogue or use the search bar above to begin reading.</p>
          {onBackToSearch && (
            <button type="button" className="btn-spring reader-search-btn" onClick={onBackToSearch}>
              Browse Database Catalogue
            </button>
          )}
        </div>
      </div>
    );
  }

  const isCurrentPageBookmarked = bookmarkedPages[`${book.id}-p${currentPage}`];

  return (
    <div className="book-reader-container" data-purpose="pdf-style-manuscript-reader">
      {/* Reader Utility Toolbar */}
      <div className="reader-toolbar">
        {/* Left: Book Meta & Back button */}
        <div className="reader-toolbar-left">
          {onBackToSearch && (
            <button
              type="button"
              className="reader-tool-btn back-btn"
              onClick={onBackToSearch}
              title="Return to Search & Catalogue"
            >
              <i className="fa-solid fa-arrow-left"></i>
              <span>Catalogue</span>
            </button>
          )}
          <div className="reader-book-info">
            <span className="reader-book-title">{book.name}</span>
            <span className="reader-book-author">{book.author}</span>
          </div>
        </div>

        {/* Center: Pagination & Navigation */}
        <div className="reader-toolbar-center">
          <button
            type="button"
            className="reader-tool-btn page-nav-btn"
            disabled={currentPage <= 1}
            onClick={handlePrevPage}
            aria-label="Previous Page"
            title="Previous Page"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <span className="reader-page-indicator">
            Folio <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            type="button"
            className="reader-tool-btn page-nav-btn"
            disabled={currentPage >= totalPages}
            onClick={handleNextPage}
            aria-label="Next Page"
            title="Next Page"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        {/* Right: PDF Tools & TTS */}
        <div className="reader-toolbar-right">
          {/* Zoom Controls */}
          <div className="reader-tool-group zoom-group">
            <button
              type="button"
              className="reader-tool-btn"
              onClick={() => setZoomLevel(prev => Math.max(80, prev - 10))}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <i className="fa-solid fa-magnifying-glass-minus"></i>
            </button>
            <span className="zoom-label">{zoomLevel}%</span>
            <button
              type="button"
              className="reader-tool-btn"
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              title="Zoom In"
              aria-label="Zoom In"
            >
              <i className="fa-solid fa-magnifying-glass-plus"></i>
            </button>
          </div>

          {/* Highlight & Underline Utility Modes */}
          <div className="reader-tool-group markup-group">
            <button
              type="button"
              className={`reader-tool-btn ${activeTool === 'highlight' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
              title="Highlight Tool (Click paragraph to highlight)"
            >
              <i className="fa-solid fa-highlighter"></i>
              <span className="tool-btn-text">Highlight</span>
            </button>
            <button
              type="button"
              className={`reader-tool-btn ${activeTool === 'underline' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'underline' ? null : 'underline')}
              title="Underline Tool (Click paragraph to underline)"
            >
              <i className="fa-solid fa-underline"></i>
              <span className="tool-btn-text">Underline</span>
            </button>
            <button
              type="button"
              className={`reader-tool-btn ${isCurrentPageBookmarked ? 'active bookmarked' : ''}`}
              onClick={handleToggleBookmark}
              title={isCurrentPageBookmarked ? 'Remove Bookmark' : 'Bookmark Page'}
            >
              <i className={`fa-${isCurrentPageBookmarked ? 'solid' : 'regular'} fa-bookmark`}></i>
            </button>
          </div>

          {/* Scroll Mode Toggle */}
          <button
            type="button"
            className={`reader-tool-btn ${isContinuousScroll ? 'active' : ''}`}
            onClick={() => setIsContinuousScroll(!isContinuousScroll)}
            title="Toggle Continuous Scroll"
          >
            <i className="fa-solid fa-scroll"></i>
            <span className="tool-btn-text">Scroll</span>
          </button>
        </div>
      </div>

      {/* Text-To-Voice (TTS) Header Strip */}
      <div className="reader-tts-bar">
        <div className="tts-status">
          <i className="fa-solid fa-volume-high tts-icon"></i>
          <span>Voice Recitation (পাঠ পাঠন):</span>
          {isSpeaking && <span className="tts-pulse">Speaking Folio {currentPage}...</span>}
          {isPaused && <span className="tts-pulse paused">Recitation Paused</span>}
        </div>

        <div className="tts-actions">
          {!isSpeaking ? (
            <button type="button" className="tts-btn play-btn" onClick={handlePlayTTS}>
              <i className="fa-solid fa-play"></i>
              <span>{isPaused ? 'Resume Voice' : 'Read Page Aloud'}</span>
            </button>
          ) : (
            <button type="button" className="tts-btn pause-btn" onClick={handlePauseTTS}>
              <i className="fa-solid fa-pause"></i>
              <span>Pause</span>
            </button>
          )}

          {(isSpeaking || isPaused) && (
            <button type="button" className="tts-btn stop-btn" onClick={handleStopTTS}>
              <i className="fa-solid fa-stop"></i>
              <span>Stop</span>
            </button>
          )}

          <div className="tts-rate-picker">
            <label htmlFor="ttsRate">Speed:</label>
            <select
              id="ttsRate"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            >
              <option value="0.8">0.8x</option>
              <option value="1.0">1.0x (Normal)</option>
              <option value="1.2">1.2x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Document Viewport (PDF-like Page Canvas) */}
      <div className="reader-viewport">
        <div
          className={`reader-document-scroll ${isContinuousScroll ? 'continuous-mode' : 'single-mode'}`}
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {isContinuousScroll ? (
            /* Continuous View: All Pages Stacked */
            book.pagesData.map((page, idx) => (
              <div key={`page-${page.pageNumber}`} className="reader-pdf-page">
                {renderSinglePage(page, idx + 1)}
              </div>
            ))
          ) : (
            /* Single Page View */
            <div className="reader-pdf-page">
              {renderSinglePage(pageData, currentPage)}
            </div>
          )}
        </div>
      </div>

      {/* Cloud Storage & Manuscript Telemetry Footer */}
      <div className="reader-storage-footer">
        <div className="storage-info">
          <i className="fa-solid fa-cloud-arrow-down"></i>
          <span>Firebase Cloud Storage Source:</span>
          <code>{book.storageUrl}</code>
        </div>
        <div className="book-meta-pills">
          <span className="meta-pill">{book.genre}</span>
          <span className="meta-pill">ISBN {book.isbn}</span>
          <span className="meta-pill">Published {book.yearPublished}</span>
        </div>
      </div>
    </div>
  );

  function renderSinglePage(page, pageNum) {
    if (!page) return null;
    const isBookmarked = bookmarkedPages[`${book.id}-p${pageNum}`];

    return (
      <article className="pdf-sheet">
        {/* Ribbon Bookmark visual indicator */}
        {isBookmarked && <div className="pdf-sheet-bookmark-ribbon" title="Bookmarked Page"></div>}

        {/* Running Folio Header */}
        <header className="pdf-sheet-header">
          <span className="pdf-sheet-book-title">{book.name.split('(')[0].trim()}</span>
          <span className="pdf-sheet-ornament">❦</span>
          <span className="pdf-sheet-author">{book.author.split('(')[0].trim()}</span>
        </header>

        {/* Page Title / Chapter Canto */}
        <div className="pdf-sheet-canto">
          <h2 className="pdf-canto-heading">{page.title}</h2>
          <div className="pdf-canto-divider"></div>
        </div>

        {/* Paragraphs with interactive highlight / underline */}
        <div className="pdf-sheet-body">
          {page.paragraphs.map((para, idx) => {
            const highlightKey = `${book.id}-p${pageNum}-${idx}`;
            const underlineKey = `${book.id}-p${pageNum}-${idx}`;
            const isHighlighted = highlightedParas[highlightKey];
            const isUnderlined = underlinedParas[underlineKey];

            return (
              <p
                key={`p-${idx}`}
                className={`pdf-paragraph ${isHighlighted ? 'is-highlighted' : ''} ${isUnderlined ? 'is-underlined' : ''} ${activeTool ? 'clickable-markup' : ''}`}
                onClick={() => {
                  if (activeTool === 'highlight') handleToggleHighlight(idx);
                  if (activeTool === 'underline') handleToggleUnderline(idx);
                }}
              >
                {para}
              </p>
            );
          })}
        </div>

        {/* Page Footer & Pagination */}
        <footer className="pdf-sheet-footer">
          <span className="pdf-sheet-isbn">Ref: {book.isbn}</span>
          <span className="pdf-sheet-page-num">— {pageNum} —</span>
          <span className="pdf-sheet-watermark">Bhasha Archives</span>
        </footer>
      </article>
    );
  }
}
