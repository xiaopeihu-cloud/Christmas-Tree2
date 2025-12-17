import React, { useState } from 'react';
import { Gift, Hand } from 'lucide-react';
import { TreeState } from '../types';

const LUXURY_WISHES = [
  "May your holidays sparkle with moments of love, laughter, and goodwill.",
  "Frohe Weihnachten und ein glückliches neues Jahr!",
  "Wishing you a season of gladness, a season of cheer, and to top it all off, a wonderful year.",
  "Besinnliche Feiertage und die besten Wünsche für das kommende Jahr.",
  "May the magic of the holidays fill your home with joy and peace.",
  "Wundervolle Weihnachtszeit!",
  "Sending you the spirit of love, joy, and giving. Unwrap it with love.",
  "Ein Fest voller Wärme, ein Herz voller Glück und ein Jahr voller Wunder.",
  "May this festive season sparkle and shine, may all of your wishes and dreams come true.",
  "Genieße die kostbaren Momente der Stille und die Freude des Schenkens.",
  "Wishing you a Christmas that's merry and bright, and a New Year filled with promise.",
  "May the holiday spirit find a home in your heart and lingering there, bring you inner peace.",
  "Sternenglanz und Plätzchenduft – wir wünschen dir eine wundervolle Weihnachtszeit!",
  "Here’s to a season of love and harmony, warmth and joy.",
  "May your world be filled with warmth and good cheer this Holy season, and throughout the year.",
  "Wishing you peace, love, and joy this holiday season and throughout 2026."
];

export const UIOverlay = ({ treeState, onToggleCamera }: { treeState: TreeState, onToggleCamera: () => void }) => {
  const [wish, setWish] = useState<string | null>(null);
  const [isWishOpen, setIsWishOpen] = useState(false);

  const handleOpenWish = () => {
    const randomWish = LUXURY_WISHES[Math.floor(Math.random() * LUXURY_WISHES.length)];
    setWish(randomWish);
    setIsWishOpen(true);
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 md:p-12 safe-area-inset-top safe-area-inset-bottom">
      
      {/* Merry Christmas Animation */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${treeState === TreeState.CHAOS ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-full max-w-[90vw] mx-auto text-center px-4">
            <h1 className={`font-display text-3xl sm:text-5xl md:text-7xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] tracking-[0.2em] transition-all duration-[3000ms] ease-out leading-tight whitespace-nowrap sm:whitespace-normal ${
              treeState === TreeState.CHAOS 
                ? 'translate-y-[-80px] md:translate-y-[-150px] scale-110 md:scale-125' 
                : 'translate-y-0 scale-100'
            }`}>
                  MERRY CHRISTMAS
            </h1>
          </div>
      </div>

      {/* Center Status Spacer */}
      {!isWishOpen && treeState !== TreeState.CHAOS && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="text-pink-100/30 text-[10px] font-serif tracking-[0.5em] uppercase animate-pulse">
             {treeState}
           </div>
        </div>
      )}

      {/* Wish Dialog / Gift Window */}
      {isWishOpen && (
        <>
          {/* Backdrop: Clicking anywhere outside closes the window */}
          <div 
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md pointer-events-auto cursor-pointer transition-all duration-500"
            onClick={() => setIsWishOpen(false)} 
          />

          {/* Modal Window: stopPropagation prevents inner clicks from closing */}
          <div 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[85%] max-w-md bg-white/10 backdrop-blur-xl p-10 rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto transition-all animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                  <Gift className="text-pink-300 w-6 h-6 animate-bounce" />
                </div>
              </div>
              
              <h2 className="text-xl font-serif text-pink-100 tracking-wider">Dein Geschenk</h2>
              
              <p className="text-white text-lg md:text-xl font-serif italic leading-relaxed px-2">
                "{wish}"
              </p>

              <div className="pt-4">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/40">
                  Tap anywhere to close
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header spacer */}
      <div />

      {/* Footer Actions */}
      <div className="flex justify-between items-end pointer-events-auto w-full max-w-7xl mx-auto mb-4">
        <button 
          onClick={onToggleCamera}
          className="group flex flex-col items-center gap-3 transition-all duration-500 hover:scale-110"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-md group-hover:border-pink-300 group-hover:bg-pink-500/10 transition-all">
            <Hand className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:text-pink-300" />
          </div>
          <span className="text-[9px] tracking-[0.2em] uppercase text-white/50 group-hover:text-pink-200">Magic Touch</span>
        </button>

        <button 
          onClick={handleOpenWish}
          className="group flex flex-col items-center gap-3 transition-all duration-500 hover:scale-110"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-md group-hover:border-pink-300 group-hover:bg-pink-500/10 transition-all">
            <Gift className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:text-pink-300" />
          </div>
          <span className="text-[9px] tracking-[0.2em] uppercase text-white/50 group-hover:text-pink-200">Open Gift</span>
        </button>
      </div>
    </div>
  );
};
