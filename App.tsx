import React, { useState, useEffect, useRef } from 'react';
import { Scene } from './components/Scene';
import { UIOverlay } from './components/UIOverlay';
import { TreeState } from './types';
import { Volume2, VolumeX } from 'lucide-react';

// Declare handtrack on window since it's loaded via script tag
declare global {
  interface Window {
    handTrack: any;
  }
}

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const modelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Dedicated Play Handler for Star Interaction
  // "When click or tap on the star... music keeps playing"
  const handleStarPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    // Force play. If already playing, this is harmless.
    // If paused, it starts.
    audio.play()
      .then(() => setIsAudioPlaying(true))
      .catch(err => {
        console.warn("Star playback trigger failed:", err);
      });
  };

  // UI Toggle Button Handler (Mute/Unmute/Play/Pause)
  const handleManualToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error("Manual playback control failed:", err);
      }
    }
  };

  // Initialize Handtrack
  const toggleVideo = async () => {
    if (!isVideoEnabled) {
      const model = await window.handTrack.load();
      modelRef.current = model;
      const status = await window.handTrack.startVideo(videoRef.current);
      if (status) {
        setIsVideoEnabled(true);
        runDetection();
      }
    } else {
      window.handTrack.stopVideo(videoRef.current);
      setIsVideoEnabled(false);
    }
  };

  const runDetection = () => {
    if (!modelRef.current || !videoRef.current || !isVideoEnabled) return;

    modelRef.current.detect(videoRef.current).then((predictions: any[]) => {
      if (predictions.length > 0) {
        // Assume the first hand found is the primary controller
        const hand = predictions[0];
        
        // GESTURE LOGIC:
        // 'open' -> CHAOS (Unleash)
        // 'closed' / 'pinch' -> FORMED
        // bounding box x/y -> Rotation
        
        if (hand.label === 'open') {
          setTreeState(TreeState.CHAOS);
        } else if (hand.label === 'closed' || hand.label === 'pinch') {
          setTreeState(TreeState.FORMED);
        }

        // ROTATION LOGIC:
        const centerX = hand.bbox[0] + hand.bbox[2] / 2;
        const centerY = hand.bbox[1] + hand.bbox[3] / 2;
        
        const normX = (centerX / videoRef.current!.width) * 2 - 1; 
        const normY = (centerY / videoRef.current!.height) * 2 - 1;

        setRotation({ x: normX, y: normY });
      } else {
        // Default to formed if no hand detected
        setTreeState(TreeState.FORMED);
      }
      
      if (isVideoEnabled) {
        requestAnimationFrame(runDetection);
      }
    });
  };

  useEffect(() => {
    if (isVideoEnabled) {
      runDetection();
    }
  }, [isVideoEnabled]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white selection:bg-pink-200 selection:text-black">
      {/* Declarative Audio Element */}
      <audio 
        ref={audioRef}
        loop
        preload="auto"
        onCanPlay={() => setIsAudioReady(true)}
        onPlay={() => setIsAudioPlaying(true)}
        onPause={() => setIsAudioPlaying(false)}
        onError={(e) => console.error("Audio tag error:", e)}
      >
        <source src="https://upload.wikimedia.org/wikipedia/commons/transcoded/e/e9/We_Wish_You_a_Merry_Christmas.ogg/We_Wish_You_a_Merry_Christmas.ogg.mp3" type="audio/mpeg" />
        <source src="https://upload.wikimedia.org/wikipedia/commons/e/e9/We_Wish_You_a_Merry_Christmas.ogg" type="audio/ogg" />
      </audio>

      {/* Hidden Video Element for ML */}
      <video 
        ref={videoRef} 
        className="hidden" 
        width="640" 
        height="480"
        playsInline 
        muted
      />

      {/* 3D Scene Background */}
      <Scene 
        treeState={treeState} 
        rotation={rotation} 
        onStarClick={handleStarPlay}
      />
      
      {/* Interface Layer */}
      <UIOverlay treeState={treeState} onToggleCamera={toggleVideo} />
      
      {/* Camera Status Indicator */}
      {isVideoEnabled && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-[10px] text-red-500 font-mono tracking-widest uppercase">REC</span>
        </div>
      )}

      {/* Explicit Audio Toggle Indicator (Top Right) */}
      <button 
        onClick={handleManualToggle}
        className={`absolute top-4 right-4 z-50 transition-all duration-300 ${isAudioReady ? 'opacity-100 cursor-pointer' : 'opacity-30 cursor-not-allowed'} text-white hover:text-pink-200`}
        aria-label={isAudioPlaying ? "Mute Music" : "Play Music"}
        disabled={!isAudioReady}
      >
        {isAudioPlaying ? <Volume2 size={24} strokeWidth={1.5} /> : <VolumeX size={24} strokeWidth={1.5} />}
      </button>

      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.05] z-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      ></div>
    </div>
  );
}

export default App;