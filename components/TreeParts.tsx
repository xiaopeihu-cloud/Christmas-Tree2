import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, extend } from '@react-three/fiber';
import { Float, Instances, Instance, shaderMaterial, useCursor } from '@react-three/drei';
import { TreeState } from '../types';

// --- CUSTOM SHADERS ---

const FoliageMaterial = shaderMaterial(
  {
    uTime: 0,
    uChaos: 0, // 0 = Formed, 1 = Chaos
    uColorBase: new THREE.Color("#024023"), // Deep Emerald
    uColorTip: new THREE.Color("#F5F5F5"),  // Silver/Snow
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uChaos;
    attribute vec3 aChaosPos;
    attribute vec3 aTargetPos;
    attribute float aRandom;
    
    varying vec2 vUv;
    varying float vRandom;
    varying float vHeight;

    // Cubic easing for smoother transition
    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
    }

    void main() {
      vUv = uv;
      vRandom = aRandom;
      
      float t = easeInOutCubic(uChaos);
      
      // Interpolate position
      vec3 pos = mix(aTargetPos, aChaosPos, t);
      
      // Add subtle wind movement when formed
      if (uChaos < 0.1) {
        pos.x += sin(uTime * 2.0 + pos.y) * 0.05;
        pos.z += cos(uTime * 1.5 + pos.y) * 0.05;
      }
      
      // Add chaotic swirling when in chaos mode
      if (uChaos > 0.1) {
        float angle = uTime * (0.2 + aRandom * 0.5);
        float x = pos.x * cos(angle) - pos.z * sin(angle);
        float z = pos.x * sin(angle) + pos.z * cos(angle);
        pos.x = x;
        pos.z = z;
      }

      vHeight = pos.y;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size attenuation
      gl_PointSize = (40.0 * (1.0 + uChaos * 0.5)) / -mvPosition.z;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    varying float vRandom;
    varying float vHeight;

    void main() {
      // Circular particle
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);
      if (r > 1.0) discard;

      // Gradient from base to tip based on randomness and height (snow effect)
      float snowThreshold = 0.6 + sin(vHeight) * 0.1;
      vec3 finalColor = mix(uColorBase, uColorTip, step(0.8, vRandom));
      
      // Add silver shimmer
      float shimmer = step(0.95, fract(vRandom * 10.0));
      finalColor += vec3(shimmer) * 0.5;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ FoliageMaterial });

// --- UTILS ---

const randomSpherePoint = (radius: number) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

// --- COMPONENTS ---

export const MagicalFoliage = ({ count = 4500, treeState }: { count?: number, treeState: TreeState }) => {
  const materialRef = useRef<any>(null);
  
  const [geo, targetPos, chaosPos, randoms] = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const targetPositions = new Float32Array(count * 3);
    const chaosPositions = new Float32Array(count * 3);
    const randomValues = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Target: Cone Shape
      // h from -2.5 to 4
      const h = Math.random() * 6.5 - 2.5; 
      const radiusAtH = Math.max(0, (4 - h) * 0.6); 
      const theta = Math.random() * Math.PI * 2;
      const r = Math.random() * radiusAtH;
      
      targetPositions[i * 3] = r * Math.cos(theta);
      targetPositions[i * 3 + 1] = h;
      targetPositions[i * 3 + 2] = r * Math.sin(theta);

      // Chaos: Sphere
      const chaos = randomSpherePoint(8);
      chaosPositions[i * 3] = chaos.x;
      chaosPositions[i * 3 + 1] = chaos.y;
      chaosPositions[i * 3 + 2] = chaos.z;

      randomValues[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(targetPositions, 3)); 
    geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
    geometry.setAttribute('aChaosPos', new THREE.BufferAttribute(chaosPositions, 3));
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randomValues, 1));
    
    return [geometry, targetPositions, chaosPositions, randomValues];
  }, [count]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
      // Lerp chaos value
      const targetChaos = treeState === TreeState.CHAOS ? 1.0 : 0.0;
      materialRef.current.uChaos = THREE.MathUtils.lerp(materialRef.current.uChaos, targetChaos, 0.05);
    }
  });

  return (
    <points geometry={geo}>
      <foliageMaterial ref={materialRef} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
};

interface AnimatedInstanceProps { 
  targetPos: THREE.Vector3; 
  chaosPos: THREE.Vector3; 
  treeState: TreeState; 
  scale?: number | [number, number, number]; // Supports non-uniform scaling
  color: string;
  rotation?: THREE.Euler;
}

const AnimatedInstance: React.FC<AnimatedInstanceProps> = ({ 
  targetPos, 
  chaosPos, 
  treeState, 
  scale = 1, 
  color,
  rotation 
}) => {
  const ref = useRef<any>(null);
  const currentPos = useRef(new THREE.Vector3().copy(targetPos));

  // Determine target scale as Vector3
  const formedScaleVec = useMemo(() => {
    if (Array.isArray(scale)) {
        return new THREE.Vector3(...scale);
    }
    return new THREE.Vector3(scale, scale, scale);
  }, [scale]);

  const chaosScaleVec = useMemo(() => {
    return formedScaleVec.clone().multiplyScalar(0.5);
  }, [formedScaleVec]);

  useFrame(() => {
    if (!ref.current) return;
    
    const target = treeState === TreeState.CHAOS ? chaosPos : targetPos;
    
    // Smooth lerp position
    currentPos.current.lerp(target, 0.08);
    ref.current.position.copy(currentPos.current);
    
    // Rotation logic
    if (rotation) {
        if (treeState === TreeState.FORMED) {
            ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, rotation.x, 0.1);
            ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, rotation.y, 0.1);
            ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, rotation.z, 0.1);
        } else {
            ref.current.rotation.x += 0.1;
            ref.current.rotation.y += 0.1;
        }
    }
    
    // Scale animation
    const targetScale = treeState === TreeState.CHAOS ? chaosScaleVec : formedScaleVec;
    ref.current.scale.lerp(targetScale, 0.1);
  });

  return <Instance ref={ref} color={color} />;
};

export const LuxuryOrnaments = ({ treeState }: { treeState: TreeState }) => {
  const { gems, pearls, dustPearls, presents } = useMemo(() => {
    const _gems = [];
    const _pearls = [];
    const _dustPearls = [];
    const _presents = [];
    
    // 1. Fairing Gems
    const gemCount = 2000;
    for (let i = 0; i < gemCount; i++) {
      const h = Math.random() * 6.5 - 2.5; 
      const normalizedH = (h + 2.5) / 6.5; 
      const probability = 1.0 - Math.pow(normalizedH, 1.5); 

      if (Math.random() < probability) {
          const rBase = (4 - h) * 0.6;
          const r = rBase + (Math.random() - 0.2) * 0.5; 
          const theta = Math.random() * Math.PI * 2;
          
          const target = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
          const chaos = randomSpherePoint(6);
          _gems.push({ target, chaos, id: `g-fair-${i}` });
      }
    }

    // 2. Bottom Skirt Gems
    for (let i = 0; i < 1000; i++) {
      const h = (Math.random() * 1.5) - 2.5;
      const rBase = (4 - h) * 0.6;
      const r = rBase + (Math.random() * 0.4); 
      const theta = Math.random() * Math.PI * 2;

      const target = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
      const chaos = randomSpherePoint(6);
      _gems.push({ target, chaos, id: `g-skirt-${i}` });
    }

    // 3. Mixed Pearls (Strands with Morandi colors)
    const MORANDI_PEARL_COLORS = ['#dcbbbb', '#a8aab0']; // Pinkish, Greyish
    
    for (let i = 0; i < 700; i++) {
      const t = i / 700; 
      const h = 4 - t * 6.5; 
      const r = (4 - h) * 0.65;
      const theta = t * Math.PI * 18;
      
      const target = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
      const chaos = randomSpherePoint(7);
      
      // 20% Chance for Morandi colors
      let color = "#F5F5F5";
      if (Math.random() < 0.2) {
          color = MORANDI_PEARL_COLORS[Math.floor(Math.random() * MORANDI_PEARL_COLORS.length)];
      }

      _pearls.push({ target, chaos, color, id: i });
    }

    // 4. "Star Dust" Pearls
    for (let i = 0; i < 1500; i++) {
        const h = (Math.random() * 4.5) - 2.5; 
        const rBase = (4 - h) * 0.6;
        const r = rBase * (0.8 + Math.random() * 0.4); 
        const theta = Math.random() * Math.PI * 2;
        
        const target = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
        const chaos = randomSpherePoint(5);
        _dustPearls.push({ target, chaos, id: `d-${i}` });
    }

    // 5. Presents (Morandi Colors)
    // Green: #999b84 (Sage), Pink: #dcb3b3 (Dusty Pink), Blue: #8FA0B4 (Slate Blue)
    const MORANDI_BOX_COLORS = ['#999b84', '#dcb3b3', '#8FA0B4'];
    
    // Increased count to 400 to make it look solid and fill middle
    for (let i = 0; i < 400; i++) {
        // Extend height range: -2.5 (bottom) to 1.5 (middle-top)
        const h = (Math.random() * 4.0) - 2.5; 
        // Calculate tree radius at this height
        const rBase = (4 - h) * 0.6; 
        // Place them somewhat densely around the radius to create a "surface"
        const r = rBase * (0.7 + Math.random() * 0.4); 
        const theta = Math.random() * Math.PI * 2;
        
        const target = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
        const chaos = randomSpherePoint(6);
        
        // Random Rotation for boxes
        const rotation = new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        const color = MORANDI_BOX_COLORS[Math.floor(Math.random() * MORANDI_BOX_COLORS.length)];
        
        _presents.push({ target, chaos, color, rotation, id: `p-${i}` });
    }

    return { gems: _gems, pearls: _pearls, dustPearls: _dustPearls, presents: _presents };
  }, []);

  return (
    <group>
      {/* GEMS */}
      <Instances range={gems.length}>
        <icosahedronGeometry args={[0.06, 0]} />
        <meshPhysicalMaterial 
          color="#FFFFFF" 
          metalness={1.0} 
          roughness={0.0} 
          clearcoat={1.0}
          emissive="#FFFFFF" 
          emissiveIntensity={3.0} 
          toneMapped={false}      
        />
        {gems.map((data) => (
          <AnimatedInstance 
            key={data.id} 
            targetPos={data.target} 
            chaosPos={data.chaos} 
            treeState={treeState}
            color="#FFFFFF"
          />
        ))}
      </Instances>

      {/* STRAND PEARLS (Mixed Colors) */}
      <Instances range={pearls.length}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial metalness={0.8} roughness={0.1} emissive="#333333" />
        {pearls.map((data) => (
          <AnimatedInstance 
            key={`pearl-${data.id}`} 
            targetPos={data.target} 
            chaosPos={data.chaos} 
            treeState={treeState}
            color={data.color}
          />
        ))}
      </Instances>

      {/* STAR DUST PEARLS */}
      <Instances range={dustPearls.length}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial 
            color="#FFFFFF" 
            metalness={0.5} 
            roughness={0.2} 
            emissive="#505050" 
        />
        {dustPearls.map((data) => (
          <AnimatedInstance 
            key={data.id} 
            targetPos={data.target} 
            chaosPos={data.chaos} 
            treeState={treeState}
            color="#FFFFFF"
          />
        ))}
      </Instances>

      {/* PRESENTS - Box Ornaments */}
      <Instances range={presents.length}>
        {/* Size similar to pearls (0.07), slightly larger for box presence */}
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial 
            metalness={0.3} 
            roughness={0.4} 
            envMapIntensity={1.0}
        />
        {presents.map((data) => (
            <AnimatedInstance
                key={data.id}
                targetPos={data.target}
                chaosPos={data.chaos}
                treeState={treeState}
                color={data.color}
                rotation={data.rotation}
            />
        ))}
      </Instances>
    </group>
  );
};

export const SilverRibbon = ({ treeState }: { treeState: TreeState }) => {
  const segments = useMemo(() => {
    const items = [];
    const totalSegments = 600; // Increased density for smoother look
    const loops = 5.5; 
    
    for (let i = 0; i < totalSegments; i++) {
      const t = i / totalSegments; // 0 (top) to 1 (bottom)
      // Start from top (4) go to bottom (-2.5)
      const h = 4 - t * 6.5; 
      // Spiral radius
      const r = ((4 - h) * 0.6) + 0.15; 
      const theta = t * Math.PI * 2 * loops;
      
      const target = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
      const chaos = randomSpherePoint(9);
      const rotation = new THREE.Euler(0, -theta, 0); 

      // SCALE LOGIC: Thinner at top (t=0), thicker at bottom (t=1)
      const widthMultiplier = 0.5 + t * 1.3;
      const scale: [number, number, number] = [widthMultiplier, 1, widthMultiplier];

      items.push({ target, chaos, rotation, scale, id: i });
    }
    return items;
  }, []);

  return (
    <Instances range={segments.length}>
      <boxGeometry args={[0.15, 0.03, 0.15]} /> 
      {/* High shimmer silver material */}
      <meshStandardMaterial 
        color="#F0F0F0" 
        metalness={1.0} 
        roughness={0.1} 
        emissive="#AAAAAA"
        emissiveIntensity={0.6}
        envMapIntensity={2.5}
      />
      {segments.map((data) => (
        <AnimatedInstance 
          key={`ribbon-${data.id}`} 
          targetPos={data.target} 
          chaosPos={data.chaos} 
          treeState={treeState}
          rotation={data.rotation}
          scale={data.scale}
          color="#F0F0F0"
        />
      ))}
    </Instances>
  );
}

export const FloatingStar = ({ 
    treeState, 
    onClick 
}: { 
    treeState: TreeState,
    onClick?: () => void
}) => {
  const ref = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  // Use cursor hook to change mouse pointer on hover
  useCursor(hovered);

  // High fidelity 5-pointed star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const spikes = 5;
    const outerRadius = 1;
    const innerRadius = 0.45; // Sharper inner angles
    
    for (let i = 0; i < spikes * 2; i++) {
      const l = i % 2 === 0 ? outerRadius : innerRadius;
      // Rotate by PI/2 to point upwards
      const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * l;
      const y = Math.sin(a) * l;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  const extrusionSettings = useMemo(() => ({
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 4
  }), []);

  const targetPos = new THREE.Vector3(0, 5.2, 0);
  const chaosPos = new THREE.Vector3(0, 8, 0);

  useFrame((state) => {
    if (ref.current) {
      const target = treeState === TreeState.CHAOS ? chaosPos : targetPos;
      ref.current.position.lerp(target, 0.05);
      
      // Gentle rotation
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
    
    // Materialize Effect (Scale/Opacity simulation via Scale)
    if (meshRef.current) {
        // Reduced scaleBase from 0.8 to 0.55 (30% reduction)
        const t = state.clock.elapsedTime;
        const scaleBase = 0.55;
        const breathe = Math.sin(t) * 0.02;
        // Add hover effect
        const hoverScale = hovered ? 0.05 : 0;
        meshRef.current.scale.setScalar(scaleBase + breathe + hoverScale);
    }
  });

  return (
    <group 
        ref={ref} 
        onClick={(e) => {
            e.stopPropagation();
            console.log('Star clicked');
            onClick?.();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
    >
       {/* INVISIBLE HIT BOX FOR EASIER CLICKING */}
       <mesh visible={false}>
         {/* Large box to capture clicks even if slightly missed */}
         <boxGeometry args={[3, 3, 1]} />
         <meshBasicMaterial />
       </mesh>

       {/* 3D Extruded Star */}
       <mesh ref={meshRef} castShadow>
         <extrudeGeometry args={[starShape, extrusionSettings]} />
         <meshStandardMaterial 
           color="#FFFFFF" 
           metalness={1.0} 
           roughness={0.05} 
           emissive="#333333"
           emissiveIntensity={hovered ? 0.5 : 0.2} // Brighten on hover
           envMapIntensity={1.5}
         />
       </mesh>
       
       {/* Halo Ring - Scaled down to match */}
       <mesh rotation={[Math.PI/2, 0, 0]} scale={[0.7, 0.7, 0.7]}>
         <ringGeometry args={[1.2, 1.25, 64]} />
         <meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} side={THREE.DoubleSide} />
       </mesh>
    </group>
  );
};

export const ArixTree = ({ 
    treeState,
    onStarClick 
}: { 
    treeState: TreeState,
    onStarClick?: () => void
}) => {
  return (
    // Resized tree: Scale 0.9. Width reduced 20% -> x and z * 0.8.
    // Base scale is 0.9 (height). Width = 0.9 * 0.8 = 0.72.
    <group position={[0, -1, 0]} scale={[0.72, 0.9, 0.72]}> 
      <MagicalFoliage treeState={treeState} />
      <LuxuryOrnaments treeState={treeState} />
      <SilverRibbon treeState={treeState} />
      <FloatingStar treeState={treeState} onClick={onStarClick} />
    </group>
  );
};