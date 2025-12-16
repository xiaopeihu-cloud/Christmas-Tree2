import React from 'react';

export interface WishRequest {
  recipient: string;
  theme: string;
}

export interface WishResponse {
  text: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum TreeState {
  FORMED = 'FORMED', // 0
  CHAOS = 'CHAOS'   // 1
}

// 3D Component Prop Types
export interface OrnamentProps {
  position: [number, number, number];
  color: string;
  scale?: number;
}

// Declare global JSX elements for React Three Fiber (Global scope)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      group: any;
      mesh: any;
      points: any;
      boxGeometry: any;
      sphereGeometry: any;
      icosahedronGeometry: any;
      ringGeometry: any;
      extrudeGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      meshBasicMaterial: any;
      foliageMaterial: any;
      primitive: any;
    }
  }
}

// Augment React's JSX namespace (Module scope)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      group: any;
      mesh: any;
      points: any;
      boxGeometry: any;
      sphereGeometry: any;
      icosahedronGeometry: any;
      ringGeometry: any;
      extrudeGeometry: any;
      meshStandardMaterial: any;
      meshPhysicalMaterial: any;
      meshBasicMaterial: any;
      foliageMaterial: any;
      primitive: any;
    }
  }
}
