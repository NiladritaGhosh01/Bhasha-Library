import { useState } from 'react';
import { BookCatalogueBrowser } from '../components/BookCatalogueBrowser';
import { BookReader } from '../components/BookReader';

export function ReaderSanctuaryPage({ onNavigate, theme, onToggleTheme }) {
  // Tabs state: array of { id, title, book, initialPage }
  const [tabs, setTabs] = useState([
    {
      id: 'tab-1',
      title: 'Catalogue 📚',
      book: null,
      initialPage: 1
    }
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Open a book in the current tab
  const handleSelectBookInTab = (book, page = 1) => {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return {
          ...t,
          title: book.name.split('(')[0].trim(),
          book: book,
          initialPage: page
        };
      }
      return t;
    }));
  };

  // Back to search in the current tab
  const handleBackToSearch = () => {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        return {
          ...t,
          title: 'Catalogue 📚',
          book: null,
          initialPage: 1
        };
      }
      return t;
    }));
  };

  // Create a brand new tab (per prompt: opens with search bar & filters)
  const handleCreateNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab = {
      id: newId,
      title: `New Folio ${tabs.length + 1} ＋`,
      book: null,
      initialPage: 1
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  // Close a tab
  const handleCloseTab = (e, tabIdToClose) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      // If closing the only tab, just reset it to catalogue
      setTabs([
        {
          id: 'tab-1',
          title: 'Catalogue 📚',
          book: null,
          initialPage: 1
        }
      ]);
      setActiveTabId('tab-1');
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

  return (
    <div className="sanctuary-page-container">
      {/* Top Sanctuary Navbar */}
      <header className="sanctuary-top-nav">
        <div className="sanctuary-nav-left">
          <button
            type="button"
            className="btn-spring sanctuary-back-home-btn"
            onClick={() => onNavigate('home')}
            title="Return to Main Sanctuary Home"
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>Sanctuary Home</span>
          </button>

          <div className="sanctuary-brand-divider"></div>

          <div className="sanctuary-page-title-group">
            <span className="sanctuary-bengali-kicker">অনাবিল পাঠাগার</span>
            <h1 className="sanctuary-page-title">Reader Sanctuary</h1>
          </div>
        </div>

        <div className="sanctuary-nav-right">
          <button
            type="button"
            className="btn-spring sanctuary-switch-chamber-btn"
            onClick={() => onNavigate('author-fellowship')}
            title="Switch to Author Fellowship Studio"
          >
            <i className="fa-solid fa-feather-pointed"></i>
            <span>Author Studio</span>
          </button>

          <button
            type="button"
            className="sanctuary-theme-toggle"
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

      {/* Tab Bar Ribbon */}
      <div className="sanctuary-tabs-ribbon" role="tablist" aria-label="Open Manuscript Tabs">
        <div className="tabs-scroll-area">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              role="tab"
              aria-selected={tab.id === activeTabId}
              className={`sanctuary-tab-item ${tab.id === activeTabId ? 'active-tab' : ''}`}
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

          {/* New Tab Button */}
          <button
            type="button"
            className="btn-spring new-tab-btn"
            onClick={handleCreateNewTab}
            title="Open a new tab with catalogue search"
          >
            <i className="fa-solid fa-plus"></i>
            <span>New Tab</span>
          </button>
        </div>
      </div>

      {/* Tab Content Canvas */}
      <main className="sanctuary-main-viewport">
        {activeTab.book ? (
          <BookReader
            book={activeTab.book}
            initialPage={activeTab.initialPage || 1}
            onBackToSearch={handleBackToSearch}
          />
        ) : (
          <BookCatalogueBrowser
            title="Reader Sanctuary • Manuscript Directory"
            subtitle="Search, filter, and open literary folios into multiple concurrent reading tabs"
            onSelectBook={(book) => handleSelectBookInTab(book, 1)}
          />
        )}
      </main>
    </div>
  );
}
