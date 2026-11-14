import React, { useState, useRef, useEffect } from 'react';
import { BookCatalogueBrowser } from '../components/BookCatalogueBrowser';
import { BookReader } from '../components/BookReader';
import { LLMAgentChat } from '../components/LLMAgentChat';
import { FloatingNotesWidget } from '../components/FloatingNotesWidget';
import { bookService } from '../services/bookService';

export function AuthorFellowshipPage({ onNavigate, theme, onToggleTheme }) {
  // Tabs for the left-hand book reading pane
  const [tabs, setTabs] = useState([
    {
      id: 'author-tab-1',
      title: 'Gitanjali (Folio 1)',
      book: bookService.getBookById('gitanjali-1910'),
      initialPage: 1
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('author-tab-1');

  // Split-pane divider position (percentage for left pane)
  const [splitPercent, setSplitPercent] = useState(54);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Mouse & Touch events for moveable dividing line
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const totalWidth = rect.width;
      
      let newPercent = (currentX / totalWidth) * 100;
      // Clamp between 25% and 75% for usability
      newPercent = Math.max(25, Math.min(75, newPercent));
      setSplitPercent(newPercent);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Tab management
  const handleSelectBookInTab = (book, page = 1) => {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return {
          ...t,
          title: `${book.name.split('(')[0].trim()} (P.${page})`,
          book: book,
          initialPage: page
        };
      }
      return t;
    }));
  };

  const handleBackToSearch = () => {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return {
          ...t,
          title: 'Search Folios 📚',
          book: null,
          initialPage: 1
        };
      }
      return t;
    }));
  };

  const handleCreateNewTab = () => {
    const newId = `author-tab-${Date.now()}`;
    const newTab = {
      id: newId,
      title: `Search Folios ${tabs.length + 1} ＋`,
      book: null,
      initialPage: 1
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (e, tabIdToClose) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      setTabs([
        {
          id: 'author-tab-1',
          title: 'Search Folios 📚',
          book: null,
          initialPage: 1
        }
      ]);
      setActiveTabId('author-tab-1');
      return;
    }

    const updated = tabs.filter(t => t.id !== tabIdToClose);
    setTabs(updated);

    if (activeTabId === tabIdToClose) {
      const closedIndex = tabs.findIndex(t => t.id === tabIdToClose);
      const nextActive = updated[Math.max(0, closedIndex - 1)];
      setActiveTabId(nextActive.id);
    }
  };

  // When AI citations are clicked, open the cited book in current or new tab and jump to that page
  const handleOpenCitationInReader = (bookId, pageNumber = 1) => {
    const book = bookService.getBookById(bookId);
    if (!book) return;

    // Check if book already open in an existing tab
    const existingTabIndex = tabs.findIndex(t => t.book?.id === bookId);
    if (existingTabIndex >= 0) {
      const existingTab = tabs[existingTabIndex];
      setTabs(prev => prev.map((t, idx) => {
        if (idx === existingTabIndex) {
          return {
            ...t,
            initialPage: pageNumber,
            title: `${book.name.split('(')[0].trim()} (P.${pageNumber})`
          };
        }
        return t;
      }));
      setActiveTabId(existingTab.id);
    } else {
      // Load in active tab
      handleSelectBookInTab(book, pageNumber);
    }
  };

  return (
    <div className="author-page-container">
      {/* Top Author Studio Nav */}
      <header className="author-top-nav">
        <div className="author-nav-left">
          <button
            type="button"
            className="btn-spring author-back-home-btn"
            onClick={() => onNavigate('home')}
            title="Return to Main Sanctuary Home"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Sanctuary Home</span>
          </button>

          <div className="author-brand-divider"></div>

          <div className="author-page-title-group">
            <span className="author-bengali-kicker">লেখকদের গবেষণা ও আড্ডা</span>
            <h1 className="author-page-title">Author Fellowship Studio</h1>
          </div>
        </div>

        {/* Center Split Presets */}
        <div className="split-presets-group" aria-label="Layout ratio controls">
          <span className="split-label">Split:</span>
          <button
            type="button"
            className={`split-preset-btn ${Math.round(splitPercent) === 50 ? 'active' : ''}`}
            onClick={() => setSplitPercent(50)}
            title="50% Book / 50% AI Agent"
          >
            50 / 50
          </button>
          <button
            type="button"
            className={`split-preset-btn ${Math.round(splitPercent) === 65 ? 'active' : ''}`}
            onClick={() => setSplitPercent(65)}
            title="65% Book / 35% AI Agent"
          >
            Focus Book
          </button>
          <button
            type="button"
            className={`split-preset-btn ${Math.round(splitPercent) === 35 ? 'active' : ''}`}
            onClick={() => setSplitPercent(35)}
            title="35% Book / 65% AI Agent"
          >
            Focus AI
          </button>
        </div>

        <div className="author-nav-right">
          <button
            type="button"
            className="btn-spring author-switch-chamber-btn"
            onClick={() => onNavigate('reader-sanctuary')}
            title="Switch to Reader Sanctuary"
          >
            <i className="fa-solid fa-book-bookmark"></i>
            <span>Reader Sanctuary</span>
          </button>

          <button
            type="button"
            className="author-theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle parchment theme"
          >
            {theme === 'dark' ? (
              <i className="fa-solid fa-sun"></i>
            ) : (
              <i className="fa-solid fa-moon"></i>
            )}
          </button>
        </div>
      </header>

      {/* Main Split-Pane Workspace */}
      <div className="author-split-workspace" ref={containerRef}>
        {/* Left Section: Tabbed Book Reading Section */}
        <section
          className="author-reading-pane"
          style={{ width: `calc(${splitPercent}% - 5px)` }}
          aria-label="Book Reading and Research Section"
        >
          {/* Tabs Ribbon for Left Pane */}
          <div className="author-tabs-ribbon" role="tablist">
            <div className="tabs-scroll-area">
              {tabs.map(tab => (
                <div
                  key={tab.id}
                  role="tab"
                  aria-selected={tab.id === activeTabId}
                  className={`author-tab-item ${tab.id === activeTabId ? 'active-tab' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <i className={`fa-solid ${tab.book ? 'fa-book-open' : 'fa-magnifying-glass'} tab-icon`}></i>
                  <span className="tab-title-text">{tab.title}</span>
                  <button
                    type="button"
                    className="tab-close-btn"
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    title="Close Tab"
                    aria-label={`Close ${tab.title} tab`}
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn-spring author-new-tab-btn"
                onClick={handleCreateNewTab}
                title="Open a new tab with catalogue search"
              >
                <i className="fa-solid fa-plus"></i>
                <span>New Tab</span>
              </button>
            </div>
          </div>

          {/* Left Pane Canvas */}
          <div className="author-reading-canvas">
            {activeTab.book ? (
              <BookReader
                book={activeTab.book}
                initialPage={activeTab.initialPage || 1}
                onBackToSearch={handleBackToSearch}
              />
            ) : (
              <BookCatalogueBrowser
                title="Author Research Vault"
                subtitle="Select any manuscript to read side-by-side with your LLM research scribe"
                onSelectBook={(book) => handleSelectBookInTab(book, 1)}
              />
            )}
          </div>
        </section>

        {/* Moveable Draggable Divider */}
        <div
          className={`author-split-divider ${isResizing ? 'is-dragging' : ''}`}
          onMouseDown={() => setIsResizing(true)}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(splitPercent)}
          aria-label="Moveable divider between reading pane and LLM agent"
          title="Drag left or right to resize panes"
        >
          <div className="divider-grip-handle">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Right Section: LLM Agent Section */}
        <section
          className="author-agent-pane"
          style={{ width: `calc(${100 - splitPercent}% - 5px)` }}
          aria-label="Literary AI Agent Section"
        >
          <LLMAgentChat
            openBook={activeTab.book}
            onOpenCitation={handleOpenCitationInReader}
          />
        </section>
      </div>

      {/* Floating Bottom-Left Draggable Notes Widget */}
      <FloatingNotesWidget />
    </div>
  );
}
