import React, { Suspense, useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { ShoeModel } from './ShoeModel';
import { ViewerControls } from './ViewerControls';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorBoundary } from './ErrorBoundary';
import { ColorCustomizer } from './ColorCustomizer';
import { LightingControls, LightingPreset } from './LightingControls';
import { LightingSystem } from './LightingSystem';
import { DebugMenu, DebugDataCollector } from './DebugMenu';

interface ShoeViewerProps {
  className?: string;
}

export const ShoeViewer: React.FC<ShoeViewerProps> = ({ className = '' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [zoom, setZoom] = useState(0.8); // Start at 80% zoom as requested
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [bottomColor, setBottomColor] = useState('#2d5016'); // Forest Green
  const [topColor, setTopColor] = useState('#8b4513'); // Redwood
  const [upperHasSplatter, setUpperHasSplatter] = useState(false);
  const [soleHasSplatter, setSoleHasSplatter] = useState(false);
  const [upperSplatterColor, setUpperSplatterColor] = useState('#f8f8ff'); // Glacier White
  const [soleSplatterColor, setSoleSplatterColor] = useState('#f8f8ff'); // Glacier White
  const [upperPaintDensity, setUpperPaintDensity] = useState(50); // 50% default
  const [solePaintDensity, setSolePaintDensity] = useState(50); // 50% default
  const [activeColorTab, setActiveColorTab] = useState<'upper' | 'sole'>('upper');
  const [lightingIntensity, setLightingIntensity] = useState(1.0);
  const [shadowIntensity, setShadowIntensity] = useState(0.5);
  const [debugVisible, setDebugVisible] = useState(false);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [cameraInfo, setCameraInfo] = useState({
    position: [0, 0, 0] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    zoom: 1
  });
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

  const handleCameraMove = (position: [number, number, number], target: [number, number, number], zoom?: number) => {
    // Convert camera move request to hotspot format for smooth animation
    const hotspotData = {
      position,
      target,
      zoom: zoom || 1
    };
    handleGoToHotspot(hotspotData);
  };

  const handlePartClick = (partType: 'upper' | 'sole') => {
    setActiveColorTab(partType);
  };

  const handleHotspotAdd = (hotspot: any) => {
    setHotspots(prev => [...prev, hotspot]);
    console.log('Added hotspot:', hotspot);
  };

  const handleCameraPositionSet = (position: [number, number, number], target: [number, number, number]) => {
    console.log('Camera position set:', { position, target });
  };

  const handleCameraReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      setZoom(0.8);
      setAutoRotate(true);
    }
  };

  const handleGoToHotspot = (hotspot: any) => {
    if (controlsRef.current) {
      // Smooth camera transition using three.js animation
      const controls = controlsRef.current;
      const camera = controls.object;
      
      // Get current positions
      const startPosition = camera.position.clone();
      const startTarget = controls.target.clone();
      const startZoom = camera.zoom;
      
      // Target positions
      const endPosition = new THREE.Vector3(...hotspot.position);
      const endTarget = new THREE.Vector3(...hotspot.target);
      const endZoom = hotspot.zoom || 1;
      
      // Animation duration in milliseconds
      const duration = 1500;
      const startTime = Date.now();
      
      // Disable controls during animation
      controls.enabled = false;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing function (ease-in-out)
        const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedProgress = easeInOut(progress);
        
        // Interpolate position
        camera.position.lerpVectors(startPosition, endPosition, easedProgress);
        
        // Interpolate target
        controls.target.lerpVectors(startTarget, endTarget, easedProgress);
        
        // Interpolate zoom
        camera.zoom = startZoom + (endZoom - startZoom) * easedProgress;
        camera.updateProjectionMatrix();
        
        // Update controls
        controls.update();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Re-enable controls after animation
          controls.enabled = true;
        }
      };
      
      animate();
    }
  };

  return (
    <div className={`relative w-full h-full bg-gradient-viewer rounded-lg overflow-hidden ${className}`}>
      <ErrorBoundary onError={handleModelError}>
        <Canvas
          camera={{ 
            position: [2.863, 0.461, 1.44], 
            fov: 45,
            near: 0.1,
            far: 1000,
            zoom: 1
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
          {/* Dynamic Lighting System */}
          <LightingSystem 
            preset={'photorealistic'}
            intensity={lightingIntensity}
            shadowIntensity={shadowIntensity}
          />
          
          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={2.0}
            enableDamping
            dampingFactor={0.05}
            minDistance={1.5}
            maxDistance={6}
            maxPolarAngle={Math.PI / 2.2}
            minPolarAngle={Math.PI / 6}
            enableZoom
            enablePan={false}
            target={[0, 0, 0]}
            makeDefault
          />

          {/* Debug Data Collector */}
          {debugVisible && (
            <DebugDataCollector onCameraUpdate={setCameraInfo} />
          )}

          {/* 3D Model */}
          <Suspense fallback={null}>
            <ShoeModel
              onLoad={handleModelLoad}
              onError={handleModelError}
              onPartClick={handlePartClick}
              scale={zoom}
              bottomColor={bottomColor}
              topColor={topColor}
              upperHasSplatter={upperHasSplatter}
              soleHasSplatter={soleHasSplatter}
              upperSplatterColor={upperSplatterColor}
              soleSplatterColor={soleSplatterColor}
              upperPaintDensity={upperPaintDensity}
              solePaintDensity={solePaintDensity}
            />
          </Suspense>


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

        {/* Color Customizer - Top Right */}
        <ColorCustomizer
          topColor={topColor}
          bottomColor={bottomColor}
          onTopColorChange={setTopColor}
          onBottomColorChange={setBottomColor}
          upperHasSplatter={upperHasSplatter}
          soleHasSplatter={soleHasSplatter}
          upperSplatterColor={upperSplatterColor}
          soleSplatterColor={soleSplatterColor}
          upperPaintDensity={upperPaintDensity}
          solePaintDensity={solePaintDensity}
          onUpperSplatterToggle={setUpperHasSplatter}
          onSoleSplatterToggle={setSoleHasSplatter}
          onUpperSplatterColorChange={setUpperSplatterColor}
          onSoleSplatterColorChange={setSoleSplatterColor}
          onUpperPaintDensityChange={setUpperPaintDensity}
          onSolePaintDensityChange={setSolePaintDensity}
          activeTab={activeColorTab}
          onTabChange={setActiveColorTab}
        />

        {/* Lighting Controls - Bottom Left */}
        <div className="absolute bottom-4 left-4 z-10">
          <LightingControls
            intensity={lightingIntensity}
            onIntensityChange={setLightingIntensity}
            shadowIntensity={shadowIntensity}
            onShadowIntensityChange={setShadowIntensity}
          />
        </div>

        {/* Controls UI - Now positioned absolutely at bottom with higher z-index */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <ViewerControls
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            zoom={zoom}
            onZoomChange={handleZoomChange}
            onReset={handleReset}
            onHotspotSelect={handleHotspotSelect}
            activeHotspot={activeHotspot}
            disabled={isLoading || !!error}
            onCameraMove={handleCameraMove}
          />
        </div>

        {/* Debug Menu 
        <DebugMenu
          visible={debugVisible}
          onToggleVisibility={() => setDebugVisible(!debugVisible)}
          onHotspotAdd={handleHotspotAdd}
          onCameraPositionSet={handleCameraPositionSet}
          cameraInfo={cameraInfo}
          onCameraReset={handleCameraReset}
          onGoToHotspot={handleGoToHotspot}
        />*/}
      </ErrorBoundary>
    </div>
  );
};