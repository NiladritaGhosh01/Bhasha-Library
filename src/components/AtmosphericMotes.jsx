import React from 'react';

export function AtmosphericMotes() {
  return (
    <div aria-hidden="true" className="atmospheric-motes-wrap">
      {/* Living Drifting Motes */}
      <div className="living-mote animate-mote-drift-1 living-mote-1 absolute"></div>
      <div className="living-mote animate-mote-drift-2 living-mote-2 absolute"></div>
      <div className="living-mote animate-mote-drift-3 living-mote-3 absolute"></div>
      <div className="living-mote animate-mote-drift-1 living-mote-4 absolute"></div>
      <div className="living-mote animate-mote-drift-2 living-mote-5 absolute"></div>
      <div className="living-mote animate-mote-drift-3 absolute w-1.5 h-1.5 rounded-full bg-gilded-amber/80 dark:bg-gilded-gold top-2/3 right-[8%] opacity-85"></div>
      <div className="living-mote animate-mote-drift-1 absolute w-2 h-2 rounded-full bg-gilded-gold/60 dark:bg-gilded-amber/90 top-12 left-1/2 opacity-60"></div>

      {/* Parallax Botanical Lotus & Antique Specks */}
      <div className="parallax-speck" data-speed="0.25" style={{ top: '25%', left: '8%', fontSize: '1.5rem', color: 'var(--color-terracotta)', opacity: 0.4 }}>
        🪷
      </div>
      <div className="parallax-speck" data-speed="0.45" style={{ top: '66%', right: '16%', width: '0.75rem', height: '0.75rem', borderRadius: '9999px', backgroundColor: 'var(--color-ochre)' }}></div>
      <div className="parallax-speck" data-speed="0.18" style={{ top: '33%', right: '25%', fontSize: '1.25rem', color: 'var(--color-gilded-leaf)', opacity: 0.35 }}>
        ⚜
      </div>
      <div className="parallax-speck" data-speed="0.32" style={{ bottom: '20%', left: '25%', width: '0.625rem', height: '0.625rem', borderRadius: '9999px', backgroundColor: 'var(--color-gilded-gold)' }}></div>
      <div className="parallax-speck" data-speed="0.38" style={{ top: '75%', left: '33%', fontSize: '1.5rem', color: 'var(--color-ochre-dark)', opacity: 0.3 }}>
        🪷
      </div>
    </div>
  );
}
