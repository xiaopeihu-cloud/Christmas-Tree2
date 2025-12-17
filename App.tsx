import React, { useState, useRef } from 'react';
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

// 1. Optimized parameters for Mobile & Desktop
const modelParams = {
  flipHorizontal: true,
  maxNumBoxes: 1,
  iouThreshold: 0.5,
  scoreThreshold: 0.6,
  modelSize: 'base', 
};

function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const modelRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // HANDLER: Passive Interaction
  const handleInitialInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // HANDLER: Star Click (Music Trigger)
  const handleStarClick = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!hasInteracted) setHasInteracted(true);
    
    audio.play()
      .then(() => setIsAudioPlaying(true))
      .catch(err => console.warn("Star playback trigger failed:", err));
  };

  // HANDLER: Manual Audio Toggle
  const handleManualToggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setHasInteracted(true);
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error("Manual playback control failed:", err);
    }
  };

  // 2. Process hand coordinates and trigger CHAOS
  const handleHandMovement = (prediction: any) => {
    if (treeState !== TreeState.CHAOS) {
      setTreeState(TreeState.CHAOS);
    }

    const [x, y, width, height] = prediction.bbox;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Use default values if videoRef is not yet available to avoid division by zero
    const videoWidth = videoRef.current?.width || 640;
    const videoHeight = videoRef.current?.height || 480;
    
    const nx = (centerX / videoWidth) * 2 - 1;
    const ny = (centerY / videoHeight) * 2 - 1;

    setRotation({ x: ny * 0.5, y: nx * 0.5 });
  };

  // 3. Cleaned Detection Loop (Moved inside to access state/refs)
  const runDetection = () => {
    if (!modelRef.current || !videoRef.current || !isVideoEnabled) return;

    modelRef.current.detect(videoRef.current).then((predictions: any[]) => {
      if (predictions && predictions.length > 0) {
        handleHandMovement(predictions[0]);
      }

      if (isVideoEnabled) {
        requestAnimationFrame(runDetection);
      }
    });
  };

  // Initialize/Toggle Video
  const toggleVideo = async () => {
    if (!isVideoEnabled) {
      try {
        if (!modelRef.current) {
          modelRef.current = await window.handTrack.load(modelParams);
        }
        
        const status = await window.handTrack.startVideo(videoRef.current);
        if (status) {
          setIsVideoEnabled(true);
          setTimeout(() => runDetection(), 500);
        }
      } catch (err) {
        console.error("Failed to start camera:", err);
      }
    } else {
      if (window.handTrack) {
        window.handTrack.stopVideo(videoRef.current);
      }
      setIsVideoEnabled(false);
    }
  };

  return (
    <div 
        onClick={handleInitialInteraction}
        onTouchStart={handleInitialInteraction}
        className="relative w-full h-[100dvh] overflow-hidden bg-black text-white"
    >
      <audio 
        ref={audioRef}
        loop
        preload="auto"
        onCanPlay={() => setIsAudioReady(true)}
        onPlay={() => setIsAudioPlaying(true)}
        onPause={() => setIsAudioPlaying(false)}
      >
        <source src="music.mp3" type="audio/mpeg" /> 
      </audio>

      <video 
        ref={videoRef} 
        className="hidden" 
        width="640" 
        height="480"
        playsInline 
        muted
      />

      <Scene 
        treeState={treeState} 
        rotation={rotation} 
        onStarClick={handleStarClick}
      />
      
      <UIOverlay treeState={treeState} onToggleCamera={toggleVideo} />
      
      {isVideoEnabled && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-[10px] text-red-500 font-mono tracking-widest uppercase">Magic Active</span>
        </div>
      )}

      <button 
        onClick={handleManualToggle}
        className={`absolute top-4 right-4 z-50 transition-all duration-300 ${isAudioReady ? 'opacity-100' : 'opacity-30'} text-white`}
        disabled={!isAudioReady}
      >
        {isAudioPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>
    </div>
  );
}

export default App;
