/**
 * LLM Agent Service for Author Fellowship
 * 
 * Powered by Google Gemini 3.8 Flash with live API integration and
 * deep archival context awareness across the Bhasha Library manuscript database.
 */

import { bookService } from './bookService';

export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
export const GEMINI_MODEL = 'gemini-3.8-flash';

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'Google DeepMind',
    icon: 'fa-solid fa-sparkles',
    badge: 'Archival Literary Co-Scribe',
    description: 'Premier multimodal reasoning engine with full manuscript contextual intelligence for Bengali and world literature.'
  }
];

/**
 * Builds valid alternating conversation turns for Google Gemini generateContent API
 * Strict requirements:
 * 1. First message must be role 'user'
 * 2. Strict alternation: user -> model -> user -> model
 * 3. Consecutive turns with same role must be merged
 */
function buildGeminiContents(history, currentMessage) {
  const turns = [];

  // Filter and process prior history
  const cleanHistory = (history || []).filter(item => item && item.text && item.text.trim());

  for (const item of cleanHistory) {
    const role = item.sender === 'user' ? 'user' : 'model';

    // Gemini API requires the first turn to have role 'user'
    // Skip any introductory agent greeting messages at the start of conversation
    if (turns.length === 0 && role === 'model') {
      continue;
    }

    if (turns.length > 0 && turns[turns.length - 1].role === role) {
      // Merge consecutive turns from the same sender
      turns[turns.length - 1].parts[0].text += `\n\n${item.text.trim()}`;
    } else {
      turns.push({
        role,
        parts: [{ text: item.text.trim() }]
      });
    }
  }

  // Append current user message
  if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
    turns[turns.length - 1].parts[0].text += `\n\n${currentMessage.trim()}`;
  } else {
    turns.push({
      role: 'user',
      parts: [{ text: currentMessage.trim() }]
    });
  }

  return turns;
}

export const llmService = {
  getAvailableModels() {
    return AVAILABLE_MODELS;
  },

  /**
   * Generates a context-aware literary response aware of the stored books
   * Calls live Google Gemini 3.8 Flash with full turn-alternation and systemInstruction
   */
  async generateResponse({ message, openBook = null, conversationHistory = [] }) {
    const allBooks = bookService.getAllBooks();
    const cleanMsg = (message || '').toLowerCase();

    // 1. Semantic manuscript and excerpt matching from the archival database
    const matches = [];

    allBooks.forEach(book => {
      let score = 0;
      const titleLower = (book.name || '').toLowerCase();
      const authorLower = (book.author || '').toLowerCase();
      const summaryLower = (book.summary || '').toLowerCase();
      const genreLower = (book.genre || '').toLowerCase();

      if (cleanMsg.includes('gitanjali') || cleanMsg.includes('tagore') || cleanMsg.includes('গীতাঞ্জলি')) {
        if (book.id === 'gitanjali-1910' || book.id === 'sesher-kobita-1929') score += 5;
      }
      if (cleanMsg.includes('forest') || cleanMsg.includes('aranyak') || cleanMsg.includes('nature') || cleanMsg.includes('আরণ্যক') || cleanMsg.includes('wilderness')) {
        if (book.id === 'aranyak-1939') score += 5;
      }
      if (cleanMsg.includes('childhood') || cleanMsg.includes('pather panchali') || cleanMsg.includes('apu') || cleanMsg.includes('durga') || cleanMsg.includes('পথের পাঁচালী')) {
        if (book.id === 'pather-panchali-1929') score += 5;
      }
      if (cleanMsg.includes('romance') || cleanMsg.includes('love') || cleanMsg.includes('devdas') || cleanMsg.includes('শেষের কবিতা') || cleanMsg.includes('দেবদাস')) {
        if (book.id === 'devdas-1917' || book.id === 'sesher-kobita-1929') score += 5;
      }
      if (cleanMsg.includes('adventure') || cleanMsg.includes('chander pahar') || cleanMsg.includes('চাঁদের পাহাড়') || cleanMsg.includes('africa')) {
        if (book.id === 'chander-pahar-1937') score += 5;
      }
      if (cleanMsg.includes('history') || cleanMsg.includes('anandamath') || cleanMsg.includes('আনন্দমঠ') || cleanMsg.includes('bankim')) {
        if (book.id === 'anandamath-1882' || book.id === 'kapalkundala-1866') score += 5;
      }
      if (cleanMsg.includes('poetry') || cleanMsg.includes('jibanananda') || cleanMsg.includes('rupashi') || cleanMsg.includes('রূপসী বাংলা')) {
        if (book.id === 'rupashi-bangla-1957' || book.id === 'gitanjali-1910') score += 5;
      }

      const words = cleanMsg.split(/\s+/).filter(w => w.length > 3);
      words.forEach(w => {
        if (titleLower.includes(w)) score += 2;
        if (authorLower.includes(w)) score += 2;
        if (genreLower.includes(w)) score += 1;
        if (summaryLower.includes(w)) score += 1;
      });

      if (score > 0) {
        matches.push({ book, score });
      }
    });

    matches.sort((a, b) => b.score - a.score);

    let recommendedBooks;
    if (matches.length > 0) {
      recommendedBooks = matches.slice(0, 2).map(m => m.book);
    } else if (openBook) {
      recommendedBooks = [openBook];
      const others = allBooks.filter(b => b.id !== openBook.id);
      if (others.length > 0) recommendedBooks.push(others[0]);
    } else {
      recommendedBooks = allBooks.slice(0, 2);
    }

    // Build citations for side-by-side reading in the chamber
    const citations = [];
    recommendedBooks.forEach(book => {
      const page = Array.isArray(book.pagesData) && book.pagesData[0];
      if (page) {
        citations.push({
          bookId: book.id,
          bookName: book.name,
          author: book.author,
          pageNumber: page.pageNumber || 1,
          pageTitle: page.title || 'Folio I',
          excerpt: page.paragraphs?.[0] || book.summary || '',
          quote: (page.paragraphs?.[0] || book.summary || '').slice(0, 160) + '...'
        });
      }
    });

    const primaryRec = citations[0];

    // 2. Live Google Gemini 3.8 Flash API Execution
    if (GEMINI_API_KEY) {
      const systemInstructionText = 
        `You are the dedicated Literary Co-Scribe for the Bhasha Library Author Fellowship, powered by Google Gemini 3.8 Flash.\n` +
        `Your mission is to assist authors, translators, and scholars with deep appreciation for Bengali and comparative world literature.\n` +
        `Our library archival vault preserves classical masterworks: Rabindranath Tagore's Gitanjali and Sesher Kobita, Bibhutibhushan Bandyopadhyay's Pather Panchali and Aranyak, Sarat Chandra Chattopadhyay's Devdas and Srikanta, Bankim Chandra Chattopadhyay's Anandamath and Kapalkundala, and Jibanananda Das's Rupashi Bangla.\n` +
        `Ground your advice in literary craft, sensory imagery, acoustic cadence, character depth, and thematic resonance.\n` +
        (primaryRec ? `Relevant manuscript context from our archives:\n- Title: "${primaryRec.bookName}" by ${primaryRec.author}\n- Folio Excerpt (Page ${primaryRec.pageNumber}): "${primaryRec.excerpt}"\n` : '') +
        `Always provide thoughtful, personalized, and insightful answers to the author's question.`;

      const contents = buildGeminiContents(conversationHistory, message);

      const requestPayload = {
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      };

      // Handle transient high demand (503) or rate limits with automatic retry
      let response;
      let lastError = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(requestPayload)
            }
          );

          if (response.ok) {
            const data = await response.json();
            const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText) {
              return {
                id: `msg-${Date.now()}`,
                sender: 'agent',
                modelId: GEMINI_MODEL,
                modelName: 'Gemini 3.8 Flash',
                text: generatedText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                citations: citations
              };
            }
          } else {
            const errorBody = await response.json().catch(() => ({}));
            const errorMsg = errorBody?.error?.message || `HTTP ${response.status} ${response.statusText}`;
            lastError = new Error(errorMsg);
            console.warn(`[Gemini API Attempt ${attempt}]:`, errorMsg);

            // If 503 high demand or 429, wait and retry once
            if ((response.status === 503 || response.status === 429) && attempt < 2) {
              await new Promise(r => setTimeout(r, 1200));
              continue;
            }
          }
        } catch (fetchErr) {
          lastError = fetchErr;
          console.warn(`[Gemini API Network Attempt ${attempt}]:`, fetchErr.message);
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }

      // If the API failed after retries, throw informative error so the UI can notify the author
      if (lastError) {
        throw new Error(`Gemini 3.8 Flash Service Notice: ${lastError.message}`);
      }
    }

    // 3. Fallback only if no API key is provided
    return {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      modelId: GEMINI_MODEL,
      modelName: 'Gemini 3.8 Flash',
      text: `Gemini API key is unconfigured. Please provide VITE_GEMINI_API_KEY in your environment to consult the live neural model.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: citations
    };
  }
};
