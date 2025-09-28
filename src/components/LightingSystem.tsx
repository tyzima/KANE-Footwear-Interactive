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
      // Dark background optimized lighting - brighter but smoother
      return (
        <>
          <Environment preset="night" />

          {/* Main Key Light - Moderate increase for dark backgrounds */}
          <directionalLight
            position={[4, 8, 6]}
            intensity={1.5 * intensity}
            color="#ffffff"
            castShadow
          />

          {/* Strong Fill Light to reduce harsh shadows */}
          <directionalLight
            position={[-3, 6, 4]}
            intensity={1.0 * intensity}
            color="#f8f8ff"
          />

          {/* Moderate Rim Light for edge definition */}
          <directionalLight
            position={[-2, 4, -6]}
            intensity={1.0 * intensity}
            color="#fff8dc"
          />

          {/* Soft Top Light for even illumination */}
          <directionalLight
            position={[0, 10, 2]}
            intensity={0.6 * intensity}
            color="#ffffff"
          />

          {/* Additional fill lights to smooth transitions */}
          <directionalLight
            position={[2, 4, -2]}
            intensity={0.4 * intensity}
            color="#f0f8ff"
          />
          
          <directionalLight
            position={[-2, 4, 2]}
            intensity={0.4 * intensity}
            color="#fff8f0"
          />

          {/* Softer accent lights */}
          <pointLight position={[3, 3, 3]} intensity={0.5 * intensity} color="#ffffff" distance={12} decay={2} />
          <pointLight position={[-3, 3, 3]} intensity={0.4 * intensity} color="#f8f8ff" distance={12} decay={2} />
          <pointLight position={[0, 2, 5]} intensity={0.4 * intensity} color="#ffffff" distance={10} decay={2} />

          {/* Higher ambient to fill in shadows smoothly */}
          <ambientLight intensity={0.5 * intensity} color="#f8f8ff" />
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

          {/* Main Key Light - Professional product photography positioning */}
          <directionalLight
            position={[5, 7, 4]}
            intensity={0.8 * intensity}
            color="#fff8f0" // Slightly warm daylight
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-far={50}
            shadow-camera-left={-12}
            shadow-camera-right={12}
            shadow-camera-top={12}
            shadow-camera-bottom={-12}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
            shadow-radius={4}
          />

          {/* Fill Light - Soft, cool fill to reduce harsh shadows */}
          <directionalLight
            position={[-4, 5, 3]}
            intensity={0.25 * intensity}
            color="#f0f8ff" // Cool daylight fill
          />

          {/* Rim Light - Subtle edge definition for depth */}
          <directionalLight
            position={[-2, 3, -5]}
            intensity={0.2 * intensity}
            color="#fff8dc" // Warm rim light
          />

          {/* Top Light - Soft overhead illumination */}
          <directionalLight
            position={[0, 8, 1]}
            intensity={0.15 * intensity}
            color="#ffffff"
          />

          {/* Background Light - Subtle separation from background */}
          <directionalLight
            position={[0, 2, -8]}
            intensity={0.1 * intensity}
            color="#f8f8ff"
          />

          {/* Soft fill lights for more realistic shadows */}
          <directionalLight
            position={[3, 4, 2]}
            intensity={0.3 * intensity}
            color="#fff8f0"
          />

          <directionalLight
            position={[-2, 3, 1]}
            intensity={0.2 * intensity}
            color="#f0f8ff"
          />

          {/* Subtle accent lights for material definition */}
          <pointLight 
            position={[2, 2, 3]} 
            intensity={0.12 * intensity} 
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
            intensity={0.08 * intensity} 
            color="#f8f8ff" 
            distance={6} 
            decay={2}
          />

          {/* Additional rim lighting for better edge definition */}
          <directionalLight
            position={[1, 2, -3]}
            intensity={0.12 * intensity}
            color="#fff8dc"
          />

          {/* Soft overhead bounce light */}
          <directionalLight
            position={[0, 6, 0]}
            intensity={0.06 * intensity}
            color="#ffffff"
          />

          {/* Contrast light for white materials - helps define edges */}
          <directionalLight
            position={[-3, 4, -2]}
            intensity={0.15 * intensity}
            color="#e8e8e8"
          />

          {/* Realistic ambient lighting - balanced warm/cool */}
          <ambientLight intensity={0.08 * intensity} color="#f8f8ff" />

          {/* Additional realistic lighting for material definition */}
          <hemisphereLight
            args={["#f0f8ff", "#fff8f0", 0.05 * intensity]}
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
          position={[0, -0.17, 0]}
          opacity={shadowIntensity * 0.9}
          scale={5}
          blur={1.2}
          far={3}
          color="#0a0a0a"
          resolution={2048}
          frames={1}
        />
      )}
    </>
  );
};