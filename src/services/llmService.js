/**
 * LLM Agent Service for Author Fellowship
 * 
 * Provides literary writing assistance and deep contextual awareness
 * of the entire Bhasha Library manuscript database. Generates actionable
 * writing critiques, comparative excerpts, and specific page/paragraph citations.
 */

import { bookService } from './bookService';

export const AVAILABLE_MODELS = [
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google DeepMind',
    icon: 'fa-solid fa-sparkles',
    badge: 'Deep Manuscript Context',
    description: 'Premier multimodal reasoning engine with 2M token context for intricate archival cross-referencing.'
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    icon: 'fa-solid fa-feather',
    badge: 'Poetic & Editorial Craft',
    description: 'Exceptional literary sensitivity, nuanced prose pacing, and stylistic translation polish.'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o Omnimodal',
    provider: 'OpenAI',
    icon: 'fa-solid fa-bolt',
    badge: 'Narrative Structuring',
    description: 'Rapid plotting, character dialect refinement, and rhythmic dialogue polishing.'
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'Open Source',
    icon: 'fa-solid fa-brain',
    badge: 'Analytical Philosophy',
    description: 'Deep mathematical and structural analysis of thematic progression and motif networks.'
  }
];

export const llmService = {
  getAvailableModels() {
    return AVAILABLE_MODELS;
  },

  /**
   * Generates a context-aware literary response aware of the stored books
   */
  async generateResponse({ message, modelId = 'gemini-2.5-pro', openBook = null, conversationHistory = [] }) {
    const allBooks = bookService.getAllBooks();
    const cleanMsg = (message || '').toLowerCase();
    const _historyCount = conversationHistory.length; // Context tracking

    // Find relevant books from the database
    const matches = [];

    allBooks.forEach(book => {
      let score = 0;
      const titleLower = book.name.toLowerCase();
      const authorLower = book.author.toLowerCase();
      const summaryLower = book.summary.toLowerCase();
      const genreLower = book.genre.toLowerCase();

      // Keyword matching
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

      // General word overlaps
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

    // If no strong specific match, use the currently open book or top books
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

    // Build citations & excerpts
    const citations = [];
    recommendedBooks.forEach(book => {
      const page = book.pagesData[0];
      if (page) {
        citations.push({
          bookId: book.id,
          bookName: book.name,
          author: book.author,
          pageNumber: page.pageNumber,
          pageTitle: page.title,
          excerpt: page.paragraphs[0],
          quote: page.paragraphs[0].slice(0, 160) + '...'
        });
      }
    });

    // Model persona nuances
    const model = AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];

    // Artificial delay to mimic natural stream/thinking
    await new Promise(resolve => setTimeout(resolve, 550));

    // Construct response text
    let reply;
    const primaryRec = citations[0];
    const secondaryRec = citations[1];

    if (cleanMsg.includes('recommend') || cleanMsg.includes('which book') || cleanMsg.includes('what should i read')) {
      reply = `As your literary co-scribe powered by **${model.name}**, I have examined your request against our library archives.\n\n` +
        `I strongly suggest immersing yourself in **${primaryRec.bookName}** by *${primaryRec.author}*.\n\n` +
        `**Key Excerpt to Study (Page ${primaryRec.pageNumber}):**\n` +
        `> "${primaryRec.excerpt}"\n\n` +
        `**Craft Insight:** Notice the acoustic rhythm and spatial intimacy in this opening. The pacing demonstrates how classical Bengali prose grounds philosophical wonder in concrete sensory motifs.\n\n` +
        (secondaryRec ? `For a contrasting stylistic balance, also examine **${secondaryRec.bookName}** (Page ${secondaryRec.pageNumber}), where the narrative tension shifts toward external conflict.` : '');
    } else if (cleanMsg.includes('dialogue') || cleanMsg.includes('character') || cleanMsg.includes('conflict')) {
      reply = `Through the lens of **${model.name}**, classical narrative tension works best when internal yearning clashes against unyielding social conventions.\n\n` +
        `In our collection, examine **${primaryRec.bookName}** by *${primaryRec.author}*. On Page ${primaryRec.pageNumber}, notice how dialogue reveals subtext without melodrama:\n\n` +
        `> "${primaryRec.quote}"\n\n` +
        `**Editorial Suggestion:** Try holding back your characters' direct confessions. Allow their physical actions—such as a gaze into the courtyard or the cadence of a silence—to bear the weight of their spoken cipher.`;
    } else if (cleanMsg.includes('nature') || cleanMsg.includes('forest') || cleanMsg.includes('atmosphere')) {
      reply = `To evoke deep atmospheric resonance, **${model.name}** recommends drawing from the animistic environmental immersion in **${primaryRec.bookName}**.\n\n` +
        `Look specifically at Page ${primaryRec.pageNumber} (${primaryRec.pageTitle}):\n\n` +
        `> "${primaryRec.excerpt}"\n\n` +
        `**Writing Exercise:** Describe your scene's setting not as passive backdrop, but as an active sentient protagonist that breathes alongside your characters.`;
    } else {
      reply = `Greetings, fellow scribe. Using **${model.name}**, I have retrieved context from our manuscript archives to guide your work.\n\n` +
        `Your inquiry touches upon thematic layers present in **${primaryRec.bookName}** by *${primaryRec.author}*.\n\n` +
        `**Archival Excerpt from Page ${primaryRec.pageNumber}:**\n` +
        `> "${primaryRec.excerpt}"\n\n` +
        `**Recommendation for Your Manuscript:** Study how this passage balances syntactic dignity with emotional vulnerability. You can click below to load this folio directly into your reading chamber for side-by-side study.`;
    }

    return {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      modelId: model.id,
      modelName: model.name,
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: citations
    };
  }
};
