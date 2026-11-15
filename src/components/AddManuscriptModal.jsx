import React, { useState } from 'react';
import { bookService } from '../services/bookService';
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

export function AddManuscriptModal({ isOpen, onClose, onManuscriptAdded }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [yearPublished, setYearPublished] = useState(new Date().getFullYear());
  const [genre, setGenre] = useState('Classical Literature');
  const [pages, setPages] = useState(150);
  const [summary, setSummary] = useState('');
  const [coverMotif, setCoverMotif] = useState('lotus');
  const [coverColor, setCoverColor] = useState(PRESET_PALETTES[0].bg);
  const [coverAccent, setCoverAccent] = useState(PRESET_PALETTES[0].accent);
  const [firstPageTitle, setFirstPageTitle] = useState('Chapter I — The Awakening');
  const [firstParagraph, setFirstParagraph] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be signed in as an author to publish to the archival catalog.');
      return;
    }

    if (!name.trim() || !author.trim()) {
      setError('Please provide both the manuscript title and author name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const year = parseInt(yearPublished, 10);
      const pageCount = parseInt(pages, 10);

      const manuscriptData = {
        name: name.trim(),
        author: author.trim(),
        yearPublished: year,
        decade: `${Math.floor(year / 10) * 10}s`,
        genre: genre.trim(),
        pages: pageCount,
        summary: summary.trim(),
        coverColor,
        coverAccent,
        coverMotif,
        pagesData: [
          {
            pageNumber: 1,
            title: firstPageTitle.trim() || 'Chapter I — Initial Inscription',
            paragraphs: [
              firstParagraph.trim() || summary.trim() || 'A newly accessioned manuscript in the Bhasha Library collection.'
            ]
          }
        ]
      };

      const saved = await bookService.addManuscript(manuscriptData);
      setIsSubmitting(false);
      if (onManuscriptAdded) {
        onManuscriptAdded(saved);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to publish manuscript to library vault.');
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
        <div className="modal-header">
          <div className="modal-header-titles">
            <span className="modal-kicker">Archival Folio Catalog</span>
            <h3 id="modal-manuscript-title">Inscribe New Archival Manuscript</h3>
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

        {error && (
          <div className="modal-error-banner" role="alert">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
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
              <label htmlFor="msAuthor">Author Name *</label>
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
            <div className="form-group flex-1">
              <label htmlFor="msPages">Pages *</label>
              <input
                id="msPages"
                type="number"
                min="1"
                max="10000"
                className="modal-input"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                required
              />
            </div>
            <div className="form-group flex-2">
              <label htmlFor="msGenre">Genre *</label>
              <input
                id="msGenre"
                type="text"
                className="modal-input"
                placeholder="e.g. Philosophical Romance"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="msMotif">Cover Ornamental Motif</label>
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
            <div className="form-group flex-2">
              <label>Cover Palette</label>
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

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-spring btn-modal-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Inscribing to Library Vault...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>Publish to Library Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
