import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { ArixTree } from './TreeParts';
import { TreeState } from '../types';
import * as THREE from 'three';

const SceneContent = ({ 
  treeState, 
  rotation, 
  onStarClick 
}: { 
  treeState: TreeState, 
  rotation: { x: number, y: number },
  onStarClick?: () => void
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      // Smoothly rotate the entire scene based on hand movement
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotation.x * 2, 0.1);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rotation.y * 0.5, 0.1);
    }
  });

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 16]} fov={40} />
      
      <group ref={groupRef}>
        {/* --- LIGHTING --- */}
        <ambientLight intensity={0.1} color="#000000" />
        
        {/* Key Light (Bright Silver Moon/Starlight) */}
        <spotLight 
          position={[10, 10, 15]} 
          angle={0.3} 
          penumbra={1} 
          intensity={800} 
          castShadow 
          color="#E0FFFF" 
        />
        
        {/* Rim Light (Emerald/Earth Glow) */}
        <pointLight position={[-8, -5, -10]} intensity={400} color="#00FF7F" distance={40} />
        
        {/* Fill Light (Soft White) */}
        <pointLight position={[5, 0, 5]} intensity={150} color="#FFFFFF" distance={20} />

        <Environment preset="city" background={false} blur={1} />

        <ArixTree treeState={treeState} onStarClick={onStarClick} />
        
        {/* Falling Snow from Sky - Luxurious & Slow */}
        <Sparkles 
            count={800}
            scale={[20, 15, 20]} // Wide area
            position={[0, 6, 0]} // High up
            size={3}
            speed={0.2} // Slower, elegant fall
            opacity={0.9}
            color="#FFFFFF"
            noise={0.1}
        />
        
        {/* Stars for Deep Space */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
      </group>
      
      {/* --- POST PROCESSING --- */}
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0.7} 
          mipmapBlur 
          intensity={1.5} 
          radius={0.5} 
        />
        <Vignette eskil={false} offset={0.1} darkness={1.2} />
      </EffectComposer>
    </>
  );
};

export const Scene = ({ 
  treeState, 
  rotation, 
  onStarClick 
}: { 
  treeState: TreeState, 
  rotation: { x: number, y: number },
  onStarClick?: () => void
}) => {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      {/* Earth in Deep Space Effect - Black top, subtle curved earth glow at bottom */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_#001a1a_0%,_#000000_65%)]" />
      
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <SceneContent treeState={treeState} rotation={rotation} onStarClick={onStarClick} />
        </Suspense>
      </Canvas>
    </div>
  );
};