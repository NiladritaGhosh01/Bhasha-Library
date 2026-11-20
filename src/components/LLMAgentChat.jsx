import React, { useState, useRef, useEffect } from 'react';
import { llmService, AVAILABLE_MODELS } from '../services/llmService';
import { useAuth } from '../hooks/useAuth';

export function LLMAgentChat({ openBook, onOpenCitation, onNavigate }) {
  const { user, currentUser, isAuthenticated, loading } = useAuth();
  const activeUser = user || currentUser;
  const isAuthed = Boolean(isAuthenticated || activeUser);

  const selectedModel = AVAILABLE_MODELS[0];

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'agent',
      modelName: selectedModel.name,
      text: `Greetings, author. I am your literary research co-scribe powered by Google Gemini.

I have complete awareness of the **Bhasha Library manuscript archives**—including full texts, chapters, and thematic motifs across Tagore, Bibhutibhushan, Sarat Chandra, Bankim, and Jibanananda.

Ask me for assistance with your plot structure, sensory prose, dialect, or philosophical themes. I will recommend specific excerpts from our database, with page and paragraph citations you can study side-by-side.`,
      timestamp: 'Just now',
      citations: [
        {
          bookId: 'gitanjali-1910',
          bookName: 'Gitanjali (গীতাঞ্জলি)',
          author: 'Rabindranath Tagore',
          pageNumber: 1,
          quote: 'Thou hast made me endless, such is thy pleasure...'
        }
      ]
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAuthed) {
      scrollToBottom();
    }
  }, [messages, isThinking, isAuthed]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isThinking || !isAuthed) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setIsThinking(true);

    try {
      const response = await llmService.generateResponse({
        message: text,
        modelId: selectedModel.id,
        openBook: openBook,
        conversationHistory: messages
      });

      setMessages(prev => [...prev, response]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          modelName: selectedModel.name,
          text: err.message || 'The neural scribe encountered an error while consulting the archives. Please restate your inquiry.',
          timestamp: 'Just now'
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
        timestamp: 'Just now'
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
              <h3 className="llm-heading">Author Fellowship Scribe</h3>
              <span className="llm-subheading">Database-Aware AI Literary Companion</span>
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

        {/* Model Indicator */}
        <div className="llm-model-bar">
          <span className="model-label">
            <i className="fa-solid fa-sparkles"></i> Model:
          </span>
          <span className="model-active-name">{selectedModel.name} (Google AI)</span>
          <span className="model-badge">{selectedModel.badge}</span>
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
            <span className="auth-gate-kicker">Protected Literary Scribe</span>
            <h3 className="auth-gate-title">Author Sign-In Required</h3>
            <p className="auth-gate-bengali">এআই সাহিত্য সহযোগী ব্যবহারের জন্য লগইন আবশ্যক</p>
            <p className="auth-gate-description">
              The Google Gemini 3.8 Flash Archival Co-Scribe is protected for verified members of the Bhasha Fellowship. Sign in to your account to unlock real-time manuscript reasoning, excerpt cross-referencing, and interactive dialogue.
            </p>

            <div className="auth-gate-features">
              <div className="gate-feature-item">
                <i className="fa-solid fa-sparkles"></i>
                <span>Direct neural generation via Google Gemini 3.8 Flash</span>
              </div>
              <div className="gate-feature-item">
                <i className="fa-solid fa-book-open"></i>
                <span>Semantic citation links across Tagore, Bibhutibhushan & Bankim</span>
              </div>
              <div className="gate-feature-item">
                <i className="fa-solid fa-feather-pointed"></i>
                <span>Contextual dialogue, sensory imagery & narrative craft advice</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-spring auth-gate-login-btn"
              onClick={handleNavigateToLogin}
            >
              <i className="fa-solid fa-arrow-right-to-bracket"></i>
              <span>Sign In to Unlock AI Co-Scribe • প্রবেশ করুন</span>
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
                      {msg.sender === 'user' ? (activeUser?.displayName || 'Author') : msg.modelName || 'Manuscript Agent'}
                    </span>
                    <span className="time-tag">{msg.timestamp}</span>
                  </div>

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
                              <span className="citation-page">Folio {c.pageNumber}</span>
                            </div>
                            {c.quote && (
                              <div className="citation-quote-text">
                                "{c.quote}"
                              </div>
                            )}
                            <button
                              type="button"
                              className="btn-spring citation-open-btn"
                              onClick={() => onOpenCitation && onOpenCitation(c.bookId, c.pageNumber)}
                            >
                              <i className="fa-solid fa-book-open"></i>
                              <span>Open in Reader Chamber (Folio {c.pageNumber})</span>
                            </button>
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
                    {selectedModel.name} is consulting manuscript folios & reasoning...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Composer */}
          <footer className="llm-composer">
            <div className="composer-wrap">
              <textarea
                className="composer-textarea"
                placeholder="Ask for writing advice, plot ideas, or book recommendations (e.g. 'Recommend excerpts on rural solitude')..."
                rows={2}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="btn-spring composer-send-btn"
                disabled={!inputPrompt.trim() || isThinking}
                onClick={() => handleSendMessage()}
                aria-label="Send message to AI Co-Scribe"
                title="Send (Enter)"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
            <div className="composer-footnote">
              <span>Connected to Gemini 3.8 Flash • Grounded in authentic classical manuscripts</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
