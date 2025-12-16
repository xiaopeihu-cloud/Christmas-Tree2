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
      
      {/* Merry Christmas Animation - Only in CHAOS */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${treeState === 'CHAOS' ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-full px-4 text-center">
            <h1 className={`font-display text-2xl sm:text-4xl md:text-7xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] tracking-widest text-center transition-all duration-[3000ms] ease-out leading-tight ${treeState === 'CHAOS' ? 'translate-y-[-100px] md:translate-y-[-150px] scale-125' : 'translate-y-0 scale-100'}`}>
               MERRY CHRISTMAS
            </h1>
          </div>
      </div>

      {/* Header removed */}
      <div></div>

      {/* Center Action - Only show if no wish is open and NOT in chaos mode (to avoid text overlap) */}
      {!isWishOpen && treeState !== 'CHAOS' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           {/* State Indicator */}
           <div className="text-pink-100/50 text-sm font-serif tracking-widest uppercase animate-pulse">
              FORMED
           </div>
        </div>
      )}

      {/* Wish Dialog */}
      {isWishOpen && wish && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-sm z-50 animate-fade-in px-6">
          <div className="bg-pink-50 text-black p-8 rounded-3xl w-full max-w-sm md:max-w-md shadow-2xl border border-pink-200 transform transition-all scale-100">
             <div className="flex justify-center mb-4 text-pink-900">
               <Sparkles size={32} strokeWidth={1} />
             </div>
             <p className="font-serif text-xl md:text-2xl text-center leading-relaxed italic mb-6 text-pink-950">
               "{wish}"
             </p>
             <button 
               onClick={() => setIsWishOpen(false)}
               className="w-full py-3 bg-black text-pink-50 font-display tracking-widest hover:bg-emerald-950 transition-colors rounded-full text-xs uppercase"
             >
               Close
             </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-4 pointer-events-auto items-end w-full">
         
         <div className="flex gap-4">
            <button 
              onClick={onToggleCamera}
              className="bg-emerald-950/80 backdrop-blur-md border border-emerald-800 p-4 rounded-full text-emerald-200 hover:text-white hover:border-white transition-all group relative"
            >
              <Hand size={20} strokeWidth={1} />
              <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity rounded">
                Enable Gesture Control
              </span>
            </button>

            <button 
              onClick={handleOpenWish}
              className="bg-pink-100 border border-pink-200 p-4 rounded-full text-black hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,192,203,0.3)]"
            >
              <Gift size={24} strokeWidth={1} />
            </button>
         </div>
      </div>
    </div>
  );
};