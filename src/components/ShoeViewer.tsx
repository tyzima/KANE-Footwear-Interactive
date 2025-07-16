import React, { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PresentationControls } from '@react-three/drei';
import { ShoeModel } from './ShoeModel';
import { ViewerControls } from './ViewerControls';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorBoundary } from './ErrorBoundary';

interface ShoeViewerProps {
  className?: string;
}

export const ShoeViewer: React.FC<ShoeViewerProps> = ({ className = '' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [zoom, setZoom] = useState(0.8); // Start at 80% zoom as requested
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  const handleModelLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleModelError = (error: Error) => {
    setIsLoading(false);
    setError(error.message || 'Failed to load 3D model');
  };

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      setZoom(0.8); // Reset to 80% zoom
      setAutoRotate(true);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (controlsRef.current) {
      controlsRef.current.object.zoom = newZoom;
      controlsRef.current.object.updateProjectionMatrix();
    }
  };

  const handleHotspotSelect = (hotspot: string) => {
    setActiveHotspot(activeHotspot === hotspot ? null : hotspot);
    // In a real app, this would trigger highlighting of specific shoe parts
    console.log('Selected hotspot:', hotspot);
  };

  return (
    <div className={`relative w-full h-full bg-gradient-viewer rounded-lg overflow-hidden ${className}`}>
      <ErrorBoundary onError={handleModelError}>
        <Canvas
          camera={{ 
            position: [0, -0.5, 3], 
            fov: 45,
            near: 0.1,
            far: 1000
          }}
          shadows
          className="w-full h-full"
          gl={{ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true
          }}
          dpr={[1, 2]}
        >
          {/* Lighting Setup */}
          <ambientLight intensity={0.3} color="#ffffff" />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4A90E2" />
          <pointLight position={[10, -10, 10]} intensity={0.5} color="#E94B3C" />

          {/* Environment */}
          <Environment preset="studio" />
          
          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
            enableDamping
            dampingFactor={0.05}
            minDistance={1.5}
            maxDistance={6}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 6}
            enableZoom
            enablePan={false}
            target={[0, 0, 0]}
            makeDefault
          />

          {/* 3D Model */}
          <Suspense fallback={null}>
            <ShoeModel
              onLoad={handleModelLoad}
              onError={handleModelError}
              scale={zoom}
            />
          </Suspense>

          {/* Ground plane for shadows */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1.5, 0]}
            receiveShadow
          >
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.2} />
          </mesh>
        </Canvas>

        {/* Loading Overlay */}
        {isLoading && <LoadingIndicator />}

        {/* Error Display */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="text-center p-6 bg-card rounded-lg border border-destructive">
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Error Loading Model
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Reload
              </button>
            </div>
          </div>
        )}

        {/* Controls UI - Now positioned absolutely at bottom */}
        <div className="absolute bottom-4 left-4 right-4">
          <ViewerControls
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            zoom={zoom}
            onZoomChange={handleZoomChange}
            onReset={handleReset}
            onHotspotSelect={handleHotspotSelect}
            activeHotspot={activeHotspot}
            disabled={isLoading || !!error}
          />
        </div>
      </ErrorBoundary>
    </div>
  );
};