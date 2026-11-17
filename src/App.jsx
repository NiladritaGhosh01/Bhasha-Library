import React, { useState, useEffect } from 'react';
import { useTheme } from './hooks/useTheme';
import { useParallax } from './hooks/useParallax';
import { useAuth } from './hooks/useAuth';

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
  const { isAuthenticated, loading } = useAuth();
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

  const handleLoginSuccess = (_role) => {
    // Redirect user back to the main home/dashboard view upon authentication
    handleNavigate('home');
  };

  // Determine effective page: protect restricted routes from unauthenticated access
  const isProtectedRoute = currentPage === 'author-fellowship' || currentPage === 'reader-sanctuary';
  const effectivePage = (!loading && !isAuthenticated && isProtectedRoute) ? 'login' : currentPage;

  // Sync URL hash if unauthenticated user navigated directly to a protected route
  useEffect(() => {
    if (!loading && !isAuthenticated && isProtectedRoute) {
      if (window.location.hash !== '#login') {
        window.location.hash = '#login';
      }
    }
  }, [loading, isAuthenticated, isProtectedRoute]);

  // Global Click-to-Sign-In Interception (Auth Gate)
  // When unauthenticated, intercept clicks across the site and navigate to LoginPage,
  // while explicitly exempting the Light/Dark Mode toggle so it executes freely for all guests.
  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    if (effectivePage === 'login') {
      return;
    }

    const handleGlobalClickCapture = (e) => {
      // Unrestricted Theme Toggle Exemption:
      // Check if target or any ancestor is a theme toggle button
      const isThemeToggle = Boolean(
        e.target &&
        typeof e.target.closest === 'function' &&
        e.target.closest('#themeToggleBtn, .navbar-theme-btn, .author-theme-toggle, .sanctuary-theme-toggle, [data-theme-toggle="true"]')
      );

      if (isThemeToggle) {
        // Allow theme toggle to execute freely with ZERO auth checks or redirects
        return;
      }

      // Any other click across the website is intercepted
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation?.();
      handleNavigate('login');
    };

    window.addEventListener('click', handleGlobalClickCapture, true);

    return () => {
      window.removeEventListener('click', handleGlobalClickCapture, true);
    };
  }, [loading, isAuthenticated, effectivePage]);

  // Standalone dedicated pages
  if (effectivePage === 'login') {
    return (
      <div className="login-route-canvas">
        <LoginPage
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

  if (effectivePage === 'reader-sanctuary') {
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

  if (effectivePage === 'author-fellowship') {
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
          currentPage={effectivePage}
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
