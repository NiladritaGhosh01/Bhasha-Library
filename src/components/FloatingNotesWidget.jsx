import React, { useState, useRef, useEffect } from 'react';

const STORAGE_KEY = 'bhasha_author_running_notes';

export function FloatingNotesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 
`# Author's Running Codex (লেখক নোটবই)
*Drafted during manuscript research in Bhasha Fellowship*

## Key Observations:
- **Tone & Atmosphere:** Look closely at the pastoral imagery in Pather Panchali.
- **Tagore's Metaphors:** Notice how Gitanjali uses the "frail vessel" and "reed flute" to evoke surrender.

`;
    } catch {
      return '# Author\'s Running Codex\n\n';
    }
  });

  // Dragging state
  const [position, setPosition] = useState({ x: 28, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const textareaRef = useRef(null);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, notes);
    } catch {
      // ignore storage quota errors
    }
  }, [notes]);

  // Window drag listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;
      
      const newX = Math.max(10, Math.min(window.innerWidth - 380, dragStartRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 300, dragStartRef.current.posY + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    // Only drag from header, not buttons or textarea
    if (e.target.closest('button') || e.target.closest('textarea')) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  // Formatting helpers
  const insertFormatting = (prefix, suffix = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = notes.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const updated = notes.substring(0, start) + replacement + notes.substring(end);
    setNotes(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 10);
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    const blob = new Blob([notes], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `bhasha_author_notes_${timestamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Floating Circular Trigger in Bottom Left */}
      <div className="floating-notes-trigger-container" data-purpose="author-notes-trigger">
        <button
          type="button"
          className={`floating-notes-circular-btn ${isOpen ? 'active-open' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Minimize Author Codex Notes' : 'Open Author Codex Running Notes'}
          title="Author's Running Notes Codex (নোটবই)"
        >
          <i className="fa-solid fa-pen-nib notes-icon"></i>
          <span className="notes-tooltip">Running Notes</span>
        </button>
      </div>

      {/* Floating Draggable Box Overlay */}
      {isOpen && (
        <div
          className="floating-notes-box"
          style={{
            left: `${position.x}px`,
            bottom: `${position.y}px`
          }}
          onMouseDown={handleMouseDown}
          role="dialog"
          aria-label="Author Running Notes"
        >
          {/* Header & Drag Handle */}
          <div className="notes-header">
            <div className="notes-drag-handle" title="Drag to reposition anywhere">
              <i className="fa-solid fa-grip-vertical drag-icon"></i>
              <span className="notes-title">Author's Codex • চলন্ত নোটবই</span>
            </div>

            <div className="notes-header-actions">
              <button
                type="button"
                className="notes-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize Notes"
                aria-label="Minimize"
              >
                <i className="fa-solid fa-window-minimize"></i>
              </button>
              <button
                type="button"
                className="notes-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close Notes Window"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* Quick Formatting Toolbar */}
          <div className="notes-toolbar">
            <button
              type="button"
              className="notes-tool-btn"
              onClick={() => insertFormatting('**', '**')}
              title="Bold (**text**)"
            >
              <i className="fa-solid fa-bold"></i>
            </button>
            <button
              type="button"
              className="notes-tool-btn"
              onClick={() => insertFormatting('*', '*')}
              title="Italic (*text*)"
            >
              <i className="fa-solid fa-italic"></i>
            </button>
            <button
              type="button"
              className="notes-tool-btn"
              onClick={() => insertFormatting('### ')}
              title="Heading (### )"
            >
              <i className="fa-solid fa-heading"></i>
            </button>
            <button
              type="button"
              className="notes-tool-btn"
              onClick={() => insertFormatting('- ')}
              title="Bullet List (- )"
            >
              <i className="fa-solid fa-list-ul"></i>
            </button>
            <button
              type="button"
              className="notes-tool-btn"
              onClick={() => insertFormatting('> ')}
              title="Blockquote (> )"
            >
              <i className="fa-solid fa-quote-left"></i>
            </button>
            <button
              type="button"
              className="notes-tool-btn"
              onClick={() => setNotes('')}
              title="Clear Notes"
            >
              <i className="fa-regular fa-trash-can"></i>
            </button>
          </div>

          {/* Notes Content Area */}
          <div className="notes-body">
            <textarea
              ref={textareaRef}
              className="notes-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Inscribe your running thoughts, draft revisions, or dialogue fragments here..."
              rows={8}
            />
          </div>

          {/* Footer with Download .md option */}
          <div className="notes-footer">
            <span className="notes-char-count">
              {notes.length} chars • {notes.split(/\s+/).filter(Boolean).length} words
            </span>

            <button
              type="button"
              className="btn-spring notes-download-btn"
              onClick={handleDownloadMarkdown}
              title="Download notes as Markdown (.md) file"
            >
              <i className="fa-solid fa-download"></i>
              <span>Download .md</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
