import { useState, useEffect } from 'react';

export function useParallax() {
  const [activeChapter, setActiveChapter] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrolled = window.pageYOffset || document.documentElement.scrollTop;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Slender reading progress ribbon (0 - 100%)
      if (totalHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrolled / totalHeight) * 100)));
      }

      // Clean, reliable section tracking without moving or overlapping DOM elements
      const tagSection = document.getElementById('stage-tagline');
      const sanctSection = document.getElementById('stage-sanctum');

      const vh = window.innerHeight;

      if (sanctSection && sanctSection.getBoundingClientRect().top <= vh * 0.4) {
        setActiveChapter('sanctum');
      } else if (tagSection && tagSection.getBoundingClientRect().top <= vh * 0.4) {
        setActiveChapter('tagline');
      } else {
        setActiveChapter('hero');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { activeChapter, scrollProgress };
}
