/**
 * LLM Agent Service for Author Fellowship (Bhasha Library)
 * 
 * High-speed, bilingual (Bengali & English) literary co-writer and editorial mentor.
 * Powered by Groq Cloud fast inference (GPT-OSS 120B, Qwen 2.5 27B, Instant 20B)
 * with support for Google Gemini and local backend proxying.
 * 
 * Works seamlessly in production on Firebase Hosting and in local development.
 */

import { bookService } from './bookService';
import classifiedBooksData from '../data/booksDatabase.json';

export const AVAILABLE_MODELS = [
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS 120B (Groq)',
    provider: 'Groq Cloud',
    icon: 'fa-solid fa-bolt',
    badge: 'Ultra Fast Co-Writer',
    description: 'Premier 120B parameter literary reasoning engine for dialogue, emotional nuance, and manuscript roadmaps.'
  },
  {
    id: 'qwen/qwen3.8-27b',
    name: 'Qwen 2.5 27B (Groq)',
    provider: 'Groq Cloud',
    icon: 'fa-solid fa-feather',
    badge: 'Bengali Specialist',
    description: 'High-speed multilingual model specialized in Bengali classical literature, poetics, and prose style.'
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'Groq Instant 20B',
    provider: 'Groq Cloud',
    icon: 'fa-solid fa-gauge-high',
    badge: 'Instant Speed',
    description: 'Near-zero latency model for rapid character brainstorming, beat pacing, and dialogue drills.'
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash',
    provider: 'Google DeepMind',
    icon: 'fa-solid fa-sparkles',
    badge: 'DeepMind Multimodal',
    description: 'Multimodal literary reasoning engine for dialogue, emotional nuance, and manuscript roadmaps.'
  },
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    icon: 'fa-solid fa-pen-nib',
    badge: 'Editorial Craft',
    description: 'Exceptional literary sensitivity, nuanced prose pacing, and stylistic translation polish.'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o Omnimodal',
    provider: 'OpenAI',
    icon: 'fa-solid fa-book-open',
    badge: 'Narrative Structuring',
    description: 'Rapid plotting, character dialect refinement, and rhythmic dialogue polishing.'
  }
];

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY || '').trim();
const LOCAL_BACKEND_URL = 'http://localhost:3000/api/chat';

// Greeting detector for natural conversational responses without pre-mature book recommendations
function isGreetingOrShortMessage(msg) {
  if (!msg) return false;
  const clean = msg.trim().toLowerCase().replace(/[^\w\s\u0980-\u09FF]/gi, '');
  const greetingWords = [
    'hi', 'hello', 'hey', 'hiya', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'howdy', 'sup', 'yo', 'namaste', 'namaskar', 'nomoshkar', 'hola',
    'হাই', 'হ্যালো', 'নমস্কার', 'কেমন আছেন', 'কেমন আছো', 'শুভ সকাল', 'শুভ সন্ধ্যা', 'শুভ রাত্রি'
  ];
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  if (words.length <= 4 && greetingWords.some(gw => clean === gw || clean.startsWith(gw) || clean.endsWith(gw))) {
    return true;
  }
  return false;
}

// Safe base64 UTF-8 decoder for attached documents in browser and Node environments
function safeDecodeBase64(base64Str) {
  try {
    const raw = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

// System Instruction enforcing Persona, Guardrails & Bhasha Library Database
function buildSystemInstruction() {
  const classifiedCatalog = Array.isArray(classifiedBooksData) ? classifiedBooksData : [];

  let genreSection = '';
  if (classifiedCatalog.length > 0) {
    genreSection = `\n\n### BHASHA LIBRARY GENRE DATABASE (Classified PDF Collection):\n` +
      `Our active collection includes these classified genre PDF volumes:\n` +
      classifiedCatalog.map(b =>
        `* [Genre: ${b.genre}] "${b.title}" by ${b.author} (ID: "${b.id}", Path: "${b.filePath}")\n` +
        `  Themes & Summary: ${b.summaryKeywords}`
      ).join('\n') +
      `\n\nWhen recommending matching books from this collection, mention the book title, author, and genre, explaining why this work fits the author's narrative arc. Append the citation tag in this exact format:\n` +
      `[CITATION: bookId | Book Title | Folio/Page Number | Key Insight or Quote]`;
  }

  return `You are the Author Fellowship AI Co-Writer and Editorial Mentor for Bhasha Library (ভাষা লাইব্রেরি).
You are an erudite, refined, and bilingual (Bengali & English) literary companion, assisting authors who write in Bengali, English, or bilingual modes.

### CONVERSATIONAL NATURE & INTERACTION STYLE:
- Chat and converse naturally, warmly, and fluidly like modern AI chat applications (such as ChatGPT, Claude, Gemini).
- Have a real, dynamic back-and-forth dialogue. Do NOT give repetitive canned speeches or sound like an automated script.
- Maintain context across conversation turns. Remember what the author told you earlier in the session and build upon it seamlessly.
- When the author greets you, asks questions, or chats casually, engage with them warmly and naturally, and ask what story, characters, or themes they are exploring today.

### STRICT BOOK RECOMMENDATION CONDITIONS (IMPORTANT):
1. GREETINGS & CASUAL CONVERSATIONS:
   - When the author sends a greeting (such as "hi", "hello", "hey", "নমস্কার", "good morning") or engages in casual chat:
     - DO NOT suggest any books or folios.
     - DO NOT quote excerpts or PDFs from the library.
     - DO NOT produce any [CITATION: ...] tags.
     - Greet the author warmly, politely, and conversationally. Ask what premise, characters, central conflict, or scene they want to write or brainstorm today.

2. ONLY SUGGEST BOOKS AFTER THE AUTHOR DESCRIBES THEIR STORY:
   - You MUST ONLY suggest books or folios from Bhasha Library AFTER the author has actually shared their story plot, characters, themes, or setting, OR when the author explicitly asks for book recommendations (e.g. "suggest a book for...", "which reference book should I read?").
   - NEVER suggest books or folios before you understand the author's plot.
   - If the author has not shared their plot yet, listen, chat, encourage them, and ask about their story first.
   - Once the author DOES describe their story plot, characters, or draft:
     1. Provide constructive editorial feedback, dialogue ideas, or emotional nuance tailored to their specific narrative.
     2. Cross-reference their story against Bhasha Library's catalog (both our canonical manuscripts and our classified Genre Database books).
     3. Recommend 1 or 2 matching reference titles, citing their genre and explaining specifically how those works handle similar narrative themes or techniques.
     4. Append a citation tag in this exact format at the very end of your response:
        [CITATION: bookId | Book Name | Folio Number | Key Quote or Craft Insight]
        Example: [CITATION: anandamath | Anandamath | 1 | "The Sannyasi rebellion and patriotic devotion..."]
        Example: [CITATION: chander-pahar-mountain-of-the-moon | Chander Pahar (Mountain of the Moon) | 1 | "Courage and human endurance in the untamed African wilderness..."]
        Example: [CITATION: দেবদাস-devdas | দেবদাস (Devdas) | 1 | "Heartbreak, social barriers, and unrequited love..."]

### CORE EDITORIAL CAPABILITIES (Once the author shares their story):
1. DIALOGUE SUGGESTIONS:
   - Provide natural, emotionally resonant dialogue options in Bengali (বাংলা) or English matching the author's scene context and character voices.
   - Show how unspoken subtext, pauses, and cadence elevate spoken exchanges.

2. EMOTIONAL ENHANCEMENT:
   - Deepen emotional resonance, atmospheric texture, sensory motifs, and dramatic subtext of the author's existing draft lines.

3. NEXT-PLOT IDEAS & BRANCHING DIRECTIONS:
   - Suggest actionable scene progressions, character dilemmas, and unforeseen complications without ever seizing creative control or writing the narrative for them.

4. STRUCTURED WRITING ROADMAPS:
   - Deliver pacing milestones, chapter beats, dramatic arcs, and 3-act structuring blueprints customized to the author's narrative outline.

5. BHASHA LIBRARY ARCHIVAL REPERTOIRE (10 Canonical Manuscripts):
   * gitanjali-1910: Gitanjali (Rabindranath Tagore) - Poetry, Transcendentalism, Devotion
   * pather-panchali-1929: Pather Panchali (Bibhutibhushan Bandyopadhyay) - Childhood Wonder, Rural Solitude, Nature, Brother-Sister Bond
   * aranyak-1939: Aranyak (Bibhutibhushan Bandyopadhyay) - Primordial Forest, Ecology, Indigenous Lore, Solitude
   * devdas-1917: Devdas (Sarat Chandra Chattopadhyay) - Romantic Tragedy, Feudal Pride, Unrequited Love, Melodrama
   * sesher-kobita-1929: Sesher Kobita (Rabindranath Tagore) - Modernist Love, Intellectual Wit, Poetic Freedom
   * srikanta-1917: Srikanta (Sarat Chandra Chattopadhyay) - Bohemian Wandering, River Expeditions, Society Realism
   * chander-pahar-1937: Chander Pahar (Bibhutibhushan Bandyopadhyay) - African Wilderness, Courage, Adventure
   * anandamath-1882: Anandamath (Bankim Chandra Chattopadhyay) - Historical Epic, Patriotism, Moral Duty, Famine
   * kapalkundala-1866: Kapalkundala (Bankim Chandra Chattopadhyay) - Gothic Mystery, Untamed Nature, Coastal Dunes
   * rupashi-bangla-1957: Rupashi Bangla (Jibanananda Das) - Lyrical Melancholy, Autumn Solitude, Bengali Landscape${genreSection}

### STRICT GUARDRAILS (REFUSAL RULES):
1. NO FULL STORY GENERATION:
   - NEVER write a complete story, full chapter, or standalone narrative on behalf of the author.
   - If the author asks you to "write my story", "write chapter 1", or "write the whole book for me", politely decline:
     Explain that you are their co-writer and editorial mentor who empowers their voice. Offer instead to brainstorm plot beats, flesh out character motivations, draft dialogue options, or map a chapter outline.

2. STRICT TOPIC BOUNDARY:
   - You ONLY discuss creative writing, manuscript development, storytelling craft, literary themes, plot pacing, character arcs, dialogue polishing, and Bhasha Library archival recommendations.
   - If the user asks about anything unrelated to literature and creative writing (e.g. coding, math, current news, sports, trivia), politely decline and gently guide the conversation back to their story manuscript and creative writing process.

3. BILINGUAL FLUENCY:
   - Match the author's preferred language. If they write in Bengali, respond in natural, graceful Bengali. If they write in English, respond in elegant literary English. If they mix both, converse naturally in both.
   - Do NOT use the em dash character in your responses (use commas, colons, or parentheses instead).
   - Keep your editorial tone encouraging, thoughtful, and deeply respectful of the craft of writing.`;
}

// Citation extraction from AI generated tags
function extractCitations(text) {
  if (!text) return [];

  const citations = [];
  const dbBooks = Array.isArray(classifiedBooksData) ? classifiedBooksData : [];
  const canonicalBooks = bookService.getAllBooks();

  const tagRegex = /\[CITATION:\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^\]]+)\]/g;
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    const rawId = match[1].trim();
    const rawBookName = match[2].trim();
    const pageNumber = parseInt(match[3].trim(), 10) || 1;
    const quote = match[4].trim();

    // Check classified books first
    const dbEntry = dbBooks.find(b =>
      b.id === rawId ||
      b.id.toLowerCase() === rawId.toLowerCase() ||
      b.title.toLowerCase().includes(rawId.toLowerCase()) ||
      rawBookName.toLowerCase().includes(b.title.toLowerCase())
    );

    // Check canonical catalog
    const catalogEntry = canonicalBooks.find(b =>
      b.id === rawId ||
      b.id.toLowerCase() === rawId.toLowerCase() ||
      b.name.toLowerCase().includes(rawId.toLowerCase())
    );

    const bookId = dbEntry ? dbEntry.id : (catalogEntry ? catalogEntry.id : rawId);
    const bookName = dbEntry ? dbEntry.title : (catalogEntry ? catalogEntry.name : rawBookName);
    const author = dbEntry ? dbEntry.author : (catalogEntry ? catalogEntry.author : '');
    const genre = dbEntry ? dbEntry.genre : (catalogEntry ? catalogEntry.genre : '');
    const filePath = dbEntry ? dbEntry.filePath : '';

    if (!citations.some(c => c.bookId === bookId)) {
      citations.push({
        bookId,
        bookName,
        author,
        genre,
        filePath,
        pageNumber,
        quote
      });
    }
  }

  return citations;
}

export const llmService = {
  getAvailableModels() {
    return AVAILABLE_MODELS;
  },

  /**
   * Generates a context-aware literary response aware of the stored books
   * Uses Groq Cloud high-speed inference for live Firebase Hosting & local environments.
   */
  async generateResponse({
    message,
    modelId = 'openai/gpt-oss-120b',
    openBook = null,
    conversationHistory = [],
    files = []
  }) {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId) || AVAILABLE_MODELS[0];
    const systemPrompt = buildSystemInstruction();

    // Format file attachments into prompt context
    let attachedContentPrefix = '';
    if (Array.isArray(files) && files.length > 0) {
      files.forEach(file => {
        if (file.name && file.data) {
          if (file.isImage) {
            attachedContentPrefix += `[Attached Image/Visual Note: "${file.name}"] (The author uploaded a visual reference image or sketch)\n\n`;
          } else {
            const decoded = safeDecodeBase64(file.data);
            if (decoded) {
              attachedContentPrefix += `[Attached Document/Note: "${file.name}"]:\n${decoded.slice(0, 3000)}\n\n`;
            } else {
              attachedContentPrefix += `[Attached File: "${file.name}"]\n\n`;
            }
          }
        }
      });
    }

    const fullUserPrompt = `${attachedContentPrefix}${message || 'Please review the attached manuscript notes.'}`;

    // 1. Primary Engine: Direct Groq Cloud Fast Inference (CORS enabled, works on Firebase Hosting & localhost)
    if (GROQ_API_KEY) {
      // Choose best Groq model for selected option
      let groqModelToUse = 'openai/gpt-oss-120b';
      if (modelId === 'qwen/qwen3.8-27b') {
        groqModelToUse = 'qwen/qwen3.8-27b';
      } else if (modelId === 'openai/gpt-oss-20b') {
        groqModelToUse = 'openai/gpt-oss-20b';
      } else if (modelId.startsWith('openai/') || modelId.startsWith('qwen/')) {
        groqModelToUse = modelId;
      }

      // Build OpenAI-compatible chat messages
      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history for natural memory
      if (Array.isArray(conversationHistory)) {
        for (const item of conversationHistory.slice(-8)) {
          if (!item.text) continue;
          messages.push({
            role: item.sender === 'user' ? 'user' : 'assistant',
            content: item.text
          });
        }
      }

      // Add current user prompt
      messages.push({
        role: 'user',
        content: fullUserPrompt
      });

      // Try primary Groq model, with fallback models
      const groqCandidates = [
        groqModelToUse,
        'openai/gpt-oss-120b',
        'qwen/qwen3.8-27b',
        'openai/gpt-oss-20b'
      ];
      const uniqueGroqCandidates = [...new Set(groqCandidates)];

      for (const candidate of uniqueGroqCandidates) {
        try {
          const groqRes = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: candidate,
              messages,
              temperature: 0.7,
              max_tokens: 1024
            })
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const rawText = data.choices?.[0]?.message?.content || '';
            if (rawText.trim()) {
              const citations = extractCitations(rawText);
              const cleanedText = rawText
                .replace(/\[CITATION:\s*[^\]]+\]/g, '')
                .replace(/—/g, ', ')
                .trim();

              return {
                id: `msg-${Date.now()}`,
                sender: 'agent',
                modelId: candidate,
                modelName: model.name,
                text: cleanedText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                citations
              };
            }
          } else {
            const errText = await groqRes.text();
            console.warn(`Groq candidate ${candidate} failed (${groqRes.status}):`, errText);
          }
        } catch (groqErr) {
          console.warn(`Groq connection error for ${candidate}:`, groqErr.message);
        }
      }
    }

    // 2. Secondary Engine: Try local Express backend on http://localhost:3000 (if running)
    try {
      const response = await fetch(LOCAL_BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          modelId,
          openBook,
          conversationHistory,
          files
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch {
      // Local backend not running, proceed to intelligent offline mentor
    }

    // 3. Fallback Editorial Mentor Engine (Offline mode)
    await new Promise(resolve => setTimeout(resolve, 300));

    if (isGreetingOrShortMessage(message)) {
      const isBengali = /[\u0980-\u09FF]/.test(message || '');
      return {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        modelId: model.id,
        modelName: model.name,
        text: isBengali
          ? `নমস্কার, লেখক! আমি ভাষা লাইব্রেরির এডিটোরিয়াল কো-রাইটার।\n\nআজ আপনি কোন গল্প বা দৃশ্য নিয়ে কাজ করছেন? আপনার গল্পের মূল প্লট, চরিত্র অথবা যে দৃশ্যটি লিখতে চান, সে সম্পর্কে আমাকে জানান। আমরা একসাথে গল্পটি গড়ে তুলব!`
          : `Hello, author! I am your literary co-writer and editorial mentor for **Bhasha Library**.\n\nWhat story or scene are you working on today? Tell me a bit about your plot, central characters, or premise, and we can begin developing it together!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: []
      };
    }

    const cleanMsg = (message || '').toLowerCase();

    // Guardrail: Refuse full story generation
    if (cleanMsg.includes('write full story') || cleanMsg.includes('write the story for me') || cleanMsg.includes('write chapter')) {
      return {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        modelId: model.id,
        modelName: model.name,
        text: `As your editorial co-writer, my mission is to elevate and polish *your* original voice rather than write the manuscript for you.\n\n` +
          `I cannot compose a full chapter or entire story on your behalf, but I would love to:\n` +
          `- Outline a structured 3-act pacing roadmap for this chapter.\n` +
          `- Brainstorm character dialogue alternatives in Bengali or English.\n` +
          `- Deepen the sensory and emotional resonance of your existing draft lines.\n\n` +
          `Share your opening beat or character premise, and let's craft it together step by step!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: []
      };
    }

    // Guardrail: Refuse off-topic non-creative queries
    if (cleanMsg.includes('python') || cleanMsg.includes('javascript') || cleanMsg.includes('react') || cleanMsg.includes('coding') || cleanMsg.includes('crypto') || cleanMsg.includes('stock market')) {
      const isBengali = /[\u0980-\u09FF]/.test(message || '');
      return {
        id: `msg-${Date.now()}`,
        sender: 'agent',
        modelId: model.id,
        modelName: model.name,
        text: isBengali
          ? `আমি ভাষা লাইব্রেরির অথর ফেলোশিপ কো-রাইটার। আমি কেবল সৃজনশীল সাহিত্য, গল্প রচনা, চরিত্রের বিকাশ এবং লেখার পরামর্শ দিতে পারি।\n\nআসুন আপনার গল্পের পাণ্ডুলিপিতে ফিরে যাই। আপনি বর্তমানে কোন গল্প বা চরিত্র নিয়ে লিখছেন?`
          : `I am the Bhasha Library Author Fellowship Co-Writer, dedicated exclusively to creative writing, storytelling craft, character development, and editorial guidance.\n\nLet us return to your manuscript. What story, characters, or scene are you currently developing?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: []
      };
    }

    // Default guidance encouraging plot details
    return {
      id: `msg-${Date.now()}`,
      sender: 'agent',
      modelId: model.id,
      modelName: model.name,
      text: `I hear you! To give you the best editorial feedback and dialogue ideas, tell me a little more about your story.\n\n` +
        `- What is the central premise or conflict?\n` +
        `- Who are your main characters, and what do they want?\n` +
        `- What specific scene are you drafting right now?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: []
    };
  }
};
