import React from 'react';
import { Environment } from '@react-three/drei';
import { LightingPreset } from './LightingControls';

interface LightingSystemProps {
  preset: LightingPreset;
  intensity: number;
  shadowIntensity: number;
}

export const LightingSystem: React.FC<LightingSystemProps> = ({
  preset,
  intensity,
  shadowIntensity
}) => {
  const renderLighting = () => {
    return (
      <>
        <Environment preset="studio" />
        
        {/* Main Key Light - Professional product photography */}
        <directionalLight
          position={[4, 8, 6]}
          intensity={1.2 * intensity}
          color="#ffffff"
        />
        
        {/* Fill Light - Soft opposite side */}
        <directionalLight
          position={[-3, 6, 4]}
          intensity={0.6 * intensity}
          color="#f8f8ff"
        />
        
        {/* Rim Light - Edge definition */}
        <directionalLight
          position={[-2, 4, -6]}
          intensity={0.8 * intensity}
          color="#fff8dc"
        />
        
        {/* Top Light - Even illumination */}
        <directionalLight
          position={[0, 10, 2]}
          intensity={0.4 * intensity}
          color="#ffffff"
        />
        
        {/* Professional accent lights */}
        <pointLight position={[3, 3, 3]} intensity={0.4 * intensity} color="#ffffff" distance={10} decay={2} />
        <pointLight position={[-3, 3, 3]} intensity={0.3 * intensity} color="#f8f8ff" distance={10} decay={2} />
        <pointLight position={[0, 2, 5]} intensity={0.3 * intensity} color="#ffffff" distance={8} decay={2} />
        
        {/* Soft ambient for realism */}
        <ambientLight intensity={0.25 * intensity} color="#f8f8ff" />
      </>
    );
  };

  return (
    <>
      {renderLighting()}

    </>
  );
};