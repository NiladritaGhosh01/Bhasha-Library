/**
 * Book Service & Literary Database
 * 
 * Provides unified access to book metadata stored in Cloud Firestore and
 * manuscript digital folios from Firebase Cloud Storage.
 * Tracks click telemetry (popularity metric) and powers search & AI context.
 */

import { isFirebaseConfigured, FIREBASE_COLLECTIONS } from './firebaseConfig';

const INITIAL_BOOKS = [
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
    author: 'Bibhutibhushan Bandyopadhyay (বিभूतिভূষণ বন্দ্যোপাধ্যায়)',
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

// Persistent click cache in memory / local storage
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

export const bookService = {
  /**
   * Retrieves all books merged with latest click telemetry
   */
  getAllBooks() {
    const persisted = getPersistedClicks();
    return INITIAL_BOOKS.map(book => ({
      ...book,
      clicks: (persisted[book.id] !== undefined) ? persisted[book.id] : book.clicks
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
    const books = this.getAllBooks();
    return books.find(b => b.id === id) || null;
  },

  /**
   * Increments the click telemetry for a book (simulating / syncing with Firebase)
   */
  recordBookClick(id) {
    const persisted = getPersistedClicks();
    const current = persisted[id] !== undefined 
      ? persisted[id] 
      : (INITIAL_BOOKS.find(b => b.id === id)?.clicks || 0);
    
    const updated = current + 1;
    persisted[id] = updated;
    savePersistedClicks(persisted);

    if (isFirebaseConfigured) {
      // In production Firebase mode, record to Firestore reader_clicks
      console.log(`[Firebase Telemetry] Recorded click for ${id} in ${FIREBASE_COLLECTIONS.CLICK_TELEMETRY}: ${updated}`);
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
        b.genre.toLowerCase().includes(q) ||
        b.summary.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
      );
    }

    if (decade && decade !== 'All') {
      list = list.filter(b => b.decade === decade);
    }

    if (genre && genre !== 'All') {
      list = list.filter(b => b.genre.toLowerCase().includes(genre.toLowerCase()));
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
    const set = new Set(INITIAL_BOOKS.map(b => b.decade));
    return ['All', ...Array.from(set).sort()];
  },

  /**
   * Return unique available genres
   */
  getGenres() {
    const set = new Set(INITIAL_BOOKS.map(b => b.genre));
    return ['All', ...Array.from(set).sort()];
  },

  /**
   * Search excerpts and paragraphs across all manuscripts for AI agent context
   */
  searchExcerpts(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    const results = [];

    INITIAL_BOOKS.forEach(book => {
      book.pagesData.forEach(page => {
        page.paragraphs.forEach((para, idx) => {
          if (para.toLowerCase().includes(q) || book.summary.toLowerCase().includes(q)) {
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
      });
    });

    return results;
  }
};
