import React, { useState } from 'react';
import { Gift, Sparkles, Hand } from 'lucide-react';
import { TreeState } from '../types';

const LUXURY_WISHES = [
  "May your holidays sparkle with moments of love, laughter, and goodwill.",
  "Wishing you a season of gladness, a season of cheer, and to top it all off, a wonderful year.",
  "May the magic of the holidays fill your home with joy and peace.",
  "Sending you the spirit of love, joy, and giving. Unwrap it with love.",
  "May this festive season sparkle and shine, may all of your wishes and dreams come true.",
  "Wishing you a Christmas that's merry and bright, and a New Year filled with promise.",
  "May the holiday spirit find a home in your heart and lingering there, bring you inner peace.",
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
      
      {/* Merry Christmas Animation - Optimized for iPad/Mobile */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${treeState === 'CHAOS' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-full max-w-[90vw] mx-auto text-center px-4">
            <h1 className={`font-display text-3xl sm:text-5xl md:text-7xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] tracking-[0.2em] transition-all duration-[3000ms] ease-out leading-tight whitespace-nowrap sm:whitespace-normal ${
              treeState === 'CHAOS' 
                ? 'translate-y-[-80px] md:translate-y-[-150px] scale-110 md:scale-125' 
                : 'translate-y-0 scale-100'
            }`}>
                 MERRY CHRISTMAS
            </h1>
          </div>
      </div>

      {/* Header spacer */}
      <div></div>

      {/* Center Action */}
      {!isWishOpen && treeState !== 'CHAOS' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="text-pink-100/50 text-sm font-serif tracking-[0.3em] uppercase animate-pulse">
              FORMED
           </div>
        </div>
      )}

      {/* Wish Dialog */}
      {isWishOpen && wish && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-md z-50 animate-fade-in px-6">
          <div className="max-w-md w-full bg-white/10 border border-white/20 p-8 rounded-2xl backdrop-blur-xl text-center shadow-2xl">
            <Sparkles className="w-8 h-8 text-pink-300 mx-auto mb-6 animate-spin-slow" />
            <p className="text-lg md:text-xl font-serif italic text-pink-50 leading-relaxed mb-8">
              "{wish}"
            </p>
            <button 
              onClick={() => setIsWishOpen(false)}
              className="px-8 py-3 bg-white text-black text-xs tracking-widest uppercase hover:bg-pink-100 transition-colors rounded-full font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex justify-between items-end pointer-events-auto w-full max-w-7xl mx-auto">
        <button 
          onClick={onToggleCamera}
          className="group flex flex-col items-center gap-3 transition-all duration-500 hover:scale-110"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-md group-hover:border-pink-300 group-hover:bg-pink-500/10 transition-all">
            <Hand className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:text-pink-300" />
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/60 group-hover:text-pink-200">AI Control</span>
        </button>

        <button 
          onClick={handleOpenWish}
          className="group flex flex-col items-center gap-3 transition-all duration-500 hover:scale-110"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-md group-hover:border-pink-300 group-hover:bg-pink-500/10 transition-all">
            <Gift className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:text-pink-300" />
          </div>
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/60 group-hover:text-pink-200">Open Gift</span>
        </button>
      </div>
    </div>
  );
};
