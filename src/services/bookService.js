/**
 * Book Service & Literary Database
 * 
 * Provides unified access to book metadata stored in Cloud Firestore and
 * manuscript digital folios from Firebase Cloud Storage.
 * Tracks click telemetry (popularity metric) and powers search & AI context.
 * 
 * Supports offline-first resilience with local storage caching and
 * real-time bidirectional synchronization with Cloud Firestore.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured, FIREBASE_COLLECTIONS } from './firebaseConfig';

export const INITIAL_BOOKS = [
  {
    id: 'gitanjali-1910',
    name: 'Gitanjali (গীতাঞ্জলি - Song Offerings)',
    author: 'Rabindranath Tagore (রবীন্দ্রনাথ ঠাকুর)',
    yearPublished: 1910,
    decade: '1910s',
    genre: 'Poetry & Mysticism',
    pages: 148,
    isbn: '978-0-14-018854-7',
    clicks: 1420,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/gitanjali_1910.pdf',
    summary: 'Tagore’s world-renowned collection of prose poetry exploring divine devotion, transcendental surrender, human longing, and mystical cosmic connection. Awarded the Nobel Prize in Literature in 1913.',
    coverColor: '#4A1521',
    coverAccent: '#D4AF37',
    coverMotif: 'lotus',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Song I — The Endless Flute',
        paragraphs: [
          'Thou hast made me endless, such is thy pleasure. This frail vessel thou emptiest again and again, and fillest it ever with fresh life.',
          'This little flute of a reed thou hast carried over hills and dales, and hast breathed through it melodies eternally new. At the immortal touch of thy hands my little heart loses its limits in joy and gives birth to utterance ineffable.',
          'Thy infinite gifts come to me only on these very small hands of mine. Ages pass, and still thou pourest, and still there is room to fill.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Song XXXV — Freedom of the Mind',
        paragraphs: [
          'Where the mind is without fear and the head is held high; Where knowledge is free; Where the world has not been broken up into fragments by narrow domestic walls;',
          'Where words come out from the depth of truth; Where tireless striving stretches its arms towards perfection; Where the clear stream of reason has not lost its way into the dreary desert sand of dead habit;',
          'Where the mind is led forward by thee into ever-widening thought and action— Into that heaven of freedom, my Father, let my country awake.'
        ]
      },
      {
        pageNumber: 3,
        title: 'Song L — The Beggar and the King',
        paragraphs: [
          'I had gone a-begging from door to door in the village path, when thy golden chariot appeared in the distance like a gorgeous dream and I wondered who was this King of all kings!',
          'My hopes rose high and methought my evil days were at an end, and I stood waiting for alms to be given unasked and for wealth scattered on all sides in the dust. The chariot stopped where I stood. Thy glance fell on me and thou camest down with a smile.',
          'I felt that the luck of my life had come at last. Then of a sudden thou didst hold out thy right hand and say: "What hast thou to give to me?" Ah, what a kingly jest was it to open thy palm to a beggar to beg!'
        ]
      }
    ]
  },
  {
    id: 'pather-panchali-1929',
    name: 'Pather Panchali (পথের পাঁচালী - Song of the Road)',
    author: 'Bibhutibhushan Bandyopadhyay (বিভূতিভূষণ বন্দ্যোপাধ্যায়)',
    yearPublished: 1929,
    decade: '1920s',
    genre: 'Rural Realism',
    pages: 312,
    isbn: '978-8-17-078023-2',
    clicks: 1385,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/pather_panchali_1929.pdf',
    summary: 'The tender, poignant chronicle of young Apu and his free-spirited elder sister Durga growing up in the pastoral solitude of Nischindipur village. A masterpiece of childhood wonder and rural pathos.',
    coverColor: '#2B0700',
    coverAccent: '#E26D43',
    coverMotif: 'kash-flower',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Chapter I — The Forest of Nischindipur',
        paragraphs: [
          'The afternoon sun was filtering through the dense canopy of mango and sonajhuri branches in the ancestral orchard of Harihar Roy. The house was decrepit, with moss creeping over its mud-brick veranda.',
          'Apu sat upon a wooden stool, staring with wide, curious eyes at the blue hills of cloud gathering over the distant pond. To his young imagination, each rustling leaf held whispers of old fairytales told by his grandmother.',
          'His sister Durga appeared suddenly at the bamboo grove hedge, clutching a handful of raw green berries wrapped in the fold of her ragged sari, her face alight with mischievous excitement.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Chapter VII — The Distant Train Whistle',
        paragraphs: [
          'They had wandered far beyond the familiar boundary fences, past the burning ghat and into the sprawling meadow where the silver kash blossoms swayed like an ocean of white foam.',
          'Suddenly, the iron rails hummed beneath their bare feet. A distant rumble, followed by a sharp, thrilling whistle, cut through the quiet afternoon breeze.',
          'Durga grabbed Apu’s hand and ran blindly through the stalks of white grass, breathless, laughing, eager to witness for the first time the giant beast of iron breathing plumes of dark smoke across the horizon.'
        ]
      }
    ]
  },
  {
    id: 'aranyak-1939',
    name: 'Aranyak (আরণ্যক - Of the Forest)',
    author: 'Bibhutibhushan Bandyopadhyay (বিভূতিভূষণ বন্দ্যোপাধ্যায়)',
    yearPublished: 1939,
    decade: '1930s',
    genre: 'Wilderness Classic',
    pages: 284,
    isbn: '978-0-19-565987-0',
    clicks: 1210,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/aranyak_1939.pdf',
    summary: 'A profound ecological and spiritual memoir of an urban intellectual sent to clear and survey the vast primordial virgin forests of Bihar, witnessing ancient indigenous harmony collide with industrial destruction.',
    coverColor: '#1B2E1D',
    coverAccent: '#8BA888',
    coverMotif: 'forest-canopy',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Part I — The Infinite Sal Grasslands',
        paragraphs: [
          'When I first stepped into the vast expanse of Fulkia and Lobtulia, I did not know that the forest would claim my heart forever. Miles upon miles of tall elephant grass and wild acacia stretched under a sky of blinding azure.',
          'At night, the air filled with the scent of wild Mahua flowers and the distant cries of nilgai roaming the scrub plains. One felt as though one had slipped backwards through ten thousand centuries into the dawn of the earth.',
          'My duty as an estate manager was to divide this sacred wildness into agricultural plots for profit. Every boundary stake I hammered into the virgin soil felt like an unforgivable wound inflicted upon a timeless sanctuary.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Part III — Princess Bhanumati',
        paragraphs: [
          'Among the Santhal and Gond chieftains who still remembered the ancient lineage of the forest kings, there lived Princess Bhanumati, daughter of the dispossessed Raja. She possessed a dignity that neither poverty nor solitude could dim.',
          'Her voice had the cadence of clear water tumbling over mountain stones. As we sat beneath the banyan tree while shadows deepened, she sang of celestial archers and the ancestral migrations across the Chota Nagpur plateau.',
          'I realized then that civilization is often nothing more than a noisy mask, while true nobility resides untouched in the quiet heart of the wilderness.'
        ]
      }
    ]
  },
  {
    id: 'devdas-1917',
    name: 'Devdas (দেবদাস)',
    author: 'Sarat Chandra Chattopadhyay (শরৎচন্দ্র চট্টোপাধ্যায়)',
    yearPublished: 1917,
    decade: '1910s',
    genre: 'Romantic Tragedy',
    pages: 168,
    isbn: '978-0-14-302926-7',
    clicks: 1150,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/devdas_1917.pdf',
    summary: 'The iconic tragic saga of childhood sweethearts Devdas and Paro, torn apart by rigid feudal hierarchy and pride, leading Devdas into downward spiral cushioned by the selfless devotion of Chandramukhi.',
    coverColor: '#5C1D2B',
    coverAccent: '#FED65B',
    coverMotif: 'quill-tear',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Chapter I — Childhood by the Ichhamati',
        paragraphs: [
          'In the quiet hamlet of Talsonapur, Devdas and Parvati spent their childhood in inseparable camaraderie. Paro followed Devdas everywhere, carrying his fishing rod and books with an unquestioning devotion.',
          'Devdas was headstrong, proud, and quick-tempered; yet behind his haughtiness lay an affectionate heart that took Paro’s presence for granted, like the sunlight or the green banks of the river.',
          'When news arrived that Devdas was to be dispatched to the colonial metropolis of Calcutta for his studies, a quiet darkness settled over Paro’s spirit which no words could console.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Chapter IX — The Last Journey',
        paragraphs: [
          'The bullock cart trundled through the freezing winter fog of Hathras station. Devdas, frail and feverish, knew his days on this earthly stage were drawing to a close.',
          'He remembered his ancient vow to Paro: "Before the end, Paro, I will come to your door once more." Through delirium and pain, that singular promise held his fading pulse together.',
          'Under the ancient debdaru tree outside the mansion gates of Manikpur, the weary traveler breathed his last, while the temple bells chimed the dawn.'
        ]
      }
    ]
  },
  {
    id: 'sesher-kobita-1929',
    name: 'Sesher Kobita (শেষের কবিতা - The Last Poem)',
    author: 'Rabindranath Tagore (রবীন্দ্রনাথ ঠাকুর)',
    yearPublished: 1929,
    decade: '1920s',
    genre: 'Modernist Romance',
    pages: 192,
    isbn: '978-8-17-078045-4',
    clicks: 1090,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/sesher_kobita_1929.pdf',
    summary: 'A sparkling, intellectually daring romance set in the pine-scented hills of Shillong between the witty Oxford-educated barrister Amit Ray and the serene, erudite governess Labanya.',
    coverColor: '#3A0815',
    coverAccent: '#FFB2BD',
    coverMotif: 'pine-needle',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Canto I — Amit Ray and his Oxford Dandyism',
        paragraphs: [
          'Amit Ray was not merely modern; he was ahead of the modern. He despised popular acclaim, argued against Tagore’s verse simply because everyone else loved it, and crafted his existence as an exquisite aesthetic artifact.',
          'He believed that marriage was the everyday jug of household water, whereas romantic love was the rare, intoxicating vintage kept in delicate crystal flutes. To confuse the two was the unforgivable sin of bourgeois mediocrity.',
          'Then, upon the mist-wreathed mountain turns of Shillong, a car collision brought him face to face with Labanya. Her calm, unadorned gaze shattered all his intellectual ironies in a single heartbeat.'
        ]
      },
      {
        pageNumber: 2,
        title: 'Canto V — The Farewell Stanza',
        paragraphs: [
          '"Love is not possessive bondage," whispered Labanya as the rain whispered against the cedar shingles. "If we marry, the daily grind of domestic accounting will rub the golden polish off our souls."',
          'Amit composed for her the final poem, writing upon vellum with indigo ink: "I give you your freedom, for that is the truest gift love can bestow. You remain in my sky like the morning star—untouchable, eternal, unblemished."',
          'They parted not in despair, but in an illuminated elevation of spirit that transcended conventional companionship.'
        ]
      }
    ]
  },
  {
    id: 'srikanta-1917',
    name: 'Srikanta (শ্রীকান্ত - The Wanderer)',
    author: 'Sarat Chandra Chattopadhyay (শরৎচন্দ্র চট্টোপাধ্যায়)',
    yearPublished: 1917,
    decade: '1910s',
    genre: 'Social Realism',
    pages: 360,
    isbn: '978-8-17-078112-3',
    clicks: 980,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/srikanta_1917.pdf',
    summary: 'A sprawling autobiographical picaresque following the nomadic wanderer Srikanta, his wild adventurer friend Indranath, and his spiritual bond with Rajlakshmi/Pyari Baiji across colonial Bengal and Burma.',
    coverColor: '#2F1E0E',
    coverAccent: '#DDA15E',
    coverMotif: 'river-skiff',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Chapter I — Indranath and the Dark Ganges',
        paragraphs: [
          'I have never in all my travels encountered a boy quite like Indranath. Fear was a stranger to his blood; he walked through haunted cremation grounds with the careless grace of a young panther.',
          'One pitch-black monsoon night, with the river swollen and treacherous, he invited me into his dinghy to catch fish. The waves rose like dark beasts, yet Indranath sat laughing at the rudder, singing folk songs into the roaring wind.',
          'That night taught me that life’s greatest secrets are revealed only to those who dare cast aside the comfortable shelters of convention.'
        ]
      }
    ]
  },
  {
    id: 'chander-pahar-1937',
    name: 'Chander Pahar (চাঁদের পাহাড় - Mountain of the Moon)',
    author: 'Bibhutibhushan Bandyopadhyay (বিভূতিভূষণ বন্দ্যোপাধ্যায়)',
    yearPublished: 1937,
    decade: '1930s',
    genre: 'Adventure & Exploration',
    pages: 216,
    isbn: '978-8-17-078234-2',
    clicks: 940,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/chander_pahar_1937.pdf',
    summary: 'The quintessential Bengali adventure saga of young Shankar Roy Choudhury leaving his rural home to work on the Uganda Railway, encountering black mambas, volcanic craters, and diamond mines of Mount Kalahari.',
    coverColor: '#1A281F',
    coverAccent: '#C59B27',
    coverMotif: 'crescent-peak',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Chapter I — Across the Indian Ocean',
        paragraphs: [
          'Shankar could never reconcile himself to the suffocating routine of an ordinary village clerkship. His restless eyes were constantly turned toward geography maps and tales of African jungles.',
          'When an opportunity arose to serve as station master in the remote Kenya-Uganda railway line, he embarked without hesitation aboard the steamship at Kidderpore docks.',
          'The vast African savannah greeted him with golden acacia sunsets, lions stalking through the thorn bushes, and the intoxicating call of the unknown.'
        ]
      }
    ]
  },
  {
    id: 'anandamath-1882',
    name: 'Anandamath (আনন্দমঠ - Abbey of Bliss)',
    author: 'Bankim Chandra Chattopadhyay (বঙ্কিমচন্দ্র চট্টোপাধ্যায়)',
    yearPublished: 1882,
    decade: '1880s',
    genre: 'Historical Epic',
    pages: 224,
    isbn: '978-8-17-078099-7',
    clicks: 870,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/anandamath_1882.pdf',
    summary: 'The seminal historical novel set during the devastating Bengal Famine of 1770 and the Sannyasi Rebellion. Birthplace of the sacred anthem "Vande Mataram", celebrating devotion to the motherland.',
    coverColor: '#3D1308',
    coverAccent: '#E27D5B',
    coverMotif: 'sanctuary-bell',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Prologue — The Great Famine of 1176 BS',
        paragraphs: [
          'The year was 1176 of the Bengali era. The monsoon clouds had failed to weep upon the parched earth, and throughout Bengal the fields turned to dust and ash.',
          'In Padachinha village, noble landlord Mahendra Singha and his wife Kalyani looked upon their starving peasants in agony, before setting out through the corpse-strewn highways seeking sanctuary.',
          'Deep inside the dense Birbhum forest, beneath secret subterranean vaults, a band of ascetics had formed the Order of Children (Santans), pledged to defend the helpless and restore divine justice.'
        ]
      }
    ]
  },
  {
    id: 'kapalkundala-1866',
    name: 'Kapalkundala (কপালকুণ্ডলা)',
    author: 'Bankim Chandra Chattopadhyay (বঙ্কিমচন্দ্র চট্টোপাধ্যায়)',
    yearPublished: 1866,
    decade: '1860s',
    genre: 'Gothic Romance',
    pages: 160,
    isbn: '978-8-17-078001-0',
    clicks: 820,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/kapalkundala_1866.pdf',
    summary: 'A haunting romantic mystery set along the untamed coastal sands of Hijli where stranded young pilgrim Nabakumar is rescued from a Kapalika sacrifice by the ethereal forest-raised maiden Kapalkundala.',
    coverColor: '#17222B',
    coverAccent: '#81A4CD',
    coverMotif: 'ocean-mist',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Chapter I — Stranded on the Dunes of Hijli',
        paragraphs: [
          'The pilgrim skiff had left Nabakumar behind on the desolate sands where the sea roars ceaselessly against the mangrove fringe. Night descended with ominous swiftness.',
          'As he struggled through the prickly screw-pine groves, a mysterious sacrificial chant reached his ears. A Kapalika sat before a smoldering human skull, eyes gleaming with fanatical ferocity.',
          'Just as the ritual blade was raised, a soft, ethereal voice broke the dark hush of the forest: "পথিক, তুমি কি পথ হারাইয়াছ?" (Traveler, hast thou lost thy path?)'
        ]
      }
    ]
  },
  {
    id: 'rupashi-bangla-1957',
    name: 'Rupashi Bangla (রূপসী বাংলা - Beautiful Bengal)',
    author: 'Jibanananda Das (জীবনানন্দ দাশ)',
    yearPublished: 1957,
    decade: '1950s',
    genre: 'Lyrical Poetry',
    pages: 112,
    isbn: '978-8-17-078345-5',
    clicks: 790,
    storageUrl: 'gs://bhasha-library.appspot.com/manuscripts/rupashi_bangla_1957.pdf',
    summary: 'The posthumously published lyrical testament to the timeless, melancholic beauty of rural Bengal—its owls, hijal trees, silted canals, and autumnal twilight skies.',
    coverColor: '#23322B',
    coverAccent: '#A3B18A',
    coverMotif: 'autumn-owl',
    pagesData: [
      {
        pageNumber: 1,
        title: 'Sonnet I — The Face of Bengal',
        paragraphs: [
          'বাংলার মুখ আমি দেখিয়াছি, তাই আমি পৃথিবীর রূপ খুঁজিতে যাই না আর: অন্ধকারে জেগে উঠে ডুমুরের গাছে চেয়ে দেখি ছাতার মতন বড় পাতাটির নিচে বসে আছে ভোরের দোয়েল পাখি;',
          'I have gazed upon the face of Bengal, and so I seek no more the wonders of this earth. Waking in the shadows, upon the fig boughs I see the daybreak shama bird nestled beneath umbrella leaves;',
          'When I die, let my dust return to the water of the Dhansiri river, where yellow leaves drift quietly in the autumn mist.'
        ]
      }
    ]
  }
];

// Persistent click cache in memory & local storage
const STORAGE_KEY = 'bhasha_library_clicks_cache';

function getPersistedClicks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function savePersistedClicks(clicksMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clicksMap));
  } catch {
    // ignore quota/security errors
  }
}

// In-memory reactive state
let inMemoryBooks = INITIAL_BOOKS.map(b => ({
  ...b,
  isOfficialCanonical: b.isOfficialCanonical ?? true,
  uploadedByRole: b.uploadedByRole ?? 'admin'
}));
let inMemoryClicks = getPersistedClicks();
const subscribers = new Set();
let isFirestoreInitialized = false;

function notifySubscribers() {
  const books = bookService.getAllBooks();
  subscribers.forEach(cb => {
    try {
      cb(books);
    } catch (err) {
      console.error('[BookService] Subscriber callback error:', err);
    }
  });
}

/**
 * Initializes Firestore real-time subscriptions for manuscripts and click telemetry
 */
function initFirestoreSync() {
  if (isFirestoreInitialized || !isFirebaseConfigured) return;
  isFirestoreInitialized = true;

  // 1. Subscribe to Reader Click Telemetry in Firestore
  try {
    const clickCollectionRef = collection(db, FIREBASE_COLLECTIONS.CLICK_TELEMETRY);
    onSnapshot(clickCollectionRef, (snapshot) => {
      let updated = false;
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const count = data.clicks ?? data.clickCount;
        if (typeof count === 'number' && inMemoryClicks[docSnap.id] !== count) {
          inMemoryClicks[docSnap.id] = count;
          updated = true;
        }
      });
      if (updated) {
        savePersistedClicks(inMemoryClicks);
        notifySubscribers();
      }
    }, (error) => {
      // Graceful fallback: Firestore not yet created in console or network unavailable
      console.info('[Firestore] Click telemetry operating in offline/local mode:', error.message);
    });
  } catch (err) {
    console.info('[Firestore] Reader clicks subscription bypassed:', err.message);
  }

  // 2. Subscribe to Manuscripts Catalog in Firestore
  try {
    const booksCollectionRef = collection(db, FIREBASE_COLLECTIONS.BOOKS);
    onSnapshot(booksCollectionRef, (snapshot) => {
      if (!snapshot.empty) {
        const remoteBooks = [];
        snapshot.forEach(docSnap => {
          remoteBooks.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        inMemoryBooks = remoteBooks;
        notifySubscribers();
      }
    }, (error) => {
      console.info('[Firestore] Manuscripts catalog operating with archival initial folios:', error.message);
    });
  } catch (err) {
    console.info('[Firestore] Manuscripts catalog subscription bypassed:', err.message);
  }
}

export const bookService = {
  /**
   * Subscribes a listener to live book catalog and click updates.
   * Auto-initializes Firestore sync on first subscription.
   */
  subscribe(callback) {
    initFirestoreSync();
    subscribers.add(callback);
    // Initial emission
    callback(this.getAllBooks());
    return () => {
      subscribers.delete(callback);
    };
  },

  /**
   * Retrieves all books merged with latest click telemetry
   */
  getAllBooks() {
    return inMemoryBooks.map(book => ({
      ...book,
      clicks: (inMemoryClicks[book.id] !== undefined) ? inMemoryClicks[book.id] : (book.clicks || 0)
    }));
  },

  /**
   * Retrieves popular books sorted by click counts (descending)
   */
  getPopularBooks(limit = 10) {
    const books = this.getAllBooks();
    return books
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, limit);
  },

  /**
   * Retrieves a single book by ID
   */
  getBookById(id) {
    if (!id) return null;
    const books = this.getAllBooks();
    const direct = books.find(b => b.id === id);
    if (direct) return direct;

    const aliases = {
      'anandamath': 'anandamath-1882',
      'chander-pahar-mountain-of-the-moon': 'chander-pahar-1937',
      'দেবদাস-devdas': 'devdas-1917',
      'devdas': 'devdas-1917',
      'kopalkundola': 'kapalkundala-1866',
      'কপালকুণ্ডলা-kopalkundola': 'kapalkundala-1866',
      'kapalkundala': 'kapalkundala-1866'
    };
    if (aliases[id]) {
      return books.find(b => b.id === aliases[id]) || null;
    }
    return books.find(b => b.id.toLowerCase() === id.toLowerCase() || (b.name && b.name.toLowerCase().includes(id.toLowerCase()))) || null;
  },

  /**
   * Increments the click telemetry for a book with optimistic local update
   * and Cloud Firestore reader_clicks persistence.
   */
  recordBookClick(id) {
    const current = inMemoryClicks[id] !== undefined 
      ? inMemoryClicks[id] 
      : (inMemoryBooks.find(b => b.id === id)?.clicks || 0);
    
    const updated = current + 1;
    inMemoryClicks[id] = updated;
    savePersistedClicks(inMemoryClicks);
    notifySubscribers();

    // Asynchronously record to Cloud Firestore
    if (isFirebaseConfigured && db) {
      const clickDocRef = doc(db, FIREBASE_COLLECTIONS.CLICK_TELEMETRY, id);
      setDoc(clickDocRef, {
        id,
        bookId: id,
        clicks: increment(1),
        lastClickedAt: serverTimestamp()
      }, { merge: true }).catch(err => {
        // If Firestore is unprovisioned, keep local count safely without throwing
        console.warn(`[Firestore Telemetry] Synced locally. Cloud write status: ${err.message}`);
      });
    }

    return updated;
  },

  /**
   * Filter and search books with comprehensive query matching
   */
  getBooks({ search = '', decade = 'All', genre = 'All', sortBy = 'popular' } = {}) {
    let list = this.getAllBooks();

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(b => 
        b.name.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.genre && b.genre.toLowerCase().includes(q)) ||
        (b.summary && b.summary.toLowerCase().includes(q)) ||
        (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    }

    if (decade && decade !== 'All') {
      list = list.filter(b => b.decade === decade);
    }

    if (genre && genre !== 'All') {
      list = list.filter(b => b.genre && b.genre.toLowerCase().includes(genre.toLowerCase()));
    }

    // Sort order
    if (sortBy === 'popular') {
      list.sort((a, b) => b.clicks - a.clicks);
    } else if (sortBy === 'year-asc') {
      list.sort((a, b) => a.yearPublished - b.yearPublished);
    } else if (sortBy === 'year-desc') {
      list.sort((a, b) => b.yearPublished - a.yearPublished);
    } else if (sortBy === 'title') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'pages') {
      list.sort((a, b) => b.pages - a.pages);
    }

    return list;
  },

  /**
   * Return unique available decades
   */
  getDecades() {
    const set = new Set(inMemoryBooks.map(b => b.decade).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  },

  /**
   * Return unique available genres
   */
  getGenres() {
    const set = new Set(inMemoryBooks.map(b => b.genre).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  },

  /**
   * Search excerpts and paragraphs across all manuscripts for AI agent context
   */
  searchExcerpts(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    const results = [];

    inMemoryBooks.forEach(book => {
      if (Array.isArray(book.pagesData)) {
        book.pagesData.forEach(page => {
          if (Array.isArray(page.paragraphs)) {
            page.paragraphs.forEach((para, idx) => {
              if (para.toLowerCase().includes(q) || (book.summary && book.summary.toLowerCase().includes(q))) {
                results.push({
                  bookId: book.id,
                  bookName: book.name,
                  author: book.author,
                  pageNumber: page.pageNumber,
                  pageTitle: page.title,
                  paragraphIndex: idx + 1,
                  text: para
                });
              }
            });
          }
        });
      }
    });

    return results;
  },

  /**
   * Publishes a new manuscript to Cloud Firestore's manuscripts_catalog
   * Conforms strictly to firestore.rules isValidManuscript schema
   */
  async addManuscript(manuscript) {
    const year = Number(manuscript.yearPublished);
    const pages = Number(manuscript.pages || (manuscript.pagesData ? manuscript.pagesData.length : 1));
    if (!manuscript.name?.trim()) throw new Error('Manuscript title is required.');
    if (!manuscript.author?.trim()) throw new Error('Author name is required.');
    if (isNaN(year) || year < 1000 || year > 2100) throw new Error('Valid publication year (1000-2100) is required.');
    if (isNaN(pages) || pages <= 0 || pages > 10000) throw new Error('Valid page count (1-10000) is required.');

    const cleanId = manuscript.id?.trim() || 
      `${manuscript.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${year}`;

    const newDoc = {
      id: cleanId,
      name: manuscript.name.trim().slice(0, 200),
      author: manuscript.author.trim().slice(0, 150),
      yearPublished: year,
      decade: manuscript.decade || `${Math.floor(year / 10) * 10}s`,
      genre: (manuscript.genre || 'Classical Literature').trim().slice(0, 100),
      pages: pages,
      isbn: manuscript.isbn ? manuscript.isbn.trim().slice(0, 50) : `978-BHA-${Date.now().toString().slice(-6)}`,
      clicks: manuscript.clicks || 0,
      storageUrl: manuscript.storageUrl ? manuscript.storageUrl.trim().slice(0, 500) : '',
      summary: (manuscript.summary || '').trim().slice(0, 5000),
      coverColor: manuscript.coverColor || '#3D1308',
      coverAccent: manuscript.coverAccent || '#E27D5B',
      coverMotif: manuscript.coverMotif || 'lotus',
      isOfficialCanonical: Boolean(manuscript.isOfficialCanonical),
      uploadedByRole: manuscript.uploadedByRole || 'author',
      uploadedByEmail: (manuscript.uploadedByEmail || auth?.currentUser?.email || '').trim(),
      pagesData: Array.isArray(manuscript.pagesData) && manuscript.pagesData.length > 0 
        ? manuscript.pagesData 
        : [
            {
              pageNumber: 1,
              title: 'Folio I — Initial Inscription',
              paragraphs: [
                manuscript.summary || 'A newly preserved literary folio entered into the Bhasha Library archival catalog.'
              ]
            }
          ]
    };

    if (isFirebaseConfigured && db) {
      const bookDocRef = doc(db, FIREBASE_COLLECTIONS.BOOKS, cleanId);
      await setDoc(bookDocRef, {
        ...newDoc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // Also update in-memory catalog
    const existingIdx = inMemoryBooks.findIndex(b => b.id === cleanId);
    if (existingIdx >= 0) {
      inMemoryBooks[existingIdx] = newDoc;
    } else {
      inMemoryBooks = [newDoc, ...inMemoryBooks];
    }
    notifySubscribers();

    return newDoc;
  },

  /**
   * Deletes a manuscript from the database and in-memory catalog
   */
  async deleteManuscript(id) {
    if (!id) return false;
    
    if (isFirebaseConfigured && db) {
      try {
        const bookDocRef = doc(db, FIREBASE_COLLECTIONS.BOOKS, id);
        await deleteDoc(bookDocRef);
      } catch (err) {
        console.warn(`[Firestore Delete] Cloud delete status: ${err.message}`);
      }
    }

    inMemoryBooks = inMemoryBooks.filter(b => b.id !== id);
    notifySubscribers();
    return true;
  },

  /**
   * Toggles the official canonical status of a manuscript
   */
  async toggleCanonicalStatus(id) {
    const book = inMemoryBooks.find(b => b.id === id);
    if (!book) return null;
    const newStatus = !book.isOfficialCanonical;
    return this.addManuscript({
      ...book,
      isOfficialCanonical: newStatus
    });
  },

  /**
   * Seeds the initial classical manuscripts into Cloud Firestore
   * Useful when establishing a fresh database instance.
   */
  async seedInitialManuscripts() {
    if (!auth?.currentUser) {
      throw new Error('Authentication required: please log in as an author to seed the catalog.');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }

    let seededCount = 0;
    for (const book of INITIAL_BOOKS) {
      const docRef = doc(db, FIREBASE_COLLECTIONS.BOOKS, book.id);
      const cleanData = {
        id: book.id,
        name: book.name,
        author: book.author,
        yearPublished: book.yearPublished,
        decade: book.decade,
        genre: book.genre,
        pages: book.pages,
        isbn: book.isbn,
        clicks: book.clicks,
        storageUrl: book.storageUrl,
        summary: book.summary,
        coverColor: book.coverColor,
        coverAccent: book.coverAccent,
        coverMotif: book.coverMotif,
        pagesData: book.pagesData
      };
      await setDoc(docRef, cleanData, { merge: true });
      seededCount++;
    }

    return { success: true, count: seededCount };
  }
};
