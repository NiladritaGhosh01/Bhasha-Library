import React, { useState, useEffect, useRef } from 'react';
import { bookService } from '../services/bookService';
import { ocrService } from '../services/ocrService';
import { useAuth } from '../hooks/useAuth';

const COVER_MOTIFS = [
  { id: 'lotus', label: 'Lotus (পদ্ম)' },
  { id: 'kash-flower', label: 'Kash Flower (কাশফুল)' },
  { id: 'forest-canopy', label: 'Forest Canopy (শালবন)' },
  { id: 'quill-tear', label: 'Quill & Tear (কলম ও অশ্রু)' },
  { id: 'pine-needle', label: 'Pine Needle (পাইন বন)' },
  { id: 'river-skiff', label: 'River Skiff (ডিঙ্গি নৌকা)' },
  { id: 'crescent-peak', label: 'Crescent Peak (চাঁদের পাহাড়)' },
  { id: 'sanctuary-bell', label: 'Sanctuary Bell (মন্দিরের ঘণ্টা)' },
  { id: 'ocean-mist', label: 'Ocean Mist (সমুদ্র কুয়াশা)' },
  { id: 'autumn-owl', label: 'Autumn Owl (হুতুম প্যাঁচা)' }
];

const PRESET_PALETTES = [
  { name: 'Crimson & Gold', bg: '#4A1521', accent: '#D4AF37' },
  { name: 'Forest Ochre', bg: '#1B2E1D', accent: '#8BA888' },
  { name: 'Deep Indigo', bg: '#17222B', accent: '#81A4CD' },
  { name: 'Terracotta Earth', bg: '#3D1308', accent: '#E27D5B' },
  { name: 'Warm Leather', bg: '#2F1E0E', accent: '#DDA15E' }
];

export function AddManuscriptModal({ 
  isOpen, 
  onClose, 
  onManuscriptAdded,
  initialMode = 'user' // 'admin' | 'user'
}) {
  const { user, currentUser } = useAuth();
  const activeUser = user || currentUser;

  // Upload Pathway: 'admin' (Curated visitor reference) vs 'user' (Community / Author)
  const [uploadChannel, setUploadChannel] = useState(initialMode === 'admin' ? 'admin' : 'user');

  // Input Method: 'ocr' (PDF / Image OCR) vs 'manual' (Direct Text)
  const [inputMethod, setInputMethod] = useState('ocr');

  // Metadata States
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [yearPublished, setYearPublished] = useState(new Date().getFullYear());
  const [genre, setGenre] = useState('Classical Literature');
  const [summary, setSummary] = useState('');
  const [coverMotif, setCoverMotif] = useState('lotus');
  const [coverColor, setCoverColor] = useState(PRESET_PALETTES[0].bg);
  const [coverAccent, setCoverAccent] = useState(PRESET_PALETTES[0].accent);

  // Manual Inscription State
  const [firstPageTitle, setFirstPageTitle] = useState('Chapter I — Initial Inscription');
  const [firstParagraph, setFirstParagraph] = useState('');

  // OCR Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [ocrLanguage, setOcrLanguage] = useState('ben+eng');
  const [ocrStatus, setOcrStatus] = useState('');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [backendHealth, setBackendHealth] = useState({ checked: false, isOnline: false });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Check OCR backend health on mount
  useEffect(() => {
    if (isOpen) {
      ocrService.checkHealth().then(res => {
        setBackendHealth({ checked: true, isOnline: res.isOnline, info: res.data });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setExtractedData(null);
      setError('');
      // Auto-populate title from filename if title is blank
      if (!name) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        setName(cleanName);
      }
    }
  };

  const handleRunOcrPreview = async () => {
    if (!selectedFile) {
      setError('Please select a PDF or image file first.');
      return;
    }

    setIsProcessingOcr(true);
    setOcrStatus('Rendering page screenshots & running Bengali & English OCR...');
    setError('');

    try {
      const res = await ocrService.extractPreview(selectedFile, ocrLanguage);
      if (res.success && res.result) {
        setExtractedData(res.result);
        setOcrStatus(`✓ Extracted ${res.result.totalPages} folios (${res.result.totalCharacters} chars) using ${res.result.extractionMethod}!`);
        if (!summary && res.result.previewSnippet) {
          setSummary(res.result.previewSnippet);
        }
      }
    } catch (err) {
      console.warn('OCR preview notice:', err);
      setError(
        err.message || 
        'Could not connect to Python OCR backend. Ensure "python backend/run_server.py" is running.'
      );
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeUser) {
      setError('Please sign in to inscribe a manuscript into the library catalog.');
      return;
    }

    if (!name.trim() || !author.trim()) {
      setError('Please provide both the manuscript title and author name.');
      return;
    }

    const year = parseInt(yearPublished, 10);
    const isAdminRef = uploadChannel === 'admin';

    setIsSubmitting(true);

    try {
      if (inputMethod === 'ocr' && selectedFile) {
        // Mode A: File Upload with Python Backend OCR
        setOcrStatus('Processing document screenshots with Tesseract OCR (ben+eng)...');
        const res = await ocrService.processAndInscribe({
          file: selectedFile,
          name: name.trim(),
          author: author.trim(),
          yearPublished: year,
          genre: genre.trim(),
          summary: summary.trim(),
          coverMotif,
          coverColor,
          coverAccent,
          isOfficialCanonical: isAdminRef,
          uploadedByRole: isAdminRef ? 'admin' : 'author',
          uploadedByEmail: activeUser.email || '',
          languages: ocrLanguage
        });

        setIsSubmitting(false);
        if (onManuscriptAdded) {
          onManuscriptAdded(res.book);
        }
        onClose();
      } else {
        // Mode B: Manual Text Inscription
        const pagesData = extractedData?.pagesData || [
          {
            pageNumber: 1,
            title: firstPageTitle.trim() || 'Folio I — Initial Inscription',
            paragraphs: [
              firstParagraph.trim() || summary.trim() || 'A newly accessioned manuscript in the Bhasha Library collection.'
            ]
          }
        ];

        const manuscriptData = {
          name: name.trim(),
          author: author.trim(),
          yearPublished: year,
          decade: `${Math.floor(year / 10) * 10}s`,
          genre: genre.trim(),
          pages: pagesData.length,
          summary: summary.trim(),
          coverColor,
          coverAccent,
          coverMotif,
          isOfficialCanonical: isAdminRef,
          uploadedByRole: isAdminRef ? 'admin' : 'author',
          uploadedByEmail: activeUser.email || '',
          pagesData
        };

        const saved = await bookService.addManuscript(manuscriptData);
        setIsSubmitting(false);
        if (onManuscriptAdded) {
          onManuscriptAdded(saved);
        }
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to inscribe manuscript to library vault.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div 
        className="add-manuscript-modal" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog"
        aria-labelledby="modal-manuscript-title"
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-titles">
            <span className="modal-kicker">
              {uploadChannel === 'admin' 
                ? '★ Curated Archival Inscription (Admin Reference)' 
                : '✒ Community Folio Inscription (Author / Reader)'}
            </span>
            <h3 id="modal-manuscript-title">
              {uploadChannel === 'admin' 
                ? 'Publish Official Reference Manuscript' 
                : 'Inscribe Book or Manuscript'}
            </h3>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Upload Channel Selector: Admin Reference vs User/Author Manuscript */}
        <div className="manuscript-channel-pills">
          <button
            type="button"
            className={`channel-pill-btn ${uploadChannel === 'admin' ? 'active-admin' : ''}`}
            onClick={() => setUploadChannel('admin')}
            title="Upload official canonical reference books for visitors"
          >
            <i className="fa-solid fa-certificate"></i>
            <span>Admin Reference Book (Visitor Guide)</span>
          </button>
          <button
            type="button"
            className={`channel-pill-btn ${uploadChannel === 'user' ? 'active-user' : ''}`}
            onClick={() => setUploadChannel('user')}
            title="Regular user/author upload for manuscripts and essays"
          >
            <i className="fa-solid fa-user-pen"></i>
            <span>Author / Regular User Submission</span>
          </button>
        </div>

        {/* Input Method Switcher: PDF OCR vs Manual Text */}
        <div className="manuscript-method-tabs">
          <button
            type="button"
            className={`method-tab-btn ${inputMethod === 'ocr' ? 'active' : ''}`}
            onClick={() => setInputMethod('ocr')}
          >
            <i className="fa-solid fa-file-pdf"></i>
            <span>Upload PDF / Image (Bengali &amp; English OCR)</span>
          </button>
          <button
            type="button"
            className={`method-tab-btn ${inputMethod === 'manual' ? 'active' : ''}`}
            onClick={() => setInputMethod('manual')}
          >
            <i className="fa-solid fa-pen-nib"></i>
            <span>Manual Text Inscription</span>
          </button>
        </div>

        {/* Python OCR Backend Status Banner */}
        {inputMethod === 'ocr' && (
          <div className={`ocr-service-banner ${backendHealth.isOnline ? 'online' : 'offline'}`}>
            <div className="banner-left">
              <span className={`status-indicator-dot ${backendHealth.isOnline ? 'dot-green' : 'dot-amber'}`}></span>
              <span className="banner-text">
                {backendHealth.isOnline ? (
                  <>
                    <strong>Python OCR Backend Connected</strong> (Tesseract Bengali &amp; English Ready)
                  </>
                ) : (
                  <>
                    <strong>Python OCR Server Offline</strong> (Start with <code>python backend/run_server.py</code> for PDF page screenshots &amp; OCR)
                  </>
                )}
              </span>
            </div>
            <button
              type="button"
              className="refresh-health-btn"
              onClick={() => ocrService.checkHealth().then(res => setBackendHealth({ checked: true, isOnline: res.isOnline, info: res.data }))}
              title="Check backend status"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>
        )}

        {error && (
          <div className="modal-error-banner" role="alert">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Method A: File Upload with OCR */}
          {inputMethod === 'ocr' && (
            <div className="ocr-upload-zone-wrapper">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="manuscriptFileInput"
              />

              <div 
                className={`ocr-dropzone ${selectedFile ? 'has-file' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileChange({ target: { files: e.dataTransfer.files } });
                  }
                }}
              >
                <div className="dropzone-icon">
                  <i className={`fa-solid ${selectedFile ? 'fa-file-circle-check' : 'fa-cloud-arrow-up'}`}></i>
                </div>
                <div className="dropzone-text">
                  {selectedFile ? (
                    <>
                      <p className="dropzone-filename">{selectedFile.name}</p>
                      <p className="dropzone-sub">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="dropzone-prompt">
                        Drop manuscript PDF, image, or text file here, or <span>Browse</span>
                      </p>
                      <p className="dropzone-sub">
                        Supports PDF (screenshot-based OCR), PNG, JPG, and TXT with Bengali &amp; English recognition
                      </p>
                    </>
                  )}
                </div>
              </div>

              {selectedFile && (
                <div className="ocr-preview-actions-row">
                  <div className="ocr-lang-select-wrap">
                    <label htmlFor="ocrLang">OCR Language:</label>
                    <select
                      id="ocrLang"
                      className="ocr-lang-select"
                      value={ocrLanguage}
                      onChange={(e) => setOcrLanguage(e.target.value)}
                    >
                      <option value="ben+eng">Bilingual: Bengali + English (বাংলা ও ইংরেজি)</option>
                      <option value="ben">Bengali Only (বাংলা)</option>
                      <option value="eng">English Only</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn-spring ocr-test-btn"
                    onClick={handleRunOcrPreview}
                    disabled={isProcessingOcr || !backendHealth.isOnline}
                    title="Render screenshots and preview OCR output before submitting"
                  >
                    {isProcessingOcr ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Scanning Folios...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-bolt"></i>
                        <span>Preview OCR Output</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {ocrStatus && (
                <div className="ocr-status-badge">
                  <i className="fa-solid fa-circle-info"></i>
                  <span>{ocrStatus}</span>
                </div>
              )}

              {/* Extracted Folios Preview */}
              {extractedData && (
                <div className="ocr-extracted-preview">
                  <div className="extracted-header">
                    <span>Extracted {extractedData.totalPages} Folios:</span>
                    <span className="extracted-meta">
                      Method: {extractedData.extractionMethod} • {extractedData.totalCharacters} chars
                    </span>
                  </div>
                  <div className="extracted-sample-box">
                    <p className="sample-title">{extractedData.pagesData[0]?.title}</p>
                    <p className="sample-paragraph">
                      {extractedData.pagesData[0]?.paragraphs[0] || 'No paragraphs detected.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Core Metadata Fields */}
          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="msName">Manuscript Title *</label>
              <input
                id="msName"
                type="text"
                className="modal-input"
                placeholder="e.g. Gora (গোরা)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-2">
              <label htmlFor="msAuthor">Author / Scribe Name *</label>
              <input
                id="msAuthor"
                type="text"
                className="modal-input"
                placeholder="e.g. Rabindranath Tagore (রবীন্দ্রনাথ ঠাকুর)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="msYear">Publication Year *</label>
              <input
                id="msYear"
                type="number"
                min="1000"
                max="2100"
                className="modal-input"
                value={yearPublished}
                onChange={(e) => setYearPublished(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-2">
              <label htmlFor="msGenre">Genre *</label>
              <input
                id="msGenre"
                type="text"
                className="modal-input"
                placeholder="e.g. Classical Literature, Historical Lore"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-2">
              <label htmlFor="msMotif">Cover Emblem Motif</label>
              <select
                id="msMotif"
                className="modal-select"
                value={coverMotif}
                onChange={(e) => setCoverMotif(e.target.value)}
              >
                {COVER_MOTIFS.map(m => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Cover Palette (Book Jacket Illumination)</label>
            <div className="palette-picker">
              {PRESET_PALETTES.map(p => (
                <button
                  key={p.name}
                  type="button"
                  className={`palette-chip ${coverColor === p.bg ? 'selected' : ''}`}
                  style={{ backgroundColor: p.bg, borderColor: p.accent }}
                  title={p.name}
                  onClick={() => {
                    setCoverColor(p.bg);
                    setCoverAccent(p.accent);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="msSummary">Archival Synopsis / Historical Context</label>
            <textarea
              id="msSummary"
              className="modal-textarea"
              rows={2}
              placeholder="Provide a scholarly synopsis of the work's cultural resonance..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {/* Method B: Manual Inscription Text Area */}
          {inputMethod === 'manual' && (
            <>
              <div className="form-group">
                <label htmlFor="msPageTitle">Opening Folio Chapter / Section Title</label>
                <input
                  id="msPageTitle"
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Chapter I — The Awakening"
                  value={firstPageTitle}
                  onChange={(e) => setFirstPageTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="msParagraph">Opening Folio Paragraph (Excerpt for AI Reader)</label>
                <textarea
                  id="msParagraph"
                  className="modal-textarea"
                  rows={3}
                  placeholder="Paste the opening excerpt or first folio paragraph..."
                  value={firstParagraph}
                  onChange={(e) => setFirstParagraph(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Submission Row */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting || isProcessingOcr}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-spring btn-modal-submit"
              disabled={isSubmitting || isProcessingOcr}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Inscribing to Library Vault...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>
                    {uploadChannel === 'admin' 
                      ? 'Publish Official Reference Folio' 
                      : 'Publish Manuscript to Vault'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
