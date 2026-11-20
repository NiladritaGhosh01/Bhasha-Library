/**
 * Bhasha Library - OCR & Manuscript Processing Service
 * Connects the web client to the lightweight Python OCR backend
 * supporting bilingual Bengali (বাংলা) and English text extraction.
 */

import { bookService } from './bookService';

const BACKEND_BASE_URL = 'http://127.0.0.1:8000';

export const ocrService = {
  /**
   * Check if local Python OCR server is running and ready
   */
  async checkHealth() {
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        return { isOnline: true, data };
      }
      return { isOnline: false, error: `HTTP ${res.status}` };
    } catch (err) {
      return { isOnline: false, error: err.message || 'Server offline' };
    }
  },

  /**
   * Extract text from PDF/Image without committing to database (for preview)
   */
  async extractPreview(file, languages = 'ben+eng') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('languages', languages);

    const res = await fetch(`${BACKEND_BASE_URL}/api/ocr/extract-only`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Extraction failed' }));
      throw new Error(err.detail || 'Failed to extract text from document.');
    }

    return await res.json();
  },

  /**
   * Full end-to-end ingestion:
   * 1. Sends PDF/Image/Text to Python backend.
   * 2. Backend takes screenshots of PDF pages and executes Bengali + English OCR.
   * 3. Structures folios and paragraphs into canonical schema.
   * 4. Inscribes to Cloud Firestore and updates local in-memory catalog.
   */
  async processAndInscribe({
    file,
    name,
    author,
    yearPublished,
    genre,
    summary = '',
    coverMotif = 'lotus',
    coverColor = '#4A1521',
    coverAccent = '#D4AF37',
    isOfficialCanonical = false,
    uploadedByRole = 'author',
    uploadedByEmail = '',
    languages = 'ben+eng'
  }) {
    const health = await this.checkHealth();

    if (health.isOnline) {
      // Connect to Python OCR backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('author', author);
      formData.append('yearPublished', yearPublished.toString());
      formData.append('genre', genre);
      formData.append('summary', summary);
      formData.append('coverMotif', coverMotif);
      formData.append('coverColor', coverColor);
      formData.append('coverAccent', coverAccent);
      formData.append('isOfficialCanonical', isOfficialCanonical ? 'true' : 'false');
      formData.append('uploadedByRole', uploadedByRole);
      formData.append('uploadedByEmail', uploadedByEmail);
      formData.append('languages', languages);
      formData.append('writeToDatabase', 'true');

      const response = await fetch(`${BACKEND_BASE_URL}/api/ocr/process-pdf`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Backend processing failed' }));
        throw new Error(errData.detail || 'OCR processing failed on the backend.');
      }

      const result = await response.json();
      const savedBook = result.book;

      // Update local client catalog state so the book appears immediately
      await bookService.addManuscript(savedBook);

      return {
        success: true,
        book: savedBook,
        extraction: result.extraction,
        method: 'python_ocr_backend'
      };
    } else {
      // Client-side Fallback when Python server is not yet running
      // Reads text or gives clear instruction to start the backend
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const textContent = await file.text();
        const paragraphs = textContent
          .split(/\n\s*\n/)
          .map(p => p.trim())
          .filter(p => p.length > 5);

        const pagesData = [
          {
            pageNumber: 1,
            title: 'Folio I — Initial Inscription',
            paragraphs: paragraphs.length > 0 ? paragraphs : [textContent]
          }
        ];

        const manuscriptData = {
          name,
          author,
          yearPublished: parseInt(yearPublished, 10),
          decade: `${Math.floor(parseInt(yearPublished, 10) / 10) * 10}s`,
          genre,
          pages: 1,
          summary: summary || textContent.slice(0, 300),
          coverColor,
          coverAccent,
          coverMotif,
          isOfficialCanonical: Boolean(isOfficialCanonical),
          uploadedByRole,
          uploadedByEmail,
          pagesData
        };

        const savedBook = await bookService.addManuscript(manuscriptData);
        return {
          success: true,
          book: savedBook,
          method: 'client_text_fallback',
          notice: 'Parsed directly as text file. To run visual PDF OCR, start `python backend/run_server.py`.'
        };
      } else {
        throw new Error(
          'Python OCR backend is currently offline. Please start it with:\n' +
          'python backend/run_server.py\n' +
          'to process PDF page screenshots with Bengali & English Tesseract OCR.'
        );
      }
    }
  }
};
