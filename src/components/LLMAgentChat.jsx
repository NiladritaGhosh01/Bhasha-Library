import React, { useState, useRef, useEffect } from 'react';
import { llmService, AVAILABLE_MODELS } from '../services/llmService';
import { useAuth } from '../hooks/useAuth';

export function LLMAgentChat({ openBook, onOpenCitation, onNavigate }) {
  const { user, currentUser, isAuthenticated, loading } = useAuth();
  const activeUser = user || currentUser;
  const isAuthed = Boolean(isAuthenticated || activeUser);

  const [selectedModelId, setSelectedModelId] = useState(AVAILABLE_MODELS[0]?.id || 'openai/gpt-oss-120b');
  const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'agent',
      modelName: selectedModel.name,
      text: `Greetings, author. I am your bilingual literary co-writer and editorial mentor for **Bhasha Library**.

I am deeply versed in our classical manuscript archives and classified genre collection, including full texts, folios, and themes across Tagore, Bibhutibhushan, Sarat Chandra, Bankim, and Jibanananda.

Share your story premise, dialogue drafts, or scene dilemmas. You can also attach notes (+), or dictate your thoughts hands-free (🎙️). I am here to suggest authentic dialogues, deepen emotional subtext, outline chapter roadmaps, and recommend reference works from our collection.`,
      timestamp: 'Just now',
      citations: []
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState('bn-IN'); // 'bn-IN' or 'en-IN'
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAuthed) {
      scrollToBottom();
    }
  }, [messages, isThinking, isAuthed, attachedFiles]);

  // Clean up speech synthesis & recognition on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Handle multimodal file attachment
  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFiles(prev => [
          ...prev,
          {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            size: file.size,
            mimeType: file.type || 'application/octet-stream',
            data: reader.result,
            isImage: file.type.startsWith('image/')
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Web Speech API: Voice dictation
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or a Web Speech-compatible browser.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setInputPrompt(prev => {
            const separator = prev && !prev.endsWith(' ') ? ' ' : '';
            return prev + separator + transcript.trim();
          });
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning/error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const toggleSpeechLang = () => {
    const nextLang = speechLang === 'bn-IN' ? 'en-IN' : 'bn-IN';
    setSpeechLang(nextLang);
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // SpeechSynthesis: Read-aloud support for dialogues and responses
  const handleToggleSpeak = (msgId, text) => {
    if (!window.speechSynthesis) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMessageId(msgId);

    const cleanSpeechText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    const hasBengali = /[\u0980-\u09FF]/.test(cleanSpeechText);
    utterance.lang = hasBengali ? 'bn-IN' : 'en-IN';

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v =>
      hasBengali ? v.lang.startsWith('bn') : (v.lang.startsWith('en-IN') || v.lang.startsWith('en'))
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputPrompt;
    if ((!text.trim() && attachedFiles.length === 0) || isThinking || !isAuthed) return;

    const filesToSend = [...attachedFiles];
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      files: filesToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setAttachedFiles([]);
    setIsThinking(true);

    try {
      const response = await llmService.generateResponse({
        message: text,
        modelId: selectedModel.id,
        openBook: openBook,
        conversationHistory: messages,
        files: filesToSend
      });

      setMessages(prev => [...prev, response]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          modelName: selectedModel.name,
          text: err.message || 'The literary co-writer encountered an error while consulting the archives. Please restate your inquiry.',
          timestamp: 'Just now',
          citations: []
        }
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (prompt) => {
    handleSendMessage(prompt);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'agent',
        modelName: selectedModel.name,
        text: `Archives cleared. Ready to consult on new writing inquiries.`,
        timestamp: 'Just now',
        citations: []
      }
    ]);
  };

  const handleNavigateToLogin = () => {
    if (onNavigate) {
      onNavigate('login');
    } else {
      window.location.hash = '#login';
    }
  };

  return (
    <div className="llm-agent-chat-container" data-purpose="author-llm-co-scribe">
      {/* Agent Header & Model Indicator */}
      <header className="llm-header">
        <div className="llm-header-top">
          <div className="llm-agent-title">
            <div className="llm-avatar-icon">
              <i className="fa-solid fa-feather-pointed"></i>
            </div>
            <div>
              <h3 className="llm-heading">Author Fellowship Co-Writer</h3>
              <span className="llm-subheading">Database-Aware Literary Mentor</span>
            </div>
          </div>

          <div className="llm-header-actions">
            {isAuthed && activeUser && (
              <span className="author-status-pill" title={`Signed in as ${activeUser.displayName || activeUser.email}`}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{activeUser.displayName || activeUser.email?.split('@')[0]}</span>
              </span>
            )}

            {isAuthed && (
              <button
                type="button"
                className="llm-clear-btn"
                onClick={handleClearHistory}
                title="Clear Chat Conversation"
                aria-label="Clear chat history"
              >
                <i className="fa-regular fa-trash-can"></i>
              </button>
            )}
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="llm-model-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="model-label">
              <i className="fa-solid fa-bolt"></i> Engine:
            </span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="model-select-dropdown"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'inherit',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#1c1917', color: '#f5f5f4' }}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>
          <span className="model-badge" style={{ fontSize: '0.75rem' }}>{selectedModel.badge}</span>
        </div>
      </header>

      {/* Conditional Rendering: Locked Auth Gate vs Live Chat */}
      {loading ? (
        <div className="llm-loading-state">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <span>Authenticating scribe credentials...</span>
        </div>
      ) : !isAuthed ? (
        /* Protected Authentication Gate */
        <div className="llm-auth-gate-container">
          <div className="auth-gate-card">
            <div className="auth-gate-icon">
              <i className="fa-solid fa-lock"></i>
            </div>
            <span className="auth-gate-kicker">Protected Literary Co-Writer</span>
            <h3 className="auth-gate-title">Author Sign-In Required</h3>
            <p className="auth-gate-bengali">এআই সাহিত্য সহযোগী ব্যবহারের জন্য লগইন আবশ্যক</p>
            <p className="auth-gate-description">
              The Bhasha Fellowship AI Co-Writer is protected for verified members of the Fellowship. Sign in to your account to unlock real-time manuscript reasoning, excerpt cross-referencing, dialogue generation, and speech dictation.
            </p>

            <div className="auth-gate-features">
              <div className="gate-feature-item">
                <i className="fa-solid fa-bolt"></i>
                <span>Direct high-speed reasoning via Groq Cloud & Gemini</span>
              </div>
              <div className="gate-feature-item">
                <i className="fa-solid fa-book-open"></i>
                <span>Semantic citation links across Tagore, Bibhutibhushan, Bankim & Sarat Chandra</span>
              </div>
              <div className="gate-feature-item">
                <i className="fa-solid fa-microphone"></i>
                <span>Hands-free Bengali & English voice dictation + read-aloud playback</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-spring auth-gate-login-btn"
              onClick={handleNavigateToLogin}
            >
              <i className="fa-solid fa-arrow-right-to-bracket"></i>
              <span>Sign In to Unlock AI Co-Writer • প্রবেশ করুন</span>
            </button>
          </div>
        </div>
      ) : (
        /* Authenticated Chat Experience */
        <>
          {/* Suggested Inspiration Prompts */}
          <div className="llm-suggestions-strip">
            <span className="suggestions-label">Explore Prompts:</span>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => handleSuggestionClick('Suggest excerpts on village nostalgia and childhood wonder')}
            >
              🌿 Rural Nostalgia
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => handleSuggestionClick("Compare the romantic dialogue in Tagore's Sesher Kobita vs Sarat Chandra's Devdas")}
            >
              ✒️ Romance Dialogue
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => handleSuggestionClick('Which book has the best descriptions of untamed wilderness and forests?')}
            >
              🌲 Wilderness Excerpts
            </button>
            <button
              type="button"
              className="suggestion-chip"
              onClick={() => handleSuggestionClick('Recommend excerpts on moral duty during times of famine and social upheaval')}
            >
              📜 Historical Drama
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="llm-messages-list">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`llm-message-row ${msg.sender === 'user' ? 'msg-user' : 'msg-agent'}`}
              >
                {msg.sender === 'agent' && (
                  <div className="agent-avatar" aria-hidden="true">
                    <i className="fa-solid fa-scroll"></i>
                  </div>
                )}

                <div className="llm-bubble">
                  <div className="bubble-meta">
                    <span className="sender-tag">
                      {msg.sender === 'user' ? (activeUser?.displayName || 'Author') : msg.modelName || 'AI Co-Writer'}
                    </span>
                    <span className="time-tag">{msg.timestamp}</span>

                    {/* Read-Aloud Voice Button */}
                    {msg.sender === 'agent' && (
                      <button
                        type="button"
                        className={`msg-speak-btn ${speakingMessageId === msg.id ? 'active' : ''}`}
                        onClick={() => handleToggleSpeak(msg.id, msg.text)}
                        title={speakingMessageId === msg.id ? 'Stop Reading' : 'Listen to dialogue read aloud'}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: speakingMessageId === msg.id ? '#D4AF37' : 'inherit',
                          opacity: 0.7,
                          cursor: 'pointer',
                          marginLeft: '8px',
                          fontSize: '0.85rem'
                        }}
                      >
                        <i className={`fa-solid ${speakingMessageId === msg.id ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
                      </button>
                    )}
                  </div>

                  {/* Render attached files on user messages */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="user-attachments-grid" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {msg.files.map(f => (
                        <div key={f.id} className="user-attachment-chip" style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                          <i className={`fa-solid ${f.isImage ? 'fa-image' : 'fa-file'}`} style={{ marginRight: '4px' }}></i>
                          <span>{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render formatted message body */}
                  <div className="bubble-content">
                    {msg.text.split('\n\n').map((para, idx) => {
                      if (para.startsWith('> ')) {
                        return (
                          <blockquote key={idx} className="bubble-quote">
                            {para.replace(/^>\s*/, '').replace(/"/g, '')}
                          </blockquote>
                        );
                      }
                      return (
                        <p key={idx} className="bubble-para">
                          {para}
                        </p>
                      );
                    })}
                  </div>

                  {/* Actionable Citation Pills with Direct "Open in Reader" links */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="citation-container">
                      <div className="citation-header">
                        <i className="fa-solid fa-bookmark"></i>
                        <span>Archival Citations & Recommendations:</span>
                      </div>
                      <div className="citation-list">
                        {msg.citations.map((c, i) => (
                          <div key={i} className="citation-card">
                            <div className="citation-meta">
                              <span className="citation-book">{c.bookName}</span>
                              {c.genre && <span className="citation-genre-badge" style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(212,175,55,0.15)', color: '#D4AF37', borderRadius: '4px', marginLeft: '6px' }}>{c.genre}</span>}
                              {c.author && <span className="citation-author" style={{ opacity: 0.8, fontSize: '0.8rem', marginLeft: 'auto' }}>by {c.author}</span>}
                              <span className="citation-page">Folio {c.pageNumber}</span>
                            </div>
                            {c.quote && (
                              <div className="citation-quote-text">
                                "{c.quote}"
                              </div>
                            )}
                            <div className="citation-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                              <button
                                type="button"
                                className="btn-spring citation-open-btn"
                                onClick={() => onOpenCitation && onOpenCitation(c.bookId, c.pageNumber)}
                              >
                                <i className="fa-solid fa-book-open"></i>
                                <span>Open in Reader Chamber (Folio {c.pageNumber})</span>
                              </button>
                              {c.filePath && (
                                <a
                                  href={c.filePath}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-spring citation-open-btn citation-pdf-btn"
                                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                >
                                  <i className="fa-solid fa-file-pdf"></i>
                                  <span>Read Original PDF</span>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking Indicator */}
            {isThinking && (
              <div className="llm-message-row msg-agent">
                <div className="agent-avatar" aria-hidden="true">
                  <i className="fa-solid fa-feather-pointed fa-spin"></i>
                </div>
                <div className="llm-bubble thinking-bubble">
                  <span className="thinking-dot"></span>
                  <span className="thinking-dot"></span>
                  <span className="thinking-dot"></span>
                  <span className="thinking-text">
                    {selectedModel.name} is consulting manuscript folios & crafting advice...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer */}
          <footer className="llm-composer">
            {/* Attached files preview chips */}
            {attachedFiles.length > 0 && (
              <div className="composer-attachments-preview" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '6px 12px' }}>
                {attachedFiles.map(file => (
                  <div key={file.id} className="attachment-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    <i className={`fa-solid ${file.isImage ? 'fa-image' : 'fa-file'}`}></i>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.id)}
                      style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="composer-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Hidden file input for Multimodal uploads */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                style={{ display: 'none' }}
              />

              {/* Plus (+) Button for multimodal note attachments */}
              <button
                type="button"
                className="btn-spring composer-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach manuscript notes or reference files (+)"
                aria-label="Attach manuscript files"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'inherit',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-plus"></i>
              </button>

              {/* Microphone Voice Dictation Button */}
              <button
                type="button"
                className={`btn-spring composer-mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleSpeechRecognition}
                title={isRecording ? 'Stop Recording' : `Speak prompt (${speechLang === 'bn-IN' ? 'বাংলা' : 'English'})`}
                aria-label="Dictate prompt with voice"
                style={{
                  background: isRecording ? '#dc2626' : 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: isRecording ? '#fff' : 'inherit',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <i className={`fa-solid ${isRecording ? 'fa-microphone-lines fa-beat' : 'fa-microphone'}`}></i>
              </button>

              {/* Language toggle for dictation */}
              <button
                type="button"
                className="composer-lang-toggle"
                onClick={toggleSpeechLang}
                title="Toggle dictation language (বাংলা / English)"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#D4AF37',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {speechLang === 'bn-IN' ? 'বাং' : 'EN'}
              </button>

              <textarea
                className="composer-textarea"
                placeholder="Share your story premise, dialogue drafts, or scene dilemmas..."
                rows={2}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ flex: 1 }}
              />

              <button
                type="button"
                className="btn-spring composer-send-btn"
                disabled={(!inputPrompt.trim() && attachedFiles.length === 0) || isThinking}
                onClick={() => handleSendMessage()}
                aria-label="Send message to AI Co-Writer"
                title="Send (Enter)"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>

            <div className="composer-footnote">
              <span>Connected to Groq Cloud Fast Inference • Grounded in Bhasha Archives</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
