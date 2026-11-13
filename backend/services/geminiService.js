const { GoogleGenAI } = require('@google/genai');

class GeminiService {
  constructor() {
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.client = null;
    this.initClient();
  }

  initClient() {
    const key = process.env.GEMINI_API_KEY;
    if (key && (!this.client || this.lastApiKey !== key)) {
      try {
        this.client = new GoogleGenAI({ apiKey: key });
        this.lastApiKey = key;
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        console.log(`Gemini AI client ready with model: ${this.modelName}`);
        return true;
      } catch (err) {
        console.warn('Failed to initialize GoogleGenAI client:', err.message);
        return false;
      }
    }
    return Boolean(this.client);
  }

  isConfigured() {
    return this.initClient();
  }

  async generateBilingualStory({ prompt, title, genre = 'Folklore', tone = 'Folklore & Nostalgic' }) {
    if (!this.initClient()) {
      return this.generateFallbackStory({ prompt, title, genre, tone });
    }

    const systemPrompt = `You are a master bilingual author and literary translator specializing in English and Bengali (বাংলা).
Your task is to write an evocative, culturally rich short story based on the user's premise.
You MUST output your response strictly as valid, raw JSON (no markdown fences, no explanatory text outside JSON).

The JSON format must match this schema:
{
  "title": {
    "en": "Poetic title in English",
    "bn": "কাব্যিক শিরোনাম বাংলায়"
  },
  "genre": "${genre}",
  "genreBn": "বাংলায় বিভাগ (যেমন: লোকগাথা, কল্পবিজ্ঞান, সাহিত্য, রোমাঞ্চ)",
  "readTime": "3 min",
  "synopsis": {
    "en": "1-2 sentence compelling summary in English",
    "bn": "১-২ বাক্যে গল্পের আকর্ষণীয় সারাংশ বাংলায়"
  },
  "paragraphs": [
    {
      "en": "First paragraph in English.",
      "bn": "প্রথম অনুচ্ছেদ হুবহু বাংলায় ভাবানুবাদ ও শিল্পিত রূপ।"
    },
    {
      "en": "Second paragraph in English.",
      "bn": "দ্বিতীয় অনুচ্ছেদ বাংলায়।"
    },
    {
      "en": "Third paragraph in English.",
      "bn": "তৃতীয় অনুচ্ছেদ বাংলায়।"
    }
  ],
  "vocabulary": [
    {
      "word": "English vocabulary word from story",
      "bn": "বাংলা অর্থ",
      "note": "Contextual cultural or literary explanation"
    }
  ]
}

Guidelines:
- Both English and Bengali prose must feel natural, poetic, and literary.
- Each paragraph in English must correspond directly to the same paragraph in Bengali for side-by-side reading.
- Ensure correct Bengali typography and authentic cultural flavor.`;

    const userMessage = `Story Title (optional): ${title || 'Suggest an evocative title'}
Genre: ${genre}
Tone: ${tone}
Story Idea / Premise: ${prompt}`;

    try {
      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Request:\n${userMessage}` }] }
        ]
      });

      const responseText = response.text ? response.text.trim() : '';

      // Clean any accidental markdown code blocks (```json ... ```)
      const cleanedJson = responseText
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      const parsed = JSON.parse(cleanedJson);
      return parsed;
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new Error(`Failed to generate story with Gemini: ${error.message}`);
    }
  }

  generateFallbackStory({ prompt, title, genre, tone }) {
    const baseTitleEn = title || 'The Whispering River of Bengal';
    const baseTitleBn = 'বাংলার নদীর ফিসফিসানি';

    return {
      title: {
        en: baseTitleEn,
        bn: baseTitleBn
      },
      genre: genre || 'Folklore',
      genreBn: genre === 'Sci-Fi' ? 'কল্পবিজ্ঞান' : genre === 'Literary' ? 'সাহিত্য' : 'লোকগাথা',
      readTime: '3 min',
      synopsis: {
        en: `An enchanting ${tone.toLowerCase()} tale inspired by: "${prompt.slice(0, 100)}..."`,
        bn: `একটি হৃদয়স্পর্শী দ্বিভাষিক লোকগাথা, যেখানে নদীর শান্ত কূলে প্রাচীন স্মৃতিরা কথা বলে ওঠে।`
      },
      paragraphs: [
        {
          en: `On the quiet edges of the river, when the evening lamps flickered against the darkening water, ancient memories began to stir. The boatmen dipped their oarblades in rhythmic unison, humming melodies composed centuries before their grandfathers were born.`,
          bn: `নদীর শান্ত কূলে যখন সন্ধ্যার প্রদীপগুলো কালচে জলের বিপরীতে টিমটিম করে জ্বলত, তখন যেন প্রাচীন স্মৃতিরা জেগে উঠত। মাঝিরা তাদের বৈঠাগুলো এক ছন্দে জলে ডুবিয়ে এমন এক সুরে গান ধরত, যা তাদের পূর্বপুরুষদের জন্মের বহু শতক আগে রচিত হয়েছিল।`
        },
        {
          en: `A solitary boy stood on the wooden jetty, watching dragonflies skim across water lilies. He carried a small brass flute wrapped in indigo cotton, waiting for the dusk breeze to carry his tune across the marshland.`,
          bn: `একটি একাকী ছেলে কাঠের ঘাটে দাঁড়িয়ে শাপলার ওপর দিয়ে উড়ে যাওয়া ফড়িংদের খেলা দেখছিল। তার হাতে ছিল নীল সুতোয় জড়ানো একটি ছোট পিতলের বাঁশি, সে অপেক্ষা করছিল গোধূলির দখিন বাতাসের, যা তার সুর জলাভূমির ওপারে পৌঁছে দেবে।`
        },
        {
          en: `Suddenly, the water rippled in golden spirals as a school of shimmering silver hilsa jumped toward the twilight, as if dancing to the song of the rising harvest moon.`,
          bn: `হঠাৎ জল সোনালী ঘূর্ণিতে দোলে উঠল এবং এক ঝাঁক রূপালী ইলিশ গোধূলির আলোর দিকে লাফিয়ে উঠল, যেন উদীয়মান পূর্ণিমার চাঁদের গানের তালে তারা নৃত্য করছে।`
        }
      ],
      vocabulary: [
        { word: 'Unison', bn: 'ঐকতান / এক সুর', note: 'Simultaneous performance of action or speech' },
        { word: 'Jetty', bn: 'কাঠের ঘাট', note: 'A landing pier where boats are moored' },
        { word: 'Twilight', bn: 'গোধূলি লগ্ন', note: 'Soft glowing light at sunset' }
      ],
      isSimulated: true,
      note: 'Generated in fallback mode. Add GEMINI_API_KEY in backend/.env for live Gemini 3.5/2.5 Flash generation.'
    };
  }
}

module.exports = new GeminiService();
