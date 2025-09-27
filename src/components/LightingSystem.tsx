import React from 'react';
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
      // Photorealistic studio lighting for light backgrounds - much more subtle
      return (
        <>
          <Environment preset="studio" />

          {/* Main Key Light - Much more subtle */}
          <directionalLight
            position={[4, 8, 6]}
            intensity={0.4 * intensity}
            color="#ffffff"
            castShadow
          />

          {/* Fill Light - Very soft */}
          <directionalLight
            position={[-3, 6, 4]}
            intensity={0.2 * intensity}
            color="#f8f8ff"
          />

          {/* Rim Light - Minimal edge definition */}
          <directionalLight
            position={[-2, 4, -6]}
            intensity={0.25 * intensity}
            color="#fff8dc"
          />

          {/* Top Light - Very gentle */}
          <directionalLight
            position={[0, 10, 2]}
            intensity={0.15 * intensity}
            color="#ffffff"
          />

          {/* Very subtle accent lights */}
          <pointLight position={[3, 3, 3]} intensity={0.1 * intensity} color="#ffffff" distance={10} decay={2} />
          <pointLight position={[-3, 3, 3]} intensity={0.08 * intensity} color="#f8f8ff" distance={10} decay={2} />
          <pointLight position={[0, 2, 5]} intensity={0.08 * intensity} color="#ffffff" distance={8} decay={2} />

          {/* Very low ambient - let the environment do most of the work */}
          <ambientLight intensity={0.08 * intensity} color="#f8f8ff" />
        </>
      );
    }
  };

  return (
    <>
      {renderLighting()}

      {/* Clean contact shadows without texture bleeding */}
      <ContactShadows
        position={[0, -0.17, 0]}
        opacity={shadowIntensity * 0.9}
        scale={4}
        blur={2}
        far={2}
        color="#000000"
      />
    </>
  );
};