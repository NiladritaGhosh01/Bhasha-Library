import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useParallax } from './hooks/useParallax';

import { Navbar } from './components/Navbar';
import { DualBackdrop } from './components/DualBackdrop';
import { ChapterNav } from './components/ChapterNav';
import { HeroSection } from './components/HeroSection';
import { TaglineSection } from './components/TaglineSection';
import { Footer } from './components/Footer';

import { LoginPage } from './pages/LoginPage';
import { ReaderSanctuaryPage } from './pages/ReaderSanctuaryPage';
import { AuthorFellowshipPage } from './pages/AuthorFellowshipPage';

function getInitialPage() {
  const hash = window.location.hash.toLowerCase();
  if (hash.includes('login')) return 'login';
  if (hash.includes('author')) return 'author-fellowship';
  if (hash.includes('reader')) return 'reader-sanctuary';
  return 'home';
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { activeChapter, scrollProgress } = useParallax();
  const [currentPage, setCurrentPage] = useState(getInitialPage);

  // Sync route with URL hash for browser back/forward and bookmarking
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.location.hash = `#${page}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (role) => {
    if (role === 'author') {
      handleNavigate('author-fellowship');
    } else {
      handleNavigate('reader-sanctuary');
    }
  };

  // Standalone dedicated pages
  if (currentPage === 'login') {
    return (
      <div className="login-route-canvas">
        <LoginPage
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  if (currentPage === 'reader-sanctuary') {
    return (
      <div className="reader-route-canvas">
        <ReaderSanctuaryPage
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

  if (currentPage === 'author-fellowship') {
    return (
      <div className="author-route-canvas">
        <AuthorFellowshipPage
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

  // Default Home Page ("Sanctuary Home")
  return (
    <div className="grand-canvas-wrap">
      {/* Slender Reading Ribbon along top edge */}
      <div
        className="reading-progress-ribbon"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      ></div>

      {/* Outer Grand Manuscript Canvas */}
      <div className="grand-manuscript-container bg-parchment-texture">
        {/* Subtle Dual Cultural Backdrop */}
        <DualBackdrop />

        {/* Chapter Index Tracker */}
        <ChapterNav
          activeChapter={activeChapter}
          onNavigate={handleNavigate}
        />

        {/* Top Literary Navbar */}
        <Navbar
          theme={theme}
          onToggleTheme={toggleTheme}
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />

        {/* Main Reading & Writing Sanctuary Content */}
        <main className="manuscript-main">
          {/* Chapter I: Sanctuary Hero */}
          <HeroSection onNavigate={handleNavigate} />

          {/* Chapter II: The Inscription with Interactive Tool Launchers + Book Covers Carousel */}
          <TaglineSection
            onNavigate={handleNavigate}
            onSelectBookPreview={() => handleNavigate('reader-sanctuary')}
          />
        </main>

        {/* Colophon Footer */}
        <Footer onNavigate={handleNavigate} />
      </div>
    </div>
  );
}
