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

  // 2. NEW: Function to process hand coordinates and trigger CHAOS
  const handleHandMovement = (prediction: any) => {
    if (treeState !== TreeState.CHAOS) {
      setTreeState(TreeState.CHAOS);
    }

    const [x, y, width, height] = prediction.bbox;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    const videoWidth = videoRef.current?.width || 640;
    const videoHeight = videoRef.current?.height || 480;
    
    // Normalize coordinates (-1 to 1) for Three.js
    const nx = (centerX / videoWidth) * 2 - 1;
    const ny = (centerY / videoHeight) * 2 - 1;

    setRotation({ x: ny * 0.5, y: nx * 0.5 });
  };

  // 3. Cleaned Detection Loop
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
        // Load model if it doesn't exist yet
        if (!modelRef.current) {
          modelRef.current = await window.handTrack.load(modelParams);
        }
        
        const status = await window.handTrack.startVideo(videoRef.current);
        if (status) {
          setIsVideoEnabled(true);
          // Wait a moment for camera warm-up before detecting
          setTimeout(() => runDetection(), 500);
        }
      } catch (err) {
        console.error("Failed to start camera:", err);
      }
    } else {
      window.handTrack.stopVideo(videoRef.current);
      setIsVideoEnabled(false);
    }
  };

  return (
    <div 
        onClick={handleInitial
