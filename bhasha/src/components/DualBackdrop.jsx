import React from 'react';
import { ART_ASSETS } from '../assets/artAssets';

const RENAISSANCE_ARTS = [ART_ASSETS.renaissanceNobleman, ART_ASSETS.renaissanceScholar];
const PATTACHITRA_ARTS = [ART_ASSETS.pattachitraMaiden, ART_ASSETS.pattachitraSeal];

export function DualBackdrop({ artIndex = 0 }) {
  const rSrc = RENAISSANCE_ARTS[artIndex % RENAISSANCE_ARTS.length];
  const pSrc = PATTACHITRA_ARTS[artIndex % PATTACHITRA_ARTS.length];

  return (
    <div aria-hidden="true" className="dual-sticky-backdrop" id="dualStickyBackdrop">
      <div className="backdrop-split-container">
        {/* Left Flank: Western Renaissance */}
        <div className="backdrop-flank-renaissance" id="bgFlankRenaissance">
          <img
            id="bgImgRenaissance"
            src={rSrc}
            alt="Renaissance Heritage Canvas"
            className="backdrop-img"
          />
          <div className="backdrop-fade-overlay-left"></div>
        </div>

        {/* Right Flank: Indian Pattachitra */}
        <div className="backdrop-flank-pattachitra" id="bgFlankPattachitra">
          <img
            id="bgImgPattachitra"
            src={pSrc}
            alt="Indian Pattachitra Lotus Heritage Canvas"
            className="backdrop-img"
          />
          <div className="backdrop-fade-overlay-right"></div>
        </div>
      </div>

      {/* Radial Parchment Vignette */}
      <div className="backdrop-radial-vignette"></div>
    </div>
  );
}
