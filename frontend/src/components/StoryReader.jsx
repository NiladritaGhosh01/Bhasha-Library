import React, { useState, useEffect } from 'react';

export default function StoryReader({
  story,
  onBack,
  langMode,
  setLangMode,
  onLike,
  isLiked,
  t
}) {
  const [fontSize, setFontSize] = useState('medium'); // small, medium, large
  const [activeParagraphIndex, setActiveParagraphIndex] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [story]);

  if (!story) {
    return (
      <div className="empty-reader">
        <div className="empty-ring">📖</div>
        <h3>{t.reader.emptyTitle}</h3>
        <p>{t.reader.emptyDesc}</p>
        <button className="minimal-cta-btn" onClick={onBack}>{t.reader.browseBtn}</button>
      </div>
    );
  }

  const handleToggleAudio = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const paragraphs = story.paragraphs || [];
    let textToSpeak = '';

    if (langMode === 'bn') {
      textToSpeak = paragraphs.map(p => p.bn || '').join(' ');
    } else {
      textToSpeak = paragraphs.map(p => p.en || '').join(' ');
    }

    if (!textToSpeak && typeof story.content === 'string') {
      textToSpeak = story.content;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.lang = langMode === 'bn' ? 'bn-BD' : 'en-US';

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
  };

  const paragraphs = story.paragraphs || [
    {
      en: story.content?.en || (typeof story.content === 'string' ? story.content : ''),
      bn: story.content?.bn || ''
    }
  ];

  const primaryTitle = langMode === 'bn'
    ? (story.title?.bn || story.title?.en)
    : (story.title?.en || story.title);

  const secondaryTitle = langMode === 'dual' ? story.title?.bn : null;

  return (
    <div className={`reader-surface font-${fontSize}`}>
      {/* Floating Glass Reader Toolbar */}
      <div className="glass-reader-toolbar">
        <button className="toolbar-back-link" onClick={onBack}>
          <span className="back-arrow">←</span>
          <span>{t.reader.back}</span>
        </button>

        <div className="toolbar-center">
          {/* View Mode */}
          <div className="glass-pill-group">
            <button
              className={`pill-item ${langMode === 'dual' ? 'active' : ''}`}
              onClick={() => setLangMode('dual')}
            >
              {t.reader.dual}
            </button>
            <button
              className={`pill-item ${langMode === 'en' ? 'active' : ''}`}
              onClick={() => setLangMode('en')}
            >
              EN
            </button>
            <button
              className={`pill-item bangla-font ${langMode === 'bn' ? 'active' : ''}`}
              onClick={() => setLangMode('bn')}
            >
              বাংলা
            </button>
          </div>

          {/* Font Sizes */}
          <div className="glass-pill-group">
            <button
              className={`pill-item ${fontSize === 'small' ? 'active' : ''}`}
              onClick={() => setFontSize('small')}
            >
              A-
            </button>
            <button
              className={`pill-item ${fontSize === 'medium' ? 'active' : ''}`}
              onClick={() => setFontSize('medium')}
            >
              A
            </button>
            <button
              className={`pill-item ${fontSize === 'large' ? 'active' : ''}`}
              onClick={() => setFontSize('large')}
            >
              A+
            </button>
          </div>
        </div>

        {/* Audio Control */}
        <div className="toolbar-right">
          <button
            className={`audio-glass-btn ${isPlayingAudio ? 'active' : ''}`}
            onClick={handleToggleAudio}
          >
            <span>{isPlayingAudio ? `⏹ ${t.reader.pause}` : `🔊 ${t.reader.listen}`}</span>
          </button>
        </div>
      </div>

      {/* Reader Document */}
      <div className="reader-canvas">
        <header className="reader-doc-header">
          <div className="reader-tag-row">
            <span className="reader-category">
              {langMode === 'bn' ? (story.genreBn || story.genre) : (story.genre || 'Story')}
            </span>
            <span className="meta-sep">•</span>
            <span className="reader-author">{story.author}</span>
          </div>

          <h1 className={`doc-title ${langMode === 'bn' ? 'bangla-font' : ''}`}>
            {primaryTitle}
          </h1>

          {secondaryTitle && (
            <h2 className="doc-subtitle bangla-font">
              {secondaryTitle}
            </h2>
          )}
        </header>

        {/* Content */}
        {langMode === 'dual' ? (
          <div className="dual-canvas-grid">
            <div className="dual-column-labels">
              <span className="col-label">{t.reader.colEn}</span>
              <span className="col-label bangla-font">{t.reader.colBn}</span>
            </div>

            <div className="dual-body-rows">
              {paragraphs.map((para, idx) => (
                <div
                  key={idx}
                  className={`sync-para-row ${activeParagraphIndex === idx ? 'active' : ''}`}
                  onMouseEnter={() => setActiveParagraphIndex(idx)}
                  onMouseLeave={() => setActiveParagraphIndex(null)}
                >
                  <div className="sync-col en">
                    <p>{para.en || '—'}</p>
                  </div>
                  <div className="sync-col bn bangla-font">
                    <p>{para.bn || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="single-canvas-flow">
            {paragraphs.map((para, idx) => (
              <p
                key={idx}
                className={`single-para ${langMode === 'bn' ? 'bangla-font' : ''}`}
              >
                {langMode === 'bn' ? (para.bn || para.en) : (para.en || para.bn)}
              </p>
            ))}
          </div>
        )}

        {/* Minimal Vocabulary Drawer */}
        {story.vocabulary && story.vocabulary.length > 0 && (
          <div className="minimal-vocab-box">
            <span className="vocab-headline">{t.reader.vocabulary}</span>
            <div className="vocab-chips">
              {story.vocabulary.map((item, i) => (
                <div key={i} className="vocab-chip">
                  <span className="vocab-lead">{item.word}</span>
                  <span className="vocab-divider">·</span>
                  <span className="vocab-target bangla-font">{item.bn}</span>
                  <span className="vocab-explanation">{item.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subtle Footer */}
        <footer className="reader-end-bar">
          <button
            className={`fav-pill-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => onLike(story.id)}
          >
            <span>{isLiked ? `♥ ${t.reader.favorited}` : `♡ ${t.reader.favorite}`}</span>
          </button>

          <button className="back-link-btn" onClick={onBack}>
            <span>{t.reader.next} →</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
