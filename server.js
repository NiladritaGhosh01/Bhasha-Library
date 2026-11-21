import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// 1. Load environment variables (.env.local first, then fallback to .env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and generous body limit for multimodal attachments (images/PDFs)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 2. Initialize Gemini & Groq API Clients
const getApiKey = () => process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const getGroqKey = () => process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';

let aiClient = null;
let currentKey = '';

function getGenAI() {
  const key = getApiKey();
  if (!key) return null;
  if (!aiClient || currentKey !== key) {
    aiClient = new GoogleGenAI({ apiKey: key });
    currentKey = key;
  }
  return aiClient;
}

// 3. Complete Bhasha Library Classical Catalog for archival grounding
const BHASHA_CATALOG = [
  {
    id: 'gitanjali-1910',
    name: 'Gitanjali (গীতাঞ্জলি - Song Offerings)',
    author: 'Rabindranath Tagore (রবীন্দ্রনাথ ঠাকুর)',
    yearPublished: 1910,
    genre: 'Poetry & Mysticism',
    summary: 'Tagore’s world-renowned collection of prose poetry exploring divine devotion, transcendental surrender, human longing, and mystical cosmic connection. Awarded the Nobel Prize in Literature in 1913.',
    keyThemes: ['divine devotion', 'surrender', 'mysticism', 'spiritual longing', 'poetry', 'humanity'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Song I: The Endless Flute',
      excerpt: 'Thou hast made me endless, such is thy pleasure. This frail vessel thou emptiest again and again, and fillest it ever with fresh life.'
    }
  },
  {
    id: 'pather-panchali-1929',
    name: 'Pather Panchali (পথের পাঁচালী - Song of the Road)',
    author: 'Bibhutibhushan Bandyopadhyay (বিভূতিভূষণ বন্দ্যোপাধ্যায়)',
    yearPublished: 1929,
    genre: 'Rural Realism',
    summary: 'The tender, poignant chronicle of young Apu and his free-spirited elder sister Durga growing up in the pastoral solitude of Nischindipur village. A masterpiece of childhood wonder and rural pathos.',
    keyThemes: ['childhood wonder', 'rural poverty', 'brother-sister bond', 'pastoral nostalgia', 'nature', 'train motif'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Chapter I: The Forest of Nischindipur',
      excerpt: 'The afternoon sun was filtering through the dense canopy of mango and sonajhuri branches in the ancestral orchard of Harihar Roy.'
    }
  },
  {
    id: 'aranyak-1939',
    name: 'Aranyak (আরণ্যক - Of the Forest)',
    author: 'Bibhutibhushan Bandyopadhyay (বিভূতিভূষণ বন্দ্যোপাধ্যায়)',
    yearPublished: 1939,
    genre: 'Wilderness Classic',
    summary: 'A profound ecological and spiritual memoir of an urban intellectual sent to clear and survey the vast primordial virgin forests of Bihar, witnessing ancient indigenous harmony collide with industrial destruction.',
    keyThemes: ['primordial forest', 'ecology', 'indigenous folklore', 'solitude', 'environmental loss', 'nature mysticism'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Part I: The Infinite Sal Grasslands',
      excerpt: 'When I first stepped into the vast expanse of Fulkia and Lobtulia, I did not know that the forest would claim my heart forever.'
    }
  },
  {
    id: 'devdas-1917',
    name: 'Devdas (দেবদাস)',
    author: 'Sarat Chandra Chattopadhyay (শরৎচন্দ্র চট্টোপাধ্যায়)',
    yearPublished: 1917,
    genre: 'Romantic Tragedy',
    summary: 'The iconic tragic saga of childhood sweethearts Devdas and Paro, torn apart by rigid feudal hierarchy and pride, leading Devdas into a downward spiral cushioned by the selfless devotion of Chandramukhi.',
    keyThemes: ['unfulfilled love', 'feudal pride', 'self-destruction', 'childhood sweetheart', 'devotion', 'melodrama'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Chapter I: Childhood by the Ichhamati',
      excerpt: 'In the quiet hamlet of Talsonapur, Devdas and Parvati spent their childhood in inseparable camaraderie.'
    }
  },
  {
    id: 'sesher-kobita-1929',
    name: 'Sesher Kobita (শেষের কবিতা - The Last Poem)',
    author: 'Rabindranath Tagore (রবীন্দ্রনাথ ঠাকুর)',
    yearPublished: 1929,
    genre: 'Modernist Romance',
    summary: 'A sparkling, intellectually daring romance set in the mist-wreathed hills of Shillong between witty Oxford barrister Amit Ray and serene governess Labanya, questioning whether romantic passion can survive domesticity.',
    keyThemes: ['intellectual love', 'modernism', 'freedom vs possession', 'epistolary verse', 'witty dialogue', 'poetic philosophy'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Canto I: Amit Ray and his Oxford Dandyism',
      excerpt: 'Amit Ray was not merely modern; he was ahead of the modern. He believed romantic love was the rare, intoxicating vintage kept in delicate crystal flutes.'
    }
  },
  {
    id: 'srikanta-1917',
    name: 'Srikanta (শ্রীকান্ত - The Wanderer)',
    author: 'Sarat Chandra Chattopadhyay (শরৎচন্দ্র চট্টোপাধ্যায়)',
    yearPublished: 1917,
    genre: 'Social Realism',
    summary: 'A sprawling autobiographical picaresque following nomadic wanderer Srikanta, fearless adventurer Indranath, and devoted courtesan Rajlakshmi across colonial Bengal and Burma.',
    keyThemes: ['bohemian wanderer', 'caste boundaries', 'unconventional friendship', 'monsoon river expeditions', 'rebellion'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Chapter I: Indranath and the Dark Ganges',
      excerpt: 'Fear was a stranger to his blood; he walked through haunted cremation grounds with the careless grace of a young panther.'
    }
  },
  {
    id: 'chander-pahar-1937',
    name: 'Chander Pahar (চাঁদের পাহাড় - Mountain of the Moon)',
    author: 'Bibhutibhushan Bandyopadhyay (বিভূতিভূষণ বন্দ্যোপাধ্যায়)',
    yearPublished: 1937,
    genre: 'Adventure & Exploration',
    summary: 'The quintessential Bengali adventure saga of young Shankar Roy Choudhury leaving his rural home to explore African wilderness, encountering volcanic craters and diamond mines.',
    keyThemes: ['geographic exploration', 'african savannah', 'courage', 'survival', 'unknown horizons', 'exotic journey'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Chapter I: Across the Indian Ocean',
      excerpt: 'Shankar could never reconcile himself to the suffocating routine of an ordinary village clerkship. His restless eyes were constantly turned toward geography maps.'
    }
  },
  {
    id: 'anandamath-1882',
    name: 'Anandamath (আনন্দমঠ - Abbey of Bliss)',
    author: 'Bankim Chandra Chattopadhyay (বঙ্কিমচন্দ্র চট্টোপাধ্যায়)',
    yearPublished: 1882,
    genre: 'Historical Epic',
    summary: 'The seminal historical novel set during the devastating Bengal Famine of 1770 and the Sannyasi Rebellion. Birthplace of the hymn "Vande Mataram", celebrating selfless sacrifice.',
    keyThemes: ['patriotic devotion', 'historical rebellion', 'famine', 'moral duty', 'ascetic fraternity', 'social upheaval'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Prologue: The Great Famine of 1176 BS',
      excerpt: 'The year was 1176 of the Bengali era. The monsoon clouds had failed to weep upon the parched earth, and throughout Bengal the fields turned to dust and ash.'
    }
  },
  {
    id: 'kapalkundala-1866',
    name: 'Kapalkundala (কপালকুণ্ডলা)',
    author: 'Bankim Chandra Chattopadhyay (বঙ্কিমচন্দ্র চট্টোপাধ্যায়)',
    yearPublished: 1866,
    genre: 'Gothic Romance',
    summary: 'A haunting romantic mystery set along the untamed coastal sands of Hijli where stranded young pilgrim Nabakumar is rescued from a Kapalika sacrifice by forest maiden Kapalkundala.',
    keyThemes: ['gothic romance', 'nature child vs society', 'mysticism', 'coastal dunes', 'fateful encounter', 'eeriness'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Chapter I: Stranded on the Dunes of Hijli',
      excerpt: 'Just as the ritual blade was raised, a soft, ethereal voice broke the dark hush of the forest: "পথিক, তুমি কি পথ হারাইয়াছ?" (Traveler, hast thou lost thy path?)'
    }
  },
  {
    id: 'rupashi-bangla-1957',
    name: 'Rupashi Bangla (রূপসী বাংলা - Beautiful Bengal)',
    author: 'Jibanananda Das (জীবনানন্দ দাশ)',
    yearPublished: 1957,
    genre: 'Lyrical Poetry',
    summary: 'The posthumously published lyrical testament to the melancholic, timeless beauty of rural Bengal: its owls, hijal boughs, silted canals, and autumnal twilight skies.',
    keyThemes: ['melancholy', 'autumn twilight', 'rural flora and fauna', 'death and rebirth', 'lyrical sensuality', 'nostalgia'],
    sampleFolio: {
      pageNumber: 1,
      title: 'Sonnet I: The Face of Bengal',
      excerpt: 'বাংলার মুখ আমি দেখিয়াছি, তাই আমি পৃথিবীর রূপ খুঁজিতে যাই না আর (I have gazed upon the face of Bengal, and so I seek no more the wonders of this earth).'
    }
  }
];

// Helper to detect greetings and short conversational openers
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

// Load dynamic genre database from booksDatabase.json
function getBooksDatabase() {
  try {
    const dbPath = path.join(process.cwd(), 'booksDatabase.json');
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Error reading booksDatabase.json:', err.message);
  }
  return [];
}

// 4. Strict System Instruction Base enforcing Persona, Guardrails & Catalog Grounding
const SYSTEM_INSTRUCTION_BASE = `You are the Author Fellowship AI Co-Writer and Editorial Mentor for Bhasha Library (ভাষা লাইব্রেরি).
You are an erudite, refined, and bilingual (Bengali & English) literary companion, assisting authors who write in Bengali, English, or bilingual modes.

### CONVERSATIONAL NATURE & INTERACTION STYLE:
- Chat and converse naturally, warmly, and fluidly like other modern AI chat applications (such as ChatGPT, Claude, Gemini).
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
     2. Cross-reference their story against Bhasha Library's catalog (both our canonical manuscripts and our classified Genre Database books from booksDatabase.json).
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
   * rupashi-bangla-1957: Rupashi Bangla (Jibanananda Das) - Lyrical Melancholy, Autumn Solitude, Bengali Landscape

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
   - Do NOT use repetitive robotic AI buzzwords. Keep your editorial tone encouraging, thoughtful, and deeply respectful of the craft of writing.`;

// Dynamic system instruction including booksDatabase.json catalog
function getSystemInstruction() {
  const dbBooks = getBooksDatabase();
  let dbSection = '';
  if (dbBooks.length > 0) {
    dbSection = `\n\n### BHASHA LIBRARY GENRE DATABASE (from booksDatabase.json):\n` +
      `Our active collection includes these classified genre PDF volumes:\n` +
      dbBooks.map(b =>
        `* [Genre: ${b.genre}] "${b.title}" by ${b.author} (ID: "${b.id}", Path: "${b.filePath}")\n` +
        `  Themes & Summary: ${b.summaryKeywords}`
      ).join('\n') +
      `\n\nWhen recommending matching books from this collection, mention the book title, author, and genre, explaining why this work fits the author's narrative arc. Append the citation tag in this exact format:\n` +
      `[CITATION: bookId | Book Title | Folio/Page Number | Key Insight or Quote]`;
  }
  return SYSTEM_INSTRUCTION_BASE + dbSection;
}

// 5. Helper to extract matching book citations for UI cards
function extractCitations(text) {
  if (!text) return [];

  const citations = [];
  const dbBooks = getBooksDatabase();

  // Extract ONLY explicit citation tags generated by the AI
  const tagRegex = /\[CITATION:\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^\]]+)\]/g;
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    const rawId = match[1].trim();
    const rawBookName = match[2].trim();
    const pageNumber = parseInt(match[3].trim(), 10) || 1;
    const quote = match[4].trim();

    // Check booksDatabase.json first, then classical catalog
    const dbEntry = dbBooks.find(b =>
      b.id === rawId ||
      b.id.toLowerCase() === rawId.toLowerCase() ||
      b.title.toLowerCase().includes(rawId.toLowerCase()) ||
      rawBookName.toLowerCase().includes(b.title.toLowerCase())
    );

    const catalogEntry = dbEntry || BHASHA_CATALOG.find(b =>
      b.id === rawId ||
      b.id.toLowerCase() === rawId.toLowerCase() ||
      b.name.toLowerCase().includes(rawId.toLowerCase())
    );

    const bookId = dbEntry ? dbEntry.id : (catalogEntry ? catalogEntry.id : rawId);
    const bookName = dbEntry ? dbEntry.title : (catalogEntry ? (catalogEntry.name || catalogEntry.title) : rawBookName);
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

// 6. Robust content generation with model fallback, timeout & retry
async function generateGeminiContent(ai, contents) {
  const rawList = [
    process.env.GEMINI_MODEL,
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.8-flash'
  ].filter(Boolean);
  const modelsToTry = [...new Set(rawList)];

  let lastError = null;
  for (const model of modelsToTry) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`TIMEOUT: ${model} did not respond within 15 seconds`)), 15000)
      );

      const apiPromise = ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: getSystemInstruction(),
          temperature: 0.7,
          topP: 0.95
        }
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);
      if (response && response.text) {
        return { text: response.text, model };
      }
    } catch (err) {
      lastError = err;
      // If error (e.g. 503 high demand, 404, or timeout), immediately continue to next candidate model
      console.warn(`Model ${model} unavailable (${err.message.slice(0, 70)}), trying fallback model...`);
    }
  }
  throw lastError;
}

// 6b. Groq Cloud Content Generation with model fallback
async function generateGroqContent(prompt, conversationHistory = [], preferredModel = 'openai/gpt-oss-120b') {
  const apiKey = getGroqKey();
  if (!apiKey) return null;

  const messages = [
    { role: 'system', content: getSystemInstruction() }
  ];

  if (Array.isArray(conversationHistory)) {
    for (const item of conversationHistory.slice(-8)) {
      if (!item.text) continue;
      messages.push({
        role: item.sender === 'user' ? 'user' : 'assistant',
        content: item.text
      });
    }
  }

  messages.push({ role: 'user', content: prompt });

  const candidates = [...new Set([preferredModel, 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'])];

  for (const m of candidates) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: m,
          messages,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text, model: m };
      }
    } catch (err) {
      console.warn(`Groq candidate ${m} error:`, err.message);
    }
  }
  return null;
}

// 7. Primary Chat Endpoint for Author Studio Co-Writer
app.post(['/api/chat', '/api/ai/chat'], async (req, res) => {
  const { message = '', conversationHistory = [], openBook = null, files = [], modelId = 'openai/gpt-oss-120b' } = req.body;

  if (!message && (!files || files.length === 0)) {
    return res.status(400).json({ error: 'Message text or file attachment is required.' });
  }

  const isGreeting = isGreetingOrShortMessage(message);

  // If user selected Groq model or Gemini is not available, try Groq Cloud first
  if (modelId.startsWith('openai/') || modelId.startsWith('qwen/') || !getApiKey()) {
    try {
      let promptText = message;
      if (Array.isArray(files) && files.length > 0) {
        files.forEach(f => {
          promptText += `\n[Attached File: ${f.name}]`;
        });
      }

      const groqResult = await generateGroqContent(promptText, conversationHistory, modelId);
      if (groqResult && groqResult.text) {
        const citations = extractCitations(groqResult.text);
        const cleanedReply = groqResult.text
          .replace(/\[CITATION:\s*[^\]]+\]/g, '')
          .replace(/—/g, ', ')
          .trim();

        const modelDisplayName = groqResult.model.includes('120b')
          ? 'GPT-OSS 120B (Groq)'
          : (groqResult.model.includes('qwen') ? 'Qwen 2.5 27B (Groq)' : 'Groq Instant 20B');

        return res.json({
          id: `msg-${Date.now()}`,
          sender: 'agent',
          modelId: groqResult.model,
          modelName: modelDisplayName,
          text: cleanedReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations
        });
      }
    } catch (err) {
      console.warn('Groq server call error:', err.message);
    }
  }

  const ai = getGenAI();

  // If Gemini API is available, let the live AI generate a natural, conversational response!
  if (ai) {
    try {
      // Build Gemini contents array from history and current prompt
      const contents = [];

      // Add prior turns from conversationHistory for natural conversational memory
      if (Array.isArray(conversationHistory)) {
        for (const item of conversationHistory.slice(-8)) {
          if (!item.text) continue;
          const role = item.sender === 'user' ? 'user' : 'model';
          contents.push({
            role,
            parts: [{ text: item.text }]
          });
        }
      }

      // Build current user message parts (multimodal: files + text prompt)
      const currentParts = [];

      // Process attached files (images & docs)
      let contextualPrefix = '';
      if (Array.isArray(files) && files.length > 0) {
        for (const file of files) {
          if (!file.data) continue;
          const rawBase64 = file.data.includes(',') ? file.data.split(',')[1] : file.data;
          const mimeType = file.mimeType || 'image/jpeg';

          if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
            currentParts.push({
              inlineData: {
                mimeType,
                data: rawBase64
              }
            });
          } else if (mimeType.startsWith('text/') || mimeType.includes('document')) {
            try {
              const decodedText = Buffer.from(rawBase64, 'base64').toString('utf-8');
              contextualPrefix += `[Attached Note / Document: "${file.name}"]:\n${decodedText.slice(0, 4000)}\n\n`;
            } catch {
              currentParts.push({
                inlineData: {
                  mimeType,
                  data: rawBase64
                }
              });
            }
          }
        }
      }

      // Add prompt text
      const fullPromptText = `${contextualPrefix}${message || 'Please analyze the attached notes or manuscript materials.'}`;
      currentParts.push({ text: fullPromptText });

      contents.push({
        role: 'user',
        parts: currentParts
      });

      // Call Gemini with live model
      const { text: rawReply, model: usedModel } = await generateGeminiContent(ai, contents);

      // Extract citations and clean citation tags from output for clean reading
      const citations = extractCitations(rawReply);
      const cleanedReply = rawReply
        .replace(/\[CITATION:\s*[^\]]+\]/g, '')
        .replace(/—/g, ', ')
        .trim();

      const modelDisplayName = usedModel.includes('3.1')
        ? 'Gemini 3.1 Flash'
        : (usedModel.includes('3.5')
        ? 'Gemini 3.5 Flash'
        : (usedModel.includes('3.8') ? 'Gemini 3.8 Flash' : 'Gemini Flash'));

      return res.json({
        id: `msg-${Date.now()}`,
        sender: 'agent',
        modelId: usedModel,
        modelName: modelDisplayName,
        text: cleanedReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: citations
      });
    } catch (error) {
      console.warn('Gemini API temporary issue, trying Groq fallback before offline mentor:', error.message);
      // Try Groq as fallback
      const groqFallback = await generateGroqContent(message, conversationHistory);
      if (groqFallback && groqFallback.text) {
        const citations = extractCitations(groqFallback.text);
        const cleanedReply = groqFallback.text
          .replace(/\[CITATION:\s*[^\]]+\]/g, '')
          .replace(/—/g, ', ')
          .trim();
        return res.json({
          id: `msg-${Date.now()}`,
          sender: 'agent',
          modelId: groqFallback.model,
          modelName: 'GPT-OSS 120B (Groq)',
          text: cleanedReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations
        });
      }
    }
  }

  // Graceful Fallback (if API key missing or network down)
  const cleanMsg = (message || '').toLowerCase();
  const isBengali = /[\u0980-\u09FF]/.test(message);

  // 1. Guardrail Refusal: No full story generation
  if (cleanMsg.includes('write full story') || cleanMsg.includes('write the story for me') || cleanMsg.includes('write chapter')) {
    return res.json({
      id: `msg-${Date.now()}`,
      sender: 'agent',
      modelId: 'gemini-3.1-flash-lite',
      modelName: 'Gemini 3.1 Flash',
      text: isBengali
        ? `আপনার এডিটোরিয়াল কো-রাইটার হিসেবে আমার লক্ষ্য আপনার নিজস্ব সৃজনশীল কণ্ঠকে ফুটিয়ে তোলা, সম্পূর্ণ গল্প নিজে লিখে দেওয়া নয়।\n\nআমি সম্পূর্ণ অধ্যায় বা গল্প নিজে লিখে দিতে পারব না, তবে আমি সানন্দে:\n- এই অধ্যায়ের জন্য একটি ৩-অঙ্কের পেসিং রোডম্যাপ তৈরি করতে পারি।\n- চরিত্রের জন্য চমৎকার সংলাপের বিকল্প brainstorm করতে পারি।\n- আপনার বিদ্যমান ড্রাফটের আবেগ ও আবহ আরও গভীর করতে সাহায্য করতে পারি।\n\nআপনার শুরুর ভাবনা বা দৃশ্যটি শেয়ার করুন, আমরা একসাথে এটি গড়ে তুলব!`
        : `As your editorial co-writer, my mission is to elevate and polish your original voice rather than write the manuscript for you.\n\nI cannot compose a full chapter or entire story on your behalf, but I would love to:\n- Outline a structured 3-act pacing roadmap for this chapter.\n- Brainstorm character dialogue alternatives in Bengali or English.\n- Deepen the sensory and emotional resonance of your existing draft lines.\n\nShare your opening scene beat or character premise, and let's craft it together step by step!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: []
    });
  }

  // 2. Guardrail Refusal: Creative writing topic boundary
  if (cleanMsg.includes('python') || cleanMsg.includes('javascript') || cleanMsg.includes('react') || cleanMsg.includes('coding') || cleanMsg.includes('crypto') || cleanMsg.includes('stock market')) {
    return res.json({
      id: `msg-${Date.now()}`,
      sender: 'agent',
      modelId: 'gemini-3.1-flash-lite',
      modelName: 'Gemini 3.1 Flash',
      text: isBengali
        ? `আমি ভাষা লাইব্রেরির অথর ফেলোশিপ কো-রাইটার। আমি কেবল সৃজনশীল সাহিত্য, গল্প রচনা, চরিত্রের বিকাশ এবং লেখার পরামর্শ দিতে পারি।\n\nআসুন আপনার গল্পের পাণ্ডুলিপিতে ফিরে যাই। আপনি বর্তমানে কোন গল্প বা চরিত্র নিয়ে লিখছেন?`
        : `I am the Bhasha Library Author Fellowship Co-Writer, dedicated exclusively to creative writing, storytelling craft, character development, and editorial guidance.\n\nLet us return to your manuscript. What story, characters, or scene are you currently developing?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: []
    });
  }

  // 3. Greetings & Casual Openers (Never suggest books or citations)
  const isAskingForBook = cleanMsg.includes('recommend') || cleanMsg.includes('book') || cleanMsg.includes('read') || cleanMsg.includes('library') || cleanMsg.includes('archive') || cleanMsg.includes('বই');
  const hasStoryDetails = cleanMsg.includes('story') || cleanMsg.includes('plot') || cleanMsg.includes('character') || cleanMsg.includes('scene') || cleanMsg.includes('dialogue') || cleanMsg.includes('গল্প') || cleanMsg.length > 55;

  if (isGreeting || (!isAskingForBook && !hasStoryDetails)) {
    return res.json({
      id: `msg-${Date.now()}`,
      sender: 'agent',
      modelId: 'gemini-3.1-flash-lite',
      modelName: 'Gemini 3.1 Flash',
      text: isBengali
        ? `নমস্কার, লেখক! আমি ভাষা লাইব্রেরির এডিটোরিয়াল কো-রাইটার।\n\nআজ আপনি কোন গল্প বা দৃশ্য নিয়ে কাজ করছেন? আপনার গল্পের মূল প্লট, চরিত্র অথবা যে দৃশ্যটি লিখতে চান, সে সম্পর্কে আমাকে জানান। আমরা একসাথে গল্পটি গড়ে তুলব!`
        : `Hello, author! I am your literary co-writer and editorial mentor for **Bhasha Library**.\n\nWhat story or scene are you working on today? Tell me a bit about your plot, central characters, or premise, and we can begin developing it together!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: []
    });
  }

  // 4. Story Plot Described: Cross-reference catalog and provide constructive craft suggestions
  const dbBooks = getBooksDatabase();
  let recBook = null;
  let bookQuote = '';
  let bookPage = 1;

  if (cleanMsg.includes('adventure') || cleanMsg.includes('chander pahar') || cleanMsg.includes('চাঁদের পাহাড়') || cleanMsg.includes('africa') || cleanMsg.includes('diamond')) {
    const matched = dbBooks.find(b => b.genre === 'Adventure');
    recBook = matched || BHASHA_CATALOG[6];
  } else if (cleanMsg.includes('devdas') || cleanMsg.includes('romance') || cleanMsg.includes('love') || cleanMsg.includes('দেবদাস')) {
    const matched = dbBooks.find(b => b.genre === 'Romance');
    recBook = matched || BHASHA_CATALOG[3];
  } else if (cleanMsg.includes('historical') || cleanMsg.includes('history') || cleanMsg.includes('rebellion') || cleanMsg.includes('anandamath') || cleanMsg.includes('আনন্দমঠ')) {
    const matched = dbBooks.find(b => b.genre === 'Historical');
    recBook = matched || BHASHA_CATALOG[7];
  } else if (cleanMsg.includes('forest') || cleanMsg.includes('nature') || cleanMsg.includes('aranyak') || cleanMsg.includes('আরণ্যক')) {
    recBook = BHASHA_CATALOG[2];
  } else if (cleanMsg.includes('poem') || cleanMsg.includes('poetry') || cleanMsg.includes('gitanjali') || cleanMsg.includes('গীতাঞ্জলি')) {
    recBook = BHASHA_CATALOG[0];
  }

  if (!recBook) {
    recBook = dbBooks[0] || BHASHA_CATALOG[1];
  }

  const recTitle = recBook.title || recBook.name;
  const recAuthor = recBook.author;
  bookQuote = recBook.sampleFolio ? recBook.sampleFolio.excerpt : (recBook.summaryKeywords || 'A seminal masterwork from Bhasha Library collection.');
  bookPage = recBook.sampleFolio ? recBook.sampleFolio.pageNumber : 1;

  return res.json({
    id: `msg-${Date.now()}`,
    sender: 'agent',
    modelId: 'gemini-3.1-flash-lite',
    modelName: 'Gemini 3.1 Flash',
    text: `I have received your story premise.\n\n` +
      `Your narrative themes connect naturally with the world of **${recTitle}** by *${recAuthor}* (${recBook.genre || 'Classic Literature'}):\n\n` +
      `> "${bookQuote}"\n\n` +
      `**Editorial Suggestion:** Notice how this classic grounds the emotional stakes of the scene. Would you like to outline the next scene beats or explore dialogue options for your characters?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    citations: [{
      bookId: recBook.id,
      bookName: recTitle,
      author: recAuthor,
      genre: recBook.genre || '',
      filePath: recBook.filePath || '',
      pageNumber: bookPage,
      quote: bookQuote
    }]
  });
});

// 8. Books Database Endpoint (classified genre collection)
app.get(['/api/books', '/api/books/database'], (req, res) => {
  const books = getBooksDatabase();
  res.json({
    total: books.length,
    books
  });
});

// 9. Health Check Endpoint
app.get('/api/health', (req, res) => {
  const books = getBooksDatabase();
  res.json({
    status: 'ok',
    service: 'Bhasha Library Author Fellowship Backend',
    geminiConfigured: Boolean(getApiKey()),
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    booksInDatabase: books.length,
    timestamp: new Date().toISOString()
  });
});

// 10. Start Express Server
app.listen(PORT, () => {
  const books = getBooksDatabase();
  console.log(`======================================================`);
  console.log(`Bhasha Library Backend listening on http://localhost:${PORT}`);
  console.log(`Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'} (with auto-fallback)`);
  console.log(`Gemini API Key: ${getApiKey() ? 'Configured (Live API Active)' : 'Not set in .env.local (Using Intelligent Fallback)'}`);
  console.log(`Genre Database: ${books.length} classified book(s) loaded from booksDatabase.json`);
  console.log(`======================================================`);
});
