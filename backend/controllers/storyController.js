const { admin, db, isFirestoreAvailable } = require('../config/firebase');

// In-memory fallback dataset for development
let memoryStories = [
  {
    id: '1',
    slug: 'the-golden-mango',
    genre: 'Folklore',
    genreBn: 'লোকগাথা',
    readTime: '4 min',
    likes: 142,
    title: {
      en: 'The Golden Mango of Sonargaon',
      bn: 'সোনারগাঁওয়ের সোনার আম'
    },
    synopsis: {
      en: 'In an ancient courtyard on the banks of the Meghna, a solitary tree bloomed once every century.',
      bn: 'মেঘনা নদীর তীরে এক প্রাচীন উঠোনে শতবর্ষে একবার এক অদ্ভুত গাছ ফুল দিত।'
    },
    author: 'Niladrita Ghosh',
    authorRole: 'Lead Storyteller',
    date: 'Nov 13, 2026',
    languages: ['en', 'bn'],
    paragraphs: [
      {
        en: 'Generations of villagers in Sonargaon whispered tales of the solitary mango tree standing beside the old copper temple. Its bark was as dark as ebony, yet its leaves shimmered like spun emerald whenever the monsoon dawn broke.',
        bn: 'সোনারগাঁওয়ের গ্রামবাসীরা বহু প্রজন্ম ধরে পুরানো তামার মন্দিরের পাশে দাঁড়ানো একাকী আমগাছটির গল্প বলে আসছিল। এর বাকল ছিল আবলুশের মতো কালো, কিন্তু বর্ষার ভোর হলেই এর পাতাগুলো বোনা পান্নার মতো জ্বলজ্বল করত।'
      },
      {
        en: 'A young girl named Ananya was the only one who tended its roots through summer droughts. She brought earthen jars of fresh river water, singing quiet melodies her grandmother had taught her.',
        bn: 'অনন্যা নামের এক কিশোরীই কেবল গ্রীষ্মের খরায় এর শিকড়ের যত্ন নিত। সে মাটির কলসি ভরে নদীর মিষ্টি জল আনত আর গুনগুনিয়ে গাইত ঠাকুমার শেখানো শান্ত সুর।'
      }
    ],
    vocabulary: [
      { word: 'Ebony', bn: 'আবলুশ কাঠ', note: 'Dense black hardwood' },
      { word: 'Emerald', bn: 'পান্না', note: 'Precious bright green gemstone' }
    ],
    createdAt: new Date().toISOString()
  }
];

// @desc    Get all stories (Firestore or fallback)
// @route   GET /api/stories
const getStories = async (req, res) => {
  try {
    if (isFirestoreAvailable() && db) {
      const snapshot = await db.collection('stories').orderBy('createdAt', 'desc').get();
      const stories = [];
      snapshot.forEach(doc => {
        stories.push({ id: doc.id, ...doc.data() });
      });

      // If Firestore is currently empty, return default seeds
      if (stories.length === 0) {
        return res.status(200).json({
          success: true,
          count: memoryStories.length,
          data: memoryStories,
          source: 'seed'
        });
      }

      return res.status(200).json({
        success: true,
        count: stories.length,
        data: stories,
        source: 'firestore'
      });
    }

    // In-memory fallback
    res.status(200).json({
      success: true,
      count: memoryStories.length,
      data: memoryStories,
      source: 'memory'
    });
  } catch (err) {
    console.error('Error fetching stories:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single story by ID
// @route   GET /api/stories/:id
const getStoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isFirestoreAvailable() && db) {
      const doc = await db.collection('stories').doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ success: false, message: 'Story not found in Firestore' });
      }
      return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
    }

    const story = memoryStories.find(s => s.id === id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    res.status(200).json({ success: true, data: story });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create new bilingual story (Firestore or fallback)
// @route   POST /api/stories
const createStory = async (req, res) => {
  try {
    const { title, paragraphs, synopsis, genre, genreBn, author, vocabulary, readTime } = req.body;

    if (!title || (!paragraphs && !req.body.content)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both title and content/paragraphs.'
      });
    }

    const storyDoc = {
      title: typeof title === 'object' ? title : { en: title, bn: title },
      paragraphs: paragraphs || [
        {
          en: req.body.content?.en || (typeof req.body.content === 'string' ? req.body.content : ''),
          bn: req.body.content?.bn || ''
        }
      ],
      synopsis: synopsis || {
        en: paragraphs?.[0]?.en?.slice(0, 120) + '...' || '',
        bn: paragraphs?.[0]?.bn?.slice(0, 120) + '...' || ''
      },
      genre: genre || 'Folklore',
      genreBn: genreBn || 'লোকগাথা',
      readTime: readTime || '3 min',
      author: author || (req.user ? (req.user.name || req.user.email) : 'Community Author'),
      authorUid: req.user ? req.user.uid : null,
      likes: 1,
      languages: ['en', 'bn'],
      vocabulary: vocabulary || [],
      createdAt: new Date().toISOString()
    };

    if (isFirestoreAvailable() && db) {
      const docRef = await db.collection('stories').add({
        ...storyDoc,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(201).json({
        success: true,
        data: { id: docRef.id, ...storyDoc },
        source: 'firestore'
      });
    }

    // In-memory fallback
    const newStory = { id: String(Date.now()), ...storyDoc };
    memoryStories.unshift(newStory);

    res.status(201).json({
      success: true,
      data: newStory,
      source: 'memory'
    });
  } catch (err) {
    console.error('Error creating story:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete story
// @route   DELETE /api/stories/:id
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;

    if (isFirestoreAvailable() && db) {
      await db.collection('stories').doc(id).delete();
      return res.status(200).json({ success: true, message: 'Story deleted from Firestore' });
    }

    memoryStories = memoryStories.filter(s => s.id !== id);
    res.status(200).json({ success: true, message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Like a story
// @route   POST /api/stories/:id/like
const likeStory = async (req, res) => {
  try {
    const { id } = req.params;

    if (isFirestoreAvailable() && db) {
      const docRef = db.collection('stories').doc(id);
      await docRef.update({
        likes: admin.firestore.FieldValue.increment(1)
      });
      return res.status(200).json({ success: true, message: 'Story liked' });
    }

    const story = memoryStories.find(s => s.id === id);
    if (story) story.likes = (story.likes || 0) + 1;
    res.status(200).json({ success: true, message: 'Story liked' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getStories,
  getStoryById,
  createStory,
  deleteStory,
  likeStory
};
