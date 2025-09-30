import React, { useState, useEffect } from 'react';
import { Environment, ContactShadows } from '@react-three/drei';
import { LightingPreset } from './LightingControls';
import * as THREE from 'three';

interface LightingSystemProps {
  preset: LightingPreset;
  intensity: number;
  shadowIntensity: number;
  useHDRI?: boolean;
  hdriPath?: string;
}

export const LightingSystem: React.FC<LightingSystemProps> = ({
  preset,
  intensity,
  shadowIntensity,
  useHDRI = false,
  hdriPath
}) => {
  const [isLightingReady, setIsLightingReady] = useState(false);

  // Ensure lighting is ready after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLightingReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  const renderLighting = () => {
    // If HDRI is enabled, use it for environment lighting
    if (useHDRI && hdriPath) {
      return (
        <>
          <Environment 
            files={hdriPath}
            background={false}
            environmentIntensity={intensity * 1.5}
          />
          
          {/* Moonlight - primary light source from above */}
          <directionalLight
            position={[2, 12, 4]}
            intensity={0.8 * intensity}
            color="#e6f3ff"
            castShadow
          />
          
          {/* Secondary moonlight from side for depth */}
          <directionalLight
            position={[-3, 8, 2]}
            intensity={0.4 * intensity}
            color="#f0f8ff"
          />
          
          {/* Soft fill light to reduce harsh shadows */}
          <directionalLight
            position={[1, 6, -3]}
            intensity={0.3 * intensity}
            color="#f8f8ff"
          />
          
          {/* Ambient moonlight for overall illumination */}
          <ambientLight intensity={0.3 * intensity} color="#e6f3ff" />
        </>
      );
    }
    
    if (preset === 'dark_optimized') {
      // Realistic lighting for dark backgrounds with subtle shadows
      return (
        <>
          <Environment preset="night" />

          {/* Main Key Light - Increased intensity for brighter uppers */}
          <directionalLight
            position={[4, 8, 6]}
            intensity={0.35 * intensity}
            color="#ffffff"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
            shadow-radius={2}
          />

          {/* Increased fill light for brighter uppers */}
          <directionalLight
            position={[-3, 6, 4]}
            intensity={0.2 * intensity}
            color="#f0f8ff"
          />

          {/* Increased additional fill from right side */}
          <directionalLight
            position={[3, 6, 4]}
            intensity={0.15 * intensity}
            color="#fff8f0"
          />

          {/* Much softer top fill light to avoid reflections */}
          <directionalLight
            position={[0, 10, 2]}
            intensity={0.08 * intensity}
            color="#ffffff"
          />

          {/* Much softer rim light to avoid reflections */}
          <directionalLight
            position={[-2, 4, -4]}
            intensity={0.05 * intensity}
            color="#fff8dc"
          />

          {/* Much softer accent lights to avoid reflections */}
          <pointLight position={[3, 3, 3]} intensity={0.05 * intensity} color="#ffffff" distance={12} decay={2} />
          <pointLight position={[-3, 3, 3]} intensity={0.04 * intensity} color="#f8f8ff" distance={12} decay={2} />
          <pointLight position={[0, 2, 5]} intensity={0.03 * intensity} color="#ffffff" distance={10} decay={2} />

          {/* Increased ambient lighting for brighter uppers */}
          <ambientLight intensity={0.12 * intensity} color="#f0f8ff" />

          {/* Much softer hemisphere light to avoid reflections */}
          <hemisphereLight
            args={["#f0f8ff", "#fff8f0", 0.03 * intensity]}
          />
        </>
      );
    } else {
      // Realistic product photography lighting setup
      return (
        <>
          {/* Enhanced studio environment with better reflections */}
          <Environment 
            preset="studio" 
            environmentIntensity={intensity * 0.4}
            background={false}
            ground={{
              height: 15,
              radius: 60
            }}
          />

          {/* Main Key Light - Increased intensity for brighter uppers */}
          <directionalLight
            position={[5, 7, 4]}
            intensity={0.5 * intensity}
            color="#ffffff" // Pure white for accurate color reproduction
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
            shadow-radius={2}
          />

          {/* Fill Light - Increased intensity for brighter uppers */}
          <directionalLight
            position={[-4, 5, 3]}
            intensity={0.3 * intensity}
            color="#ffffff" // Pure white fill
          />

          {/* Rim Light - Much softer to avoid reflections */}
          <directionalLight
            position={[-2, 3, -5]}
            intensity={0.05 * intensity}
            color="#fff8dc" // Warm rim light
          />

          {/* Top Light - Increased intensity for brighter uppers */}
          <directionalLight
            position={[0, 8, 1]}
            intensity={0.2 * intensity}
            color="#ffffff"
          />

          {/* Background Light - Subtle separation from background */}
          <directionalLight
            position={[0, 2, -8]}
            intensity={0.1 * intensity}
            color="#f8f8ff"
          />

          {/* Soft fill lights - Increased intensity for brighter uppers */}
          <directionalLight
            position={[3, 4, 2]}
            intensity={0.25 * intensity}
            color="#ffffff"
          />

          <directionalLight
            position={[-2, 3, 1]}
            intensity={0.2 * intensity}
            color="#ffffff"
          />

          {/* Much softer accent lights to avoid reflections */}
          <pointLight 
            position={[2, 2, 3]} 
            intensity={0.03 * intensity} 
            color="#ffffff" 
            distance={8} 
            decay={2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
            shadow-radius={2}
          />
          
          <pointLight 
            position={[-1, 1, 4]} 
            intensity={0.02 * intensity} 
            color="#f8f8ff" 
            distance={6} 
            decay={2}
          />

          {/* Much softer rim lighting to avoid reflections */}
          <directionalLight
            position={[1, 2, -3]}
            intensity={0.03 * intensity}
            color="#fff8dc"
          />

          {/* Much softer overhead bounce light */}
          <directionalLight
            position={[0, 6, 0]}
            intensity={0.02 * intensity}
            color="#ffffff"
          />

          {/* Much softer contrast light to avoid reflections */}
          <directionalLight
            position={[-3, 4, -2]}
            intensity={0.04 * intensity}
            color="#e8e8e8"
          />

          {/* Increased ambient lighting for brighter uppers */}
          <ambientLight intensity={0.15 * intensity} color="#ffffff" />

          {/* Much softer hemisphere lighting to avoid reflections */}
          <hemisphereLight
            args={["#ffffff", "#ffffff", 0.05 * intensity]}
          />
        </>
      );
    }
  };

  return (
    <>
      {renderLighting()}

      {/* Realistic contact shadows with proper falloff */}
      {isLightingReady && (
        <ContactShadows
          position={[0, -0.06, 0]}
          opacity={shadowIntensity * 0.8}
          scale={3}
          blur={1.0}
          far={2}
          color="#000000"
          resolution={1024}
          frames={1}
        />
      )}
    </>
  );
};