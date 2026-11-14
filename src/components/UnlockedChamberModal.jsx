import React, { useEffect, useRef } from 'react';
import { ART_ASSETS } from '../assets/artAssets';

export function UnlockedChamberModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = '';
    }
    onClose();
  };

  const handlePointerDown = (e) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const r = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (isOutside) {
      handleClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="unlockedChamberModal"
      aria-labelledby="modalWelcomeTitle"
      className="chamber-native-dialog"
      onPointerDown={handlePointerDown}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      {/* Close Button */}
      <button
        type="button"
        onClick={handleClose}
        className="btn-spring chamber-modal-close-btn"
        aria-label="Close Sanctuary Modal"
      >
        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>

      {/* Welcome Banner */}
      <div className="chamber-welcome-banner">
        <span className="chamber-transcended-script">Sanctuary Admitted</span>
        <h2 id="modalWelcomeTitle" className="chamber-welcome-title">
          Welcome to the Inner Sanctum
        </h2>
        <p className="chamber-welcome-bengali">স্বাগতম ভাষা লাইব্রেরির মূল মহাফেজখানায়</p>
      </div>

      {/* Preview of Unlocked Works */}
      <div className="chamber-folios-grid">
        <div className="chamber-folio-card">
          <div className="chamber-folio-header">
            <div className="chamber-folio-thumb">
              <img src={ART_ASSETS.renaissanceNobleman} alt="Renaissance Manuscript" />
            </div>
            <div>
              <h3 className="chamber-folio-name">The Renaissance Folios</h3>
              <p className="chamber-folio-bengali">অমর কথাসাহিত্য ও পাণ্ডুলিপি</p>
            </div>
          </div>
          <p className="chamber-folio-desc">
            Access to digitized, hand-bound literary manuscripts with annotated critical commentaries.
          </p>
        </div>

        <div className="chamber-folio-card">
          <div className="chamber-folio-header">
            <div className="chamber-folio-thumb">
              <img src={ART_ASSETS.pattachitraMaiden} alt="Pattachitra Folio" />
            </div>
            <div>
              <h3 className="chamber-folio-name">Scribe &amp; Author Guild</h3>
              <p className="chamber-folio-bengali">লেখক সভা ও পাঠক ফোরাম</p>
            </div>
          </div>
          <p className="chamber-folio-desc">
            Interactive literary salons, independent essays, and translation workshops.
          </p>
        </div>
      </div>

      {/* Seal Confirmation Feedback */}
      <div className="chamber-register-feedback">
        Your author/reader credentials have been inscribed in the Great Register.
      </div>

      {/* Begin Reading CTA */}
      <button
        type="button"
        onClick={handleClose}
        className="btn-spring chamber-begin-btn"
      >
        Begin Reading Manuscripts
      </button>
    </dialog>
  );
}
