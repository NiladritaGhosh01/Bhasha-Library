import React, { useState, useEffect, useRef } from 'react';
import { bookService } from '../services/bookService';
import { ocrService } from '../services/ocrService';

const ADMIN_CREDENTIALS = {
  id: 'admin@bhashalibrary',
  password: 'abhirupbhashalibrary'
};

const MOTIFS = [
  { id: 'lotus', label: 'Lotus • পদ্ম', icon: 'fa-solid fa-spa' },
  { id: 'kash-flower', label: 'Kash-Flower • কাশফুল', icon: 'fa-solid fa-seedling' },
  { id: 'bengal-tiger', label: 'Bengal Tiger • বাঘ', icon: 'fa-solid fa-paw' },
  { id: 'inkpot-quill', label: 'Inkpot & Quill • দোয়াত-কলম', icon: 'fa-solid fa-feather-pointed' },
  { id: 'royal-peacock', label: 'Royal Peacock • ময়ূর', icon: 'fa-solid fa-crow' },
  { id: 'wheel-ashoka', label: 'Ashoka Wheel • চক্র', icon: 'fa-solid fa-dharmachakra' }
];

const COLOR_PRESETS = [
  { name: 'Imperial Maroon', color: '#4A1521', accent: '#D4AF37' },
  { name: 'Forest Moss', color: '#1A3323', accent: '#E27D5B' },
  { name: 'Terracotta Earth', color: '#5C1D0E', accent: '#D4AF37' },
  { name: 'Midnight Obsidian', color: '#1E1B2E', accent: '#A78BFA' },
  { name: 'Deep Indigo', color: '#102A43', accent: '#63B3ED' },
  { name: 'Royal Saffron', color: '#422006', accent: '#F6AD55' }
];

export function AdminPortalPage({ onNavigate, theme, onToggleTheme }) {
  // Admin Authentication State
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => {
    try {
      const stored = sessionStorage.getItem('bhasha_admin_vault_token');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed && parsed.authenticated === true;
      }
    } catch {
      // Fallback
    }
    return false;
  });

  const [adminIdInput, setAdminIdInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Tab: 'upload' | 'catalog' | 'diagnostics'
  const [activeTab, setActiveTab] = useState('upload');

  // OCR Backend Connectivity
  const [ocrStatus, setOcrStatus] = useState({ isOnline: false, checking: true, details: null });

  // Catalog State
  const [books, setBooks] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState('all'); // 'all' | 'canonical' | 'community'

  // Form State for Admin Upload
  const [uploadMode, setUploadMode] = useState('pdf-ocr'); // 'pdf-ocr' | 'manual'
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrLanguages, setOcrLanguages] = useState('ben+eng');

  const [bookTitle, setBookTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [genre, setGenre] = useState('Classical Literature');
  const [summary, setSummary] = useState('');
  const [coverColor, setCoverColor] = useState('#4A1521');
  const [coverAccent, setCoverAccent] = useState('#D4AF37');
  const [coverMotif, setCoverMotif] = useState('lotus');

  // Extracted / Manual Pages
  const [pagesData, setPagesData] = useState([
    {
      pageNumber: 1,
      title: 'Chapter I — Opening Folio',
      paragraphs: ['']
    }
  ]);

  // Loading & Alerts
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }
  const fileInputRef = useRef(null);

  // Subscribe to book service catalog
  useEffect(() => {
    const unsubscribe = bookService.subscribe((allBooks) => {
      setBooks(allBooks);
    });
    return () => unsubscribe();
  }, []);

  // Check OCR backend health
  const checkOcrHealth = async () => {
    setOcrStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await ocrService.checkHealth();
      setOcrStatus({
        isOnline: res.isOnline,
        checking: false,
        details: res.data || null,
        error: res.error || null
      });
    } catch (err) {
      setOcrStatus({
        isOnline: false,
        checking: false,
        details: null,
        error: err.message
      });
    }
  };

  useEffect(() => {
    let active = true;
    if (isAdminAuthed) {
      ocrService.checkHealth().then(res => {
        if (active) {
          setOcrStatus({
            isOnline: res.isOnline,
            checking: false,
            details: res.data || null,
            error: res.error || null
          });
        }
      }).catch(err => {
        if (active) {
          setOcrStatus({
            isOnline: false,
            checking: false,
            details: null,
            error: err.message
          });
        }
      });
    }
    return () => {
      active = false;
    };
  }, [isAdminAuthed]);

  // Handle Admin Sign In
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    const cleanId = adminIdInput.trim().toLowerCase();
    const cleanPw = adminPasswordInput;

    const isValidId = cleanId === ADMIN_CREDENTIALS.id || cleanId === `${ADMIN_CREDENTIALS.id}.com`;
    const isValidPw = cleanPw === ADMIN_CREDENTIALS.password;

    if (isValidId && isValidPw) {
      const token = {
        authenticated: true,
        adminId: cleanId,
        timestamp: Date.now()
      };
      sessionStorage.setItem('bhasha_admin_vault_token', JSON.stringify(token));
      setIsAdminAuthed(true);
      setAdminPasswordInput('');
    } else {
      setAuthError('Invalid Admin ID or Master Password. Access restricted to authorized library curators.');
    }
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    sessionStorage.removeItem('bhasha_admin_vault_token');
    setIsAdminAuthed(false);
    setAdminIdInput('');
    setAdminPasswordInput('');
  };

  // Handle File Change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFeedback(null);
      // Auto-populate title if empty
      if (!bookTitle) {
        const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
        setBookTitle(rawName.charAt(0).toUpperCase() + rawName.slice(1));
      }
    }
  };

  // Trigger OCR Preview Only
  const handleRunOcrPreview = async () => {
    if (!selectedFile) {
      setFeedback({ type: 'error', message: 'Please select a PDF or image file first.' });
      return;
    }

    setIsProcessing(true);
    setProgressMsg('Uploading file to Python OCR microservice and extracting folios...');
    setFeedback(null);

    try {
      const result = await ocrService.extractPreview(selectedFile, ocrLanguages);
      if (result.pagesData && result.pagesData.length > 0) {
        setPagesData(result.pagesData);
        if (result.extractedText && !summary) {
          setSummary(result.extractedText.slice(0, 300) + '...');
        }
        setFeedback({
          type: 'success',
          message: `Successfully extracted ${result.totalPages || result.pagesData.length} folios with Bengali/English OCR. Review below before saving.`
        });
      } else {
        throw new Error('OCR returned no readable text.');
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `OCR Microservice Notice: ${err.message}. If the Python server is offline, start it with "npm run ocr:server" or enter manuscript text manually below.`
      });
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Add Page for Manual Entry
  const handleAddPage = () => {
    setPagesData(prev => [
      ...prev,
      {
        pageNumber: prev.length + 1,
        title: `Chapter ${prev.length + 1} — Folio Inscription`,
        paragraphs: ['']
      }
    ]);
  };

  // Remove Page
  const handleRemovePage = (index) => {
    if (pagesData.length <= 1) return;
    setPagesData(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update Page Title
  const handlePageTitleChange = (index, value) => {
    setPagesData(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], title: value };
      return copy;
    });
  };

  // Update Paragraph Content
  const handleParagraphChange = (pageIdx, paraIdx, value) => {
    setPagesData(prev => {
      const copy = [...prev];
      const pageCopy = { ...copy[pageIdx] };
      const paras = [...(pageCopy.paragraphs || [''])];
      paras[paraIdx] = value;
      pageCopy.paragraphs = paras;
      copy[pageIdx] = pageCopy;
      return copy;
    });
  };

  // Add Paragraph to Page
  const handleAddParagraph = (pageIdx) => {
    setPagesData(prev => {
      const copy = [...prev];
      const pageCopy = { ...copy[pageIdx] };
      pageCopy.paragraphs = [...(pageCopy.paragraphs || []), ''];
      copy[pageIdx] = pageCopy;
      return copy;
    });
  };

  // Submit Admin Upload
  const handleSaveManuscript = async (e) => {
    e.preventDefault();

    if (!bookTitle.trim()) {
      setFeedback({ type: 'error', message: 'Book Title is required.' });
      return;
    }
    if (!authorName.trim()) {
      setFeedback({ type: 'error', message: 'Author name is required.' });
      return;
    }

    const yearNum = parseInt(publicationYear, 10);
    if (isNaN(yearNum) || yearNum < 1000 || yearNum > 2100) {
      setFeedback({ type: 'error', message: 'Please enter a valid publication year (1000–2100).' });
      return;
    }

    // Clean pages data
    const cleanedPages = pagesData.map((page, idx) => ({
      pageNumber: idx + 1,
      title: page.title?.trim() || `Folio ${idx + 1}`,
      paragraphs: (page.paragraphs || [])
        .map(p => (typeof p === 'string' ? p.trim() : ''))
        .filter(Boolean)
    }));

    if (cleanedPages.length === 0 || cleanedPages.every(p => p.paragraphs.length === 0)) {
      cleanedPages[0] = {
        pageNumber: 1,
        title: 'Initial Folio',
        paragraphs: [summary.trim() || 'A newly curated canonical volume inscribed into the Bhasha Library collection.']
      };
    }

    setIsProcessing(true);
    setProgressMsg('Inscribing canonical volume into the Bhasha Library archive...');
    setFeedback(null);

    try {
      const cleanId = `${bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 35)}-${yearNum}`;
      const decade = `${Math.floor(yearNum / 10) * 10}s`;

      const manuscriptData = {
        id: cleanId,
        name: bookTitle.trim(),
        author: authorName.trim(),
        yearPublished: yearNum,
        decade: decade,
        genre: genre,
        pages: cleanedPages.length,
        summary: summary.trim() || `Archival canonical volume by ${authorName.trim()}, published in ${yearNum}.`,
        coverColor: coverColor,
        coverAccent: coverAccent,
        coverMotif: coverMotif,
        isOfficialCanonical: true, // Master Admin reference
        uploadedByRole: 'admin',
        uploadedByEmail: ADMIN_CREDENTIALS.id,
        pagesData: cleanedPages
      };

      await bookService.addManuscript(manuscriptData);

      setFeedback({
        type: 'success',
        message: `Success! "${bookTitle}" has been inscribed as an Official Canonical Reference Book in the Bhasha Library. Visitors can now discover and read it in the Reader Sanctuary!`
      });

      // Reset form fields
      setBookTitle('');
      setAuthorName('');
      setPublicationYear('');
      setSummary('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPagesData([{ pageNumber: 1, title: 'Chapter I — Opening Folio', paragraphs: [''] }]);
      setActiveTab('catalog');
    } catch (err) {
      setFeedback({
        type: 'error',
        message: `Inscription Error: ${err.message}`
      });
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  // Toggle Canonical Status
  const handleToggleCanonical = async (bookId) => {
    try {
      await bookService.toggleCanonicalStatus(bookId);
    } catch (err) {
      alert(`Could not update status: ${err.message}`);
    }
  };

  // Delete Manuscript
  const handleDeleteManuscript = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently remove "${book.name}" by ${book.author} from the archival catalog?`
    );
    if (confirmed) {
      try {
        await bookService.deleteManuscript(book.id);
      } catch (err) {
        alert(`Deletion failed: ${err.message}`);
      }
    }
  };

  // Filtered books
  const filteredBooks = books.filter(b => {
    const q = catalogSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      b.name.toLowerCase().includes(q) || 
      b.author.toLowerCase().includes(q) || 
      (b.genre && b.genre.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (catalogFilter === 'canonical') return Boolean(b.isOfficialCanonical);
    if (catalogFilter === 'community') return !b.isOfficialCanonical;
    return true;
  });

  // Calculate stats
  const totalBooks = books.length;
  const canonicalCount = books.filter(b => b.isOfficialCanonical).length;
  const communityCount = totalBooks - canonicalCount;
  const totalPages = books.reduce((acc, b) => acc + (b.pages || 1), 0);
  const totalClicks = books.reduce((acc, b) => acc + (b.clicks || 0), 0);

  // ---------------------------------------------------------------------------
  // 1. Unauthenticated Admin Login Gate
  // ---------------------------------------------------------------------------
  if (!isAdminAuthed) {
    return (
      <div className="admin-page-wrapper" data-purpose="admin-auth-gate">
        <div className="admin-auth-container">
          <div className="admin-auth-card">
            {/* Wax Seal Emblem */}
            <div className="admin-vault-seal" aria-hidden="true">
              <i className="fa-solid fa-shield-halved"></i>
            </div>

            <span className="admin-vault-kicker">Curator & Administrator Sanctuary</span>
            <h2 className="admin-vault-title">Bhasha Archival Vault</h2>
            <p className="admin-vault-bengali">প্রশাসক ও প্রধান কিউরেটর প্রবেশদ্বার</p>
            <p className="admin-vault-desc">
              This chamber is strictly reserved for the Chief Library Curator. Enter your administrative credentials to manage canonical volumes, execute OCR ingestion, and govern the manuscript archives.
            </p>

            {authError && (
              <div className="admin-auth-error-banner" role="alert">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="admin-auth-form">
              <div className="admin-form-group">
                <label htmlFor="adminIdInput" className="admin-label">
                  <i className="fa-solid fa-user-shield"></i>
                  <span>Curator Identity (Admin ID)</span>
                </label>
                <input
                  id="adminIdInput"
                  type="text"
                  className="admin-input"
                  placeholder="admin@bhashalibrary"
                  value={adminIdInput}
                  onChange={(e) => setAdminIdInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="adminPasswordInput" className="admin-label">
                  <i className="fa-solid fa-key"></i>
                  <span>Master Password</span>
                </label>
                <div className="admin-password-wrap">
                  <input
                    id="adminPasswordInput"
                    type={showPassword ? 'text' : 'password'}
                    className="admin-input"
                    placeholder="Enter vault password"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="admin-pw-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="admin-submit-btn">
                <i className="fa-solid fa-unlock-keyhole"></i>
                <span>Unlock Archival Vault • প্রবেশ করুন</span>
              </button>
            </form>

            <div className="admin-auth-footer">
              <button
                type="button"
                className="admin-return-link"
                onClick={() => onNavigate('home')}
              >
                <i className="fa-solid fa-arrow-left"></i>
                <span>Return to Public Sanctuary</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Authenticated Admin Portal Suite
  // ---------------------------------------------------------------------------
  return (
    <div className="admin-page-wrapper" data-purpose="admin-portal-suite">
      {/* Top Administrative Header */}
      <header className="admin-portal-header">
        <div className="admin-header-content">
          <div className="admin-brand-cluster">
            <div className="admin-header-badge">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h1 className="admin-portal-heading">Curator Archival Vault</h1>
              <span className="admin-portal-subheading">
                Bhasha Library • Master Administrative & OCR Management
              </span>
            </div>
          </div>

          <div className="admin-header-status-cluster">
            {/* Status Pills */}
            <div className="admin-pill admin-pill-identity" title="Authenticated Curator">
              <i className="fa-solid fa-circle-check"></i>
              <span>{ADMIN_CREDENTIALS.id}</span>
            </div>

            <div
              className={`admin-pill admin-pill-ocr ${ocrStatus.isOnline ? 'ocr-online' : 'ocr-offline'}`}
              onClick={checkOcrHealth}
              title="Click to re-ping Python OCR microservice"
              role="button"
              tabIndex={0}
            >
              <span className="ocr-dot"></span>
              <span>
                {ocrStatus.checking ? 'Pinging OCR...' : ocrStatus.isOnline ? 'OCR Server Online (ben+eng)' : 'OCR Offline (Manual Ready)'}
              </span>
            </div>

            {/* Navigation Actions */}
            <button
              type="button"
              className="admin-header-action-btn"
              onClick={() => onNavigate('reader-sanctuary')}
              title="Visit Reader Sanctuary"
            >
              <i className="fa-solid fa-book-open"></i>
              <span>Reader Sanctuary</span>
            </button>

            <button
              type="button"
              className="admin-header-action-btn"
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <i className={theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon'}></i>
            </button>

            <button
              type="button"
              className="admin-header-action-btn admin-logout-btn"
              onClick={handleAdminLogout}
              title="Lock Vault & Log Out"
            >
              <i className="fa-solid fa-lock"></i>
              <span>Lock Vault</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="admin-tabs-nav" aria-label="Admin Navigation Tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <i className="fa-solid fa-feather-pointed"></i>
            <span>Inscribe Official Volume (আপলোড ও ওসিআর)</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <i className="fa-solid fa-boxes-stacked"></i>
            <span>Master Archival Directory ({books.length})</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => setActiveTab('diagnostics')}
          >
            <i className="fa-solid fa-microchip"></i>
            <span>OCR Engine & Architecture</span>
          </button>
        </nav>
      </header>

      {/* Main Admin Workspace Container */}
      <main className="admin-workspace-body">
        {/* Feedback Alerts */}
        {feedback && (
          <div className={`admin-alert admin-alert-${feedback.type}`} role="alert">
            <i className={feedback.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'}></i>
            <div className="admin-alert-text">
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              className="admin-alert-close"
              onClick={() => setFeedback(null)}
              aria-label="Close notification"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        )}

        {/* TAB 1: UPLOAD & OCR INGESTION */}
        {activeTab === 'upload' && (
          <section className="admin-upload-section">
            <div className="admin-section-intro">
              <h2 className="admin-section-title">Official Canonical Manuscript Inscription</h2>
              <p className="admin-section-bengali">
                দর্শকদের জন্য প্রামাণ্য গ্রন্থ ও পাণ্ডুলিপি প্রকাশ করুন — বাংলা ও ইংরেজি ওসিআর সহযোগে
              </p>
              <p className="admin-section-desc">
                Books uploaded through this portal are inscribed as <strong>Official Canonical Volumes</strong> and highlighted for all visitors in the library catalogue. You can upload scanned PDF manuscripts to pass through the lightweight Python Bengali+English OCR engine, or format folios directly.
              </p>
            </div>

            <form onSubmit={handleSaveManuscript} className="admin-manuscript-form">
              {/* Ingestion Mode Selector */}
              <div className="admin-mode-toggle-group">
                <button
                  type="button"
                  className={`admin-mode-pill ${uploadMode === 'pdf-ocr' ? 'active' : ''}`}
                  onClick={() => setUploadMode('pdf-ocr')}
                >
                  <i className="fa-solid fa-file-pdf"></i>
                  <span>PDF Document + Tesseract OCR (স্বয়ংক্রিয় ওসিআর)</span>
                </button>
                <button
                  type="button"
                  className={`admin-mode-pill ${uploadMode === 'manual' ? 'active' : ''}`}
                  onClick={() => setUploadMode('manual')}
                >
                  <i className="fa-solid fa-pen-nib"></i>
                  <span>Manual Folio & Text Formatting (সরাসরি টেক্সট)</span>
                </button>
              </div>

              {/* Mode A: PDF OCR Dropzone */}
              {uploadMode === 'pdf-ocr' && (
                <div className="admin-card admin-ocr-card">
                  <div className="admin-card-header">
                    <div className="admin-card-icon">
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div>
                      <h3 className="admin-card-title">Lightweight Python OCR Microservice Ingestion</h3>
                      <p className="admin-card-subtitle">
                        Captures page screenshots of your uploaded PDF and executes Bengali (বাংলা) & English OCR
                      </p>
                    </div>
                  </div>

                  <div className="admin-file-dropzone" onClick={() => fileInputRef.current?.click()}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
                      style={{ display: 'none' }}
                    />
                    <div className="dropzone-inner">
                      <div className="dropzone-icon">
                        <i className={selectedFile ? 'fa-solid fa-file-pdf' : 'fa-solid fa-cloud-arrow-up'}></i>
                      </div>
                      <div className="dropzone-labels">
                        <strong className="dropzone-main-text">
                          {selectedFile ? selectedFile.name : 'Click to select or drag and drop manuscript PDF/Image'}
                        </strong>
                        <span className="dropzone-sub-text">
                          {selectedFile
                            ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for processing`
                            : 'Supports Bengali and English manuscripts (PDF, PNG, JPG)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-ocr-controls-row">
                    <div className="ocr-lang-group">
                      <label htmlFor="ocrLangSelect" className="ocr-control-label">
                        <i className="fa-solid fa-language"></i> OCR Language Recognition:
                      </label>
                      <select
                        id="ocrLangSelect"
                        className="admin-select"
                        value={ocrLanguages}
                        onChange={(e) => setOcrLanguages(e.target.value)}
                      >
                        <option value="ben+eng">Bengali + English (বাংলা ও ইংরেজি - Recommended)</option>
                        <option value="ben">Bengali Only (কেবল বাংলা)</option>
                        <option value="eng">English Only</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      className="admin-action-btn-secondary"
                      onClick={handleRunOcrPreview}
                      disabled={!selectedFile || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i>
                          <span>Running OCR Extraction...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-eye"></i>
                          <span>Run OCR & Preview Folios</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Book Metadata Grid */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-icon">
                    <i className="fa-solid fa-book-bookmark"></i>
                  </div>
                  <div>
                    <h3 className="admin-card-title">Archival Metadata & Identification</h3>
                    <p className="admin-card-subtitle">
                      Canonical catalog details visible to visitors in the sanctuary
                    </p>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label htmlFor="bookTitle" className="admin-label">
                      <span>Manuscript Title (English & Bengali)</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      id="bookTitle"
                      type="text"
                      className="admin-input"
                      placeholder="e.g. Char Adhyay (চার অধ্যায়)"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="authorName" className="admin-label">
                      <span>Author Name (English & Bengali)</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      id="authorName"
                      type="text"
                      className="admin-input"
                      placeholder="e.g. Rabindranath Tagore (রবীন্দ্রনাথ ঠাকুর)"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="publicationYear" className="admin-label">
                      <span>Publication Year</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      id="publicationYear"
                      type="number"
                      className="admin-input"
                      placeholder="e.g. 1934"
                      value={publicationYear}
                      onChange={(e) => setPublicationYear(e.target.value)}
                      min="1000"
                      max="2100"
                      required
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="genreSelect" className="admin-label">
                      <span>Literary Genre / Category</span>
                    </label>
                    <select
                      id="genreSelect"
                      className="admin-select"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                    >
                      <option value="Classical Literature">Classical Literature (চিরায়ত সাহিত্য)</option>
                      <option value="Poetry & Mysticism">Poetry & Mysticism (কবিতা ও আধ্যাত্মিকতা)</option>
                      <option value="Rural Realism">Rural Realism (পল্লী জীবন ও বাস্তবতা)</option>
                      <option value="Social & Political">Social & Political (সামাজিক ও রাজনৈতিক)</option>
                      <option value="Historical Epic">Historical Epic (ঐতিহাসিক আখ্যান)</option>
                      <option value="Philosophical Essay">Philosophical Essay (দার্শনিক প্রবন্ধ)</option>
                      <option value="Folk & Oral Tradition">Folk & Oral Tradition (লোকসাহিত্য)</option>
                    </select>
                  </div>

                  <div className="admin-form-field full-width">
                    <label htmlFor="bookSummary" className="admin-label">
                      <span>Archival Overview / Inscription Summary</span>
                    </label>
                    <textarea
                      id="bookSummary"
                      className="admin-textarea"
                      rows={3}
                      placeholder="Provide a concise introduction summarizing the thematic motifs, historical importance, and cultural resonance of this manuscript..."
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Heritage Cover Customization */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-icon">
                    <i className="fa-solid fa-palette"></i>
                  </div>
                  <div>
                    <h3 className="admin-card-title">Heritage Cover Design & Binding</h3>
                    <p className="admin-card-subtitle">
                      Visual appearance in the interactive carousel and book catalogue
                    </p>
                  </div>
                </div>

                <div className="admin-cover-designer-grid">
                  <div className="cover-controls-pane">
                    <div className="admin-form-field">
                      <label className="admin-label">Heritage Color Presets</label>
                      <div className="preset-swatches-row">
                        {COLOR_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            className={`color-preset-pill ${coverColor === p.color ? 'active' : ''}`}
                            onClick={() => {
                              setCoverColor(p.color);
                              setCoverAccent(p.accent);
                            }}
                            title={p.name}
                          >
                            <span className="swatch" style={{ backgroundColor: p.color, borderColor: p.accent }}></span>
                            <span className="preset-name">{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="admin-form-field">
                      <label className="admin-label">Cultural Motif Inscription</label>
                      <div className="motif-options-grid">
                        {MOTIFS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className={`motif-select-btn ${coverMotif === m.id ? 'active' : ''}`}
                            onClick={() => setCoverMotif(m.id)}
                          >
                            <i className={m.icon}></i>
                            <span>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Cover Preview */}
                  <div className="cover-preview-pane">
                    <span className="preview-label">Live Cover Preview:</span>
                    <div
                      className="archival-cover-card-preview"
                      style={{
                        backgroundColor: coverColor,
                        borderColor: coverAccent,
                        boxShadow: `0 10px 25px -5px ${coverColor}66`
                      }}
                    >
                      <div className="preview-cover-motif" style={{ color: coverAccent }}>
                        <i
                          className={
                            MOTIFS.find(m => m.id === coverMotif)?.icon || 'fa-solid fa-spa'
                          }
                        ></i>
                      </div>
                      <div className="preview-cover-content">
                        <span className="preview-cover-badge" style={{ borderColor: coverAccent, color: coverAccent }}>
                          Official Canonical Volume
                        </span>
                        <h4 className="preview-cover-title">{bookTitle || 'Manuscript Title'}</h4>
                        <p className="preview-cover-author">{authorName || 'Author Name'}</p>
                        <span className="preview-cover-year">{publicationYear || 'Year'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Folios / Pages Editor */}
              <div className="admin-card">
                <div className="admin-card-header admin-card-header-with-actions">
                  <div className="admin-card-header-left">
                    <div className="admin-card-icon">
                      <i className="fa-solid fa-scroll"></i>
                    </div>
                    <div>
                      <h3 className="admin-card-title">Folios & Extracted Content ({pagesData.length} Pages)</h3>
                      <p className="admin-card-subtitle">
                        Inspect and edit the digitized pages and paragraphs that visitors will read in the sanctuary
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="admin-action-btn-secondary"
                    onClick={handleAddPage}
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Add Another Folio / Page</span>
                  </button>
                </div>

                <div className="admin-folios-list">
                  {pagesData.map((page, pIdx) => (
                    <div key={pIdx} className="admin-folio-item">
                      <div className="folio-item-header">
                        <div className="folio-number-badge">
                          <i className="fa-solid fa-bookmark"></i>
                          <span>Folio Page {pIdx + 1}</span>
                        </div>
                        <input
                          type="text"
                          className="folio-title-input"
                          placeholder="Chapter / Page Title (e.g. Chapter I — The Awakening)"
                          value={page.title || ''}
                          onChange={(e) => handlePageTitleChange(pIdx, e.target.value)}
                        />
                        {pagesData.length > 1 && (
                          <button
                            type="button"
                            className="folio-remove-btn"
                            onClick={() => handleRemovePage(pIdx)}
                            title="Remove this page"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>

                      <div className="folio-paragraphs-list">
                        {(page.paragraphs || ['']).map((para, paraIdx) => (
                          <div key={paraIdx} className="folio-para-row">
                            <span className="para-idx-label">¶{paraIdx + 1}</span>
                            <textarea
                              className="folio-para-textarea"
                              rows={3}
                              placeholder="Type or paste the extracted paragraph text in Bengali or English..."
                              value={para}
                              onChange={(e) => handleParagraphChange(pIdx, paraIdx, e.target.value)}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          className="folio-add-para-btn"
                          onClick={() => handleAddParagraph(pIdx)}
                        >
                          <i className="fa-solid fa-plus"></i>
                          <span>Add Paragraph</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submission Bar */}
              <div className="admin-submit-bar">
                <div className="submit-info">
                  <i className="fa-solid fa-circle-info"></i>
                  <span>
                    Volume will be published immediately to the public catalogue with official canonical privileges.
                  </span>
                </div>
                <button
                  type="submit"
                  className="admin-submit-large-btn"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>{progressMsg || 'Inscribing Canonical Volume...'}</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-feather-pointed"></i>
                      <span>Inscribe Volume to Canonical Archive • সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* TAB 2: MASTER ARCHIVAL DIRECTORY */}
        {activeTab === 'catalog' && (
          <section className="admin-catalog-section">
            <div className="admin-section-intro">
              <h2 className="admin-section-title">Master Archival Directory</h2>
              <p className="admin-section-bengali">
                গ্রন্থাগারের সমস্ত সংরক্ষিত বই ও পাণ্ডুলিপির প্রশাসনিক নিয়ন্ত্রণ
              </p>
              <p className="admin-section-desc">
                Review and govern all preserved volumes. Toggle canonical designations, inspect reader popularity metrics, or remove outdated entries from the database.
              </p>
            </div>

            {/* Metrics Ribbon */}
            <div className="admin-metrics-ribbon">
              <div className="admin-metric-card">
                <div className="metric-icon">
                  <i className="fa-solid fa-book-journal-whills"></i>
                </div>
                <div>
                  <span className="metric-label">Total Volumes</span>
                  <strong className="metric-value">{totalBooks}</strong>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-icon icon-gold">
                  <i className="fa-solid fa-crown"></i>
                </div>
                <div>
                  <span className="metric-label">Official Canonical</span>
                  <strong className="metric-value">{canonicalCount}</strong>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-icon icon-teal">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <span className="metric-label">Community Folios</span>
                  <strong className="metric-value">{communityCount}</strong>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-icon">
                  <i className="fa-solid fa-scroll"></i>
                </div>
                <div>
                  <span className="metric-label">Digitized Folios</span>
                  <strong className="metric-value">{totalPages}</strong>
                </div>
              </div>

              <div className="admin-metric-card">
                <div className="metric-icon icon-rose">
                  <i className="fa-solid fa-arrow-trend-up"></i>
                </div>
                <div>
                  <span className="metric-label">Reader Engagements</span>
                  <strong className="metric-value">{totalClicks}</strong>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="admin-catalog-toolbar">
              <div className="catalog-search-wrap">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  className="catalog-search-input"
                  placeholder="Search catalog by title, author, or genre..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                />
              </div>

              <div className="catalog-filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${catalogFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCatalogFilter('all')}
                >
                  All Volumes ({totalBooks})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${catalogFilter === 'canonical' ? 'active' : ''}`}
                  onClick={() => setCatalogFilter('canonical')}
                >
                  Canonical Reference ({canonicalCount})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${catalogFilter === 'community' ? 'active' : ''}`}
                  onClick={() => setCatalogFilter('community')}
                >
                  Community Submissions ({communityCount})
                </button>
              </div>
            </div>

            {/* Books Table / Directory */}
            <div className="admin-books-directory-container">
              {filteredBooks.length === 0 ? (
                <div className="admin-empty-state">
                  <i className="fa-solid fa-book-open"></i>
                  <p>No manuscripts match the selected search or filter criteria.</p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-books-table">
                    <thead>
                      <tr>
                        <th>Manuscript & Author</th>
                        <th>Year & Genre</th>
                        <th>Classification</th>
                        <th>Pages</th>
                        <th>Reader Engagements</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map((book) => {
                        const isCanonical = Boolean(book.isOfficialCanonical);
                        return (
                          <tr key={book.id}>
                            <td className="cell-book-info">
                              <div
                                className="table-book-swatch"
                                style={{
                                  backgroundColor: book.coverColor || '#3D1308',
                                  borderColor: book.coverAccent || '#D4AF37'
                                }}
                              >
                                <i className="fa-solid fa-book"></i>
                              </div>
                              <div className="table-book-text">
                                <strong className="table-book-title">{book.name}</strong>
                                <span className="table-book-author">{book.author}</span>
                              </div>
                            </td>

                            <td className="cell-meta">
                              <span className="table-year">{book.yearPublished}</span>
                              <span className="table-genre">{book.genre || 'Literature'}</span>
                            </td>

                            <td className="cell-status">
                              {isCanonical ? (
                                <span className="badge-canonical" title="Admin Curated Master Reference">
                                  <i className="fa-solid fa-crown"></i> Official Canonical
                                </span>
                              ) : (
                                <span className="badge-community" title="Contributed by community visitor">
                                  <i className="fa-solid fa-user-pen"></i> Community Folio
                                </span>
                              )}
                            </td>

                            <td className="cell-pages">
                              <span>{book.pages || (book.pagesData ? book.pagesData.length : 1)} folios</span>
                            </td>

                            <td className="cell-clicks">
                              <span className="clicks-count">
                                <i className="fa-solid fa-eye"></i> {book.clicks || 0}
                              </span>
                            </td>

                            <td className="cell-actions">
                              <button
                                type="button"
                                className="action-icon-btn read-btn"
                                onClick={() => onNavigate('reader-sanctuary')}
                                title="Open in Reader Sanctuary"
                              >
                                <i className="fa-solid fa-arrow-up-right-from-square"></i>
                              </button>

                              <button
                                type="button"
                                className={`action-icon-btn toggle-btn ${isCanonical ? 'is-canon' : ''}`}
                                onClick={() => handleToggleCanonical(book.id)}
                                title={isCanonical ? 'Demote to Community Folio' : 'Promote to Official Canonical'}
                              >
                                <i className="fa-solid fa-crown"></i>
                              </button>

                              <button
                                type="button"
                                className="action-icon-btn delete-btn"
                                onClick={() => handleDeleteManuscript(book)}
                                title="Permanently Delete Manuscript"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: OCR & ARCHITECTURE DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <section className="admin-diagnostics-section">
            <div className="admin-section-intro">
              <h2 className="admin-section-title">OCR Microservice & Architectural Diagnostics</h2>
              <p className="admin-section-bengali">
                পাইথন টিসেরাক্ট ওসিআর ইঞ্জিন ও ব্যাকএন্ড সংযোগ
              </p>
              <p className="admin-section-desc">
                The Bhasha Library incorporates a lightweight Python microservice providing high-precision Optical Character Recognition for Bengali (*ben*) and English (*eng*) documents.
              </p>
            </div>

            <div className="diagnostics-grid">
              {/* Server Status Card */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-icon">
                    <i className="fa-solid fa-server"></i>
                  </div>
                  <div>
                    <h3 className="admin-card-title">Python OCR Server Health</h3>
                    <p className="admin-card-subtitle">Endpoint: http://127.0.0.1:8000</p>
                  </div>
                </div>

                <div className="diagnostics-status-row">
                  <div className="status-indicator-box">
                    <span className={`status-orb ${ocrStatus.isOnline ? 'orb-green' : 'orb-red'}`}></span>
                    <strong>{ocrStatus.isOnline ? 'Operational & Ready' : 'Service Offline'}</strong>
                  </div>
                  <button
                    type="button"
                    className="admin-action-btn-secondary"
                    onClick={checkOcrHealth}
                  >
                    <i className="fa-solid fa-arrows-rotate"></i>
                    <span>Re-check Connectivity</span>
                  </button>
                </div>

                {ocrStatus.details && (
                  <div className="diagnostics-code-box">
                    <pre>{JSON.stringify(ocrStatus.details, null, 2)}</pre>
                  </div>
                )}
              </div>

              {/* Microservice Quick-Start */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <div className="admin-card-icon">
                    <i className="fa-solid fa-terminal"></i>
                  </div>
                  <div>
                    <h3 className="admin-card-title">Terminal Commands</h3>
                    <p className="admin-card-subtitle">Launch or manage the backend OCR service</p>
                  </div>
                </div>

                <div className="cli-commands-list">
                  <div className="cli-command-item">
                    <span className="cli-desc">1. Launch Python OCR FastAPI Microservice:</span>
                    <code className="cli-code">npm run ocr:server</code>
                  </div>

                  <div className="cli-command-item">
                    <span className="cli-desc">2. Download & Verify Bengali/English Traineddata:</span>
                    <code className="cli-code">npm run ocr:setup</code>
                  </div>

                  <div className="cli-command-item">
                    <span className="cli-desc">3. Command-Line Direct Batch Ingestion:</span>
                    <code className="cli-code">python backend/cli_upload.py --file manuscript.pdf --title "Gora" --author "Tagore"</code>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
