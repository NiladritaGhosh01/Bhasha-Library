import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StoryCard from './components/StoryCard';
import StoryReader from './components/StoryReader';
import StoryStudio from './components/StoryStudio';
import AuthorDashboard from './components/AuthorDashboard';
import AuthModal from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initialStories } from './data/initialStories';
import { translations } from './i18n/translations';
import './App.css';

function MainApp() {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'reader' | 'studio' | 'dashboard'
  const [langMode, setLangMode] = useState('en');
  const [stories, setStories] = useState(initialStories);
  const [selectedStory, setSelectedStory] = useState(initialStories[0]);
  const [likedStoryIds, setLikedStoryIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { user, getIdToken } = useAuth();
  const t = translations[langMode] || translations.en;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch stories from Firestore API
  useEffect(() => {
    const fetchBackendStories = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/stories');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const formatted = json.data.map((item) => ({
              ...item,
              genre: item.genre || 'Folklore',
              genreBn: item.genreBn || 'লোকগাথা',
              readTime: item.readTime || '3 min',
              likes: item.likes || 12,
              paragraphs: item.paragraphs || [
                {
                  en: item.content?.en || (typeof item.content === 'string' ? item.content : ''),
                  bn: item.content?.bn || ''
                }
              ]
            }));

            setStories((prev) => {
              const ids = new Set(prev.map(p => p.id));
              const newItems = formatted.filter(b => !ids.has(b.id));
              return [...newItems, ...prev];
            });
          }
        }
      } catch (err) {
        console.log('Backend sync offline, using local store.');
      }
    };

    fetchBackendStories();
  }, []);

  const handleToggleLike = async (storyId) => {
    setLikedStoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(storyId)) {
        next.delete(storyId);
      } else {
        next.add(storyId);
        showToast(langMode === 'bn' ? 'গল্পটি পছন্দের তালিকায় যুক্ত হয়েছে' : 'Added to favorites');
      }
      return next;
    });

    // Notify backend
    try {
      await fetch(`http://localhost:5000/api/stories/${storyId}/like`, { method: 'POST' });
    } catch (e) {
      // offline
    }
  };

  const handleSelectStory = (story) => {
    setSelectedStory(story);
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublishStory = async (newStory) => {
    // Add author details if signed in
    if (user) {
      newStory.author = user.displayName || user.email?.split('@')[0] || newStory.author;
    }

    setStories((prev) => [newStory, ...prev]);
    setSelectedStory(newStory);
    setActiveTab('reader');
    showToast(langMode === 'bn' ? 'গল্পটি ফায়ারস্টোরে প্রকাশিত হয়েছে' : 'Story saved to Firestore');

    // Post to Firestore via backend API
    try {
      const token = await getIdToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/stories', {
        method: 'POST',
        headers,
        body: JSON.stringify(newStory)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.id) {
          // Update id from Firestore document reference
          setStories((prev) => prev.map(s => s.id === newStory.id ? { ...s, id: json.data.id } : s));
        }
      }
    } catch (e) {
      console.log('Saved locally (Backend/Firestore sync offline)');
    }
  };

  const handleDeleteStory = async (storyId) => {
    setStories((prev) => prev.filter(s => s.id !== storyId));
    showToast(langMode === 'bn' ? 'গল্পটি মুছে ফেলা হয়েছে' : 'Story removed');
    if (selectedStory?.id === storyId) {
      setSelectedStory(stories[0] || null);
    }

    try {
      const token = await getIdToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`http://localhost:5000/api/stories/${storyId}`, {
        method: 'DELETE',
        headers
      });
    } catch (e) {
      // offline
    }
  };

  const filteredStories = stories.filter((story) => {
    const matchesGenre = selectedGenre === 'all' || story.genre?.toLowerCase() === selectedGenre.toLowerCase();
    const titleEn = story.title?.en?.toLowerCase() || '';
    const titleBn = story.title?.bn?.toLowerCase() || '';
    const synEn = story.synopsis?.en?.toLowerCase() || '';
    const synBn = story.synopsis?.bn?.toLowerCase() || '';
    const author = story.author?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm ||
      titleEn.includes(query) ||
      titleBn.includes(query) ||
      synEn.includes(query) ||
      synBn.includes(query) ||
      author.includes(query);

    return matchesGenre && matchesSearch;
  });

  return (
    <div className="app-root-minimal">
      {/* 50% Transparent Background Video */}
      <div className="bg-video-wrapper" aria-hidden="true">
        <video
          className="bg-video-element"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/bg-video.mp4" type="video/mp4" />
        </video>
        <div className="bg-video-overlay" />
      </div>

      {/* Subtle Toast */}
      {toastMessage && (
        <div className="glass-toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        t={t}
        langMode={langMode}
      />

      {/* Frosted Glass Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        langMode={langMode}
        setLangMode={setLangMode}
        openCreateStory={() => setActiveTab('studio')}
        openAuthModal={() => setIsAuthModalOpen(true)}
        t={t}
      />

      <main className="content-container">
        {activeTab === 'explore' && (
          <div className="explore-minimal">
            <Hero
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              t={t}
            />

            {/* Minimal Grid of Cards with hover-only synopsis */}
            <div className="cards-grid">
              {filteredStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  langMode={langMode}
                  onSelect={handleSelectStory}
                  onLike={handleToggleLike}
                  isLiked={likedStoryIds.has(story.id)}
                  t={t}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reader' && (
          <StoryReader
            story={selectedStory}
            onBack={() => setActiveTab('explore')}
            langMode={langMode}
            setLangMode={setLangMode}
            onLike={handleToggleLike}
            isLiked={selectedStory ? likedStoryIds.has(selectedStory.id) : false}
            t={t}
          />
        )}

        {activeTab === 'studio' && (
          <StoryStudio
            onPublishStory={handlePublishStory}
            onCancel={() => setActiveTab('explore')}
            t={t}
            langMode={langMode}
          />
        )}

        {activeTab === 'dashboard' && (
          <AuthorDashboard
            stories={stories}
            onSelectStory={handleSelectStory}
            onDeleteStory={handleDeleteStory}
            onNewStory={() => setActiveTab('studio')}
            t={t}
            langMode={langMode}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="glass-footer">
        <p className="footer-copyright">{t.footer.copyright}</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
