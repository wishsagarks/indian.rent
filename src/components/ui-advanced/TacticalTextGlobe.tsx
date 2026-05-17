'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function TextSphere() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate the dot-matrix text projected onto a sphere
  const particles = useMemo(() => {
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    // Create a virtual canvas to draw the text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 512;
    
    if (ctx) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 120px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Draw text multiple times for wrap-around effect
      ctx.fillText('indian.rent', canvas.width / 2, canvas.height / 2);
      ctx.fillText('indian.rent', canvas.width / 2, canvas.height / 4);
      ctx.fillText('indian.rent', canvas.width / 2, (canvas.height * 3) / 4);
    }

    const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spherical coordinates
      const radius = 2;
      const theta = Math.random() * Math.PI * 2; // Longitude
      const phi = Math.acos(2 * Math.random() - 1); // Latitude

      // Map spherical to canvas UV
      const u = (theta / (Math.PI * 2)) * canvas.width;
      const v = (phi / Math.PI) * canvas.height;
      
      const pixelIndex = (Math.floor(v) * canvas.width + Math.floor(u)) * 4;
      const isText = imageData ? imageData[pixelIndex] > 128 : false;

      // Position
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      // Color: Neon Primary for text, subtle for background
      if (isText) {
        colors[i3] = 0.7;     // R
        colors[i3 + 1] = 0.77; // G
        colors[i3 + 2] = 1.0;  // B (Tactical Blue)
      } else {
        // Very subtle background grid
        colors[i3] = 0.1;
        colors[i3 + 1] = 0.1;
        colors[i3 + 2] = 0.15;
      }
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.002;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Points ref={pointsRef} positions={particles.positions} colors={particles.colors}>
      <PointMaterial
        transparent
        vertexColors
        size={0.035}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export default function TacticalTextGlobe() {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing bg-background/50 rounded-full overflow-hidden">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} />
        <ambientLight intensity={0.5} />
        
        <TextSphere />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.5} 
        />
        
        {/* Tactical Overlay Shadow */}
        <mesh position={[0, 0, -1]}>
           <sphereGeometry args={[2.1, 32, 32]} />
           <meshBasicMaterial color="#000" transparent opacity={0.2} side={THREE.BackSide} />
        </mesh>
      </Canvas>
    </div>
  );
}
