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
import { AdminPortalPage } from './pages/AdminPortalPage';

function getInitialPage() {
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (path.includes('dashboard') || hash.includes('dashboard')) return 'home';
  if (hash.includes('admin') || path.includes('/admin')) return 'admin-portal';
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

  // Route protection: anyone can freely visit the homepage without login,
  // but protected chambers (Author Fellowship & Reader Sanctuary) require authentication.
  const isProtectedPage = currentPage === 'author-fellowship' || currentPage === 'reader-sanctuary';
  const effectivePage = (!loading && !isAuthenticated && isProtectedPage) ? 'login' : currentPage;

  // Sync URL hash if unauthenticated visitor tries to access a protected chamber directly
  useEffect(() => {
    if (!loading && !isAuthenticated && isProtectedPage) {
      if (window.location.hash !== '#login') {
        window.location.hash = '#login';
      }
    }
  }, [loading, isAuthenticated, isProtectedPage]);

  // Handle OAuth callback tokens, clean URL params, and smoothly navigate to post-login destination
  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hasOAuthParams = searchParams.has('code') || hash.includes('access_token=') || hash.includes('refresh_token=');
    const isDashboardPath = path.includes('/dashboard');

    if (isAuthenticated) {
      if (hasOAuthParams || isDashboardPath) {
        const dest = sessionStorage.getItem('oauth_destination') || 'home';
        sessionStorage.removeItem('oauth_destination');
        sessionStorage.removeItem('oauth_intended_role');

        // Clean URL so callback query tokens and /dashboard path do not linger
        window.history.replaceState(null, '', `${window.location.origin}/#${dest}`);
        const timer = setTimeout(() => {
          handleNavigate(dest);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, loading]);

  // Global Click-to-Sign-In Interception (Auth Gate)
  // When unauthenticated, intercept clicks across the site and navigate to LoginPage,
  // while explicitly exempting the Light/Dark Mode toggle so it executes freely for all guests.
  useEffect(() => {
    if (loading || isAuthenticated) {
      return;
    }

    if (effectivePage === 'login' || effectivePage === 'admin-portal') {
      return;
    }

    const handleGlobalClickCapture = (e) => {
      // 1. Unrestricted Theme Toggle Exemption:
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

      // 2. Passive scroll links exemption (ascend to top, chapter jump anchors)
      const isScrollAnchor = Boolean(
        e.target &&
        typeof e.target.closest === 'function' &&
        e.target.closest('.footer-ascend-link, a[href^="#stage-"]')
      );
      if (isScrollAnchor) {
        return;
      }

      // 3. Functional interactivity gate:
      // Clicking any functional tool, navigation item, book card, button, or link requires login
      const isInteractiveFunctional = Boolean(
        e.target &&
        typeof e.target.closest === 'function' &&
        e.target.closest('button, a, .fellowship-tool-card, .marquee-item, .catalogue-card, .nav-link-btn, .mobile-nav-link-btn, .footer-link-btn, .wax-seal-btn, [role="button"]')
      );

      if (isInteractiveFunctional) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation?.();
        handleNavigate('login');
      }
    };

    window.addEventListener('click', handleGlobalClickCapture, true);

    return () => {
      window.removeEventListener('click', handleGlobalClickCapture, true);
    };
  }, [loading, isAuthenticated, effectivePage]);

  // Standalone dedicated pages
  if (effectivePage === 'admin-portal') {
    return (
      <div className="admin-route-canvas">
        <AdminPortalPage
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

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
