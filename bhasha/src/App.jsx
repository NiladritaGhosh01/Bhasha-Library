import React, { useState } from 'react';
import { useTheme } from './hooks/useTheme';
import { useParallax } from './hooks/useParallax';

import { Navbar } from './components/Navbar';
import { DualBackdrop } from './components/DualBackdrop';
import { ChapterNav } from './components/ChapterNav';
import { HeroSection } from './components/HeroSection';
import { TaglineSection } from './components/TaglineSection';
import { SanctumSection } from './components/SanctumSection';
import { UnlockedChamberModal } from './components/UnlockedChamberModal';
import { Footer } from './components/Footer';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { activeChapter, scrollProgress } = useParallax();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleTriggerWaxSeal = (serviceName) => {
    alert(`Validating credentials via ${serviceName}... Portal unlocked.`);
    setIsModalOpen(true);
  };

  return (
    <div className="grand-canvas-wrap">
      {/* Slender Reading Ribbon along top edge (per DESIGN.md) */}
      <div
        className="reading-progress-ribbon"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      ></div>

      {/* Outer Grand Manuscript Canvas */}
      <div className="grand-manuscript-container bg-parchment-texture">
        {/* Subtle Dual Cultural Backdrop */}
        <DualBackdrop />

        {/* Minimal Non-broken Chapter Indicator */}
        <ChapterNav activeChapter={activeChapter} />

        {/* Navigation Header */}
        <Navbar theme={theme} onToggleTheme={toggleTheme} />

        {/* Main Reading & Writing Sanctuary Content */}
        <main className="manuscript-main">
          {/* Chapter I: Sanctuary */}
          <HeroSection />

          {/* Chapter II: The Inscription */}
          <TaglineSection />

          {/* Chapter III: Admission Portals */}
          <SanctumSection
            onOpenModal={handleOpenModal}
            onTriggerWaxSeal={handleTriggerWaxSeal}
          />
        </main>

        {/* Colophon Footer */}
        <Footer />
      </div>

      {/* Native <dialog> Modal */}
      <UnlockedChamberModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
