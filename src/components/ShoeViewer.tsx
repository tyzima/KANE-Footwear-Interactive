import React, { Suspense, useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';
import { ShoeModel } from './ShoeModel';
import { ViewerControls } from './ViewerControls';
import { LoadingIndicator } from './LoadingIndicator';
import { ErrorBoundary } from './ErrorBoundary';
import { ColorCustomizer } from './ColorCustomizer';
import { AIChat } from './AIChat';
import { LightingControls, LightingPreset } from './LightingControls';
import { LightingSystem } from './LightingSystem';
import { DebugMenu, DebugDataCollector } from './DebugMenu';

// National Park inspired color palette with specific darkened speckle base colors
const NATIONAL_PARK_COLORS = [
  { name: 'Forest Green', value: '#4a8c2b', speckleValue: '#162a0c' },
  { name: 'Redwood', value: '#c25d1e', speckleValue: '#3a1c09' },
  { name: 'Canyon Orange', value: '#ff8c3a', speckleValue: '#4d2a11' },
  { name: 'Desert Sand', value: '#e6c095', speckleValue: '#44392c' },
  { name: 'Stone Gray', value: '#9cb3c9', speckleValue: '#2e353c' },
  { name: 'Sky Blue', value: '#5da9e9', speckleValue: '#1c3246' },
  { name: 'Sunset Purple', value: '#b87da9', speckleValue: '#372532' },
  { name: 'Pine Dark', value: '#2d6349', speckleValue: '#0e1d16' },
  { name: 'Earth Brown', value: '#b06a2c', speckleValue: '#341f0d' },
  { name: 'Glacier White', value: '#ffffff', speckleValue: '#ffffff' },
  { name: 'Mountain Peak', value: '#6d6d6d', speckleValue: '#202020' },
  { name: 'Meadow Green', value: '#94e600', speckleValue: '#2c4400' },
];

// Helper function to get the appropriate color based on speckle state
const getColorForSpeckle = (baseColor: string, hasSpeckle: boolean): string => {
  if (!hasSpeckle) return baseColor;

  const colorEntry = NATIONAL_PARK_COLORS.find(c => c.value === baseColor);
  return colorEntry?.speckleValue || baseColor;
};

// Background component to reactively update scene background
const SceneBackground: React.FC<{ backgroundType: 'light' | 'dark' | 'turf' }> = ({ backgroundType }) => {
  const { scene } = useThree();

  React.useEffect(() => {
    let backgroundColor: string;
    switch (backgroundType) {
      case 'dark':
        backgroundColor = '#1a1a1a';
        break;
      case 'turf':
        // Turf field green - nice dark green grass color
        backgroundColor = '#1b4f2a';
        break;
      case 'light':
      default:
        backgroundColor = '#f8f9fa';
        break;
    }
    scene.background = new THREE.Color(backgroundColor);
  }, [scene, backgroundType]);

  return null;
};

interface ShoeViewerProps {
  className?: string;
  backgroundType?: 'light' | 'dark' | 'turf';
  onBackgroundTypeChange?: (type: 'light' | 'dark' | 'turf') => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onColorConfigurationChange?: (config: any) => void;
}

export const ShoeViewer: React.FC<ShoeViewerProps> = ({
  className = '',
  backgroundType: externalBackgroundType = 'light',
  onBackgroundTypeChange,
  canvasRef,
  onColorConfigurationChange
}) => {
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
  const [upperPaintDensity, setUpperPaintDensity] = useState(500); // 50% default
  const [solePaintDensity, setSolePaintDensity] = useState(500); // 50% default
  const [activeColorTab, setActiveColorTab] = useState<'upper' | 'sole' | 'laces' | 'logos'>('upper');

  // ColorCustomizer height tracking for AIChat positioning
  const [customizerHeight, setCustomizerHeight] = useState(100);

  // Lace and logo colors (single color for both left and right)
  const [laceColor, setLaceColor] = useState('#FFFFFF');
  const [logoColor, setLogoColor] = useState('#FFFFFF');

  // Gradient state
  const [upperHasGradient, setUpperHasGradient] = useState(false);
  const [soleHasGradient, setSoleHasGradient] = useState(false);
  const [upperGradientColor1, setUpperGradientColor1] = useState('#4a8c2b'); // Forest Green
  const [upperGradientColor2, setUpperGradientColor2] = useState('#c25d1e'); // Redwood
  const [soleGradientColor1, setSoleGradientColor1] = useState('#4a8c2b'); // Forest Green
  const [soleGradientColor2, setSoleGradientColor2] = useState('#c25d1e'); // Redwood

  // Texture state
  const [upperTexture, setUpperTexture] = useState<string | null>(null);
  const [soleTexture, setSoleTexture] = useState<string | null>(null);

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPlacementMode, setLogoPlacementMode] = useState(false);
  const [logoPosition, setLogoPosition] = useState<[number, number, number]>([0.668, 0.159, -0.490]);
  const [logoRotation, setLogoRotation] = useState<[number, number, number]>([1.171, -4.300, -1.100]);

  // Second logo state
  const [logo2Position, setLogo2Position] = useState<[number, number, number]>([-0.661, 0.163, -0.488]);
  const [logo2Rotation, setLogo2Rotation] = useState<[number, number, number]>([1.163, -1.905, 1.183]);

  const [lightingIntensity, setLightingIntensity] = useState(1.0);
  const [shadowIntensity, setShadowIntensity] = useState(0.5);
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('photorealistic');
  const [debugVisible, setDebugVisible] = useState(false);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [cameraInfo, setCameraInfo] = useState({
    position: [0, 0, 0] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    zoom: 1
  });
  const controlsRef = useRef<any>(null);

  // Use external background type or fallback to internal state
  const backgroundType = externalBackgroundType;
  const setBackgroundType = onBackgroundTypeChange ?? (() => { });
  
  // Helper function to determine if current background should use dark mode styling
  const isDarkMode = backgroundType === 'dark' || backgroundType === 'turf';

  // Function to get current color configuration
  const getColorConfiguration = () => {
    return {
      upper: {
        baseColor: topColor,
        hasSplatter: upperHasSplatter,
        splatterColor: upperSplatterColor,
        hasGradient: upperHasGradient,
        gradientColor1: upperGradientColor1,
        gradientColor2: upperGradientColor2,
        texture: upperTexture,
        paintDensity: upperPaintDensity
      },
      sole: {
        baseColor: bottomColor,
        hasSplatter: soleHasSplatter,
        splatterColor: soleSplatterColor,
        hasGradient: soleHasGradient,
        gradientColor1: soleGradientColor1,
        gradientColor2: soleGradientColor2,
        texture: soleTexture,
        paintDensity: solePaintDensity
      },
      laces: {
        color: laceColor
      },
      logo: {
        color: logoColor,
        url: logoUrl,
        position: logoPosition,
        rotation: logoRotation
      }
    };
  };

  // Effect to notify parent component when color configuration changes
  React.useEffect(() => {
    if (onColorConfigurationChange) {
      onColorConfigurationChange(getColorConfiguration());
    }
  }, [
    topColor, bottomColor, laceColor, logoColor,
    upperHasSplatter, soleHasSplatter, upperSplatterColor, soleSplatterColor,
    upperPaintDensity, solePaintDensity,
    upperHasGradient, soleHasGradient,
    upperGradientColor1, upperGradientColor2, soleGradientColor1, soleGradientColor2,
    upperTexture, soleTexture, logoUrl, logoPosition, logoRotation,
    onColorConfigurationChange
  ]);

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

  const handlePartClick = (partType: 'upper' | 'sole' | 'laces' | 'logos') => {
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

  const handleLogoPlacementModeToggle = (enabled: boolean) => {
    setLogoPlacementMode(enabled);
    console.log('Logo placement mode:', enabled ? 'ENABLED' : 'DISABLED');
  };

  const handleLogoPositionSet = (position: [number, number, number], normal: [number, number, number]) => {
    console.log('Logo position clicked:', { position, normal });
    setLogoPosition(position);

    // Only calculate rotation from normal if we're in placement mode (not manual editing)
    if (logoPlacementMode) {
      // Calculate rotation from normal vector to align logo with surface
      const normalVector = new THREE.Vector3(...normal);

      // Create a quaternion that rotates the logo to align with the surface normal
      const up = new THREE.Vector3(0, 0, 1); // Logo's default "up" direction
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(up, normalVector);

      // Convert quaternion to Euler angles
      const euler = new THREE.Euler();
      euler.setFromQuaternion(quaternion, 'XYZ');

      // Adjust the rotation to make the logo face outward from the surface
      // Add a 90-degree rotation around the normal to make it lay flat
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.makeRotationFromEuler(euler);

      // Apply additional rotation to make logo lay flat on surface
      const additionalRotation = new THREE.Euler(Math.PI / 2, 0, 0);
      const additionalMatrix = new THREE.Matrix4();
      additionalMatrix.makeRotationFromEuler(additionalRotation);

      rotationMatrix.multiply(additionalMatrix);

      const finalEuler = new THREE.Euler();
      finalEuler.setFromRotationMatrix(rotationMatrix, 'XYZ');

      setLogoRotation([finalEuler.x, finalEuler.y, finalEuler.z]);

      console.log('Logo rotation set to:', [finalEuler.x, finalEuler.y, finalEuler.z]);

      // Auto-exit placement mode after setting position
      setLogoPlacementMode(false);
    }
  };

  const handleLogoRotationSet = (rotation: [number, number, number]) => {
    console.log('Logo rotation manually set to:', rotation);
    setLogoRotation(rotation);
  };

  return (
    <div className={`relative w-full h-full bg-gradient-viewer rounded-lg overflow-hidden ${className}`}>
      <ErrorBoundary onError={handleModelError}>
        <Canvas
          ref={canvasRef}
          camera={{
            position: [2.863, 1.961, 1.44],
            fov: 40,
            near: 0.1,
            far: 100,
            zoom: 1.25
          }}
          shadows
          className="w-full h-full"
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: true,
            outputColorSpace: "srgb",
            toneMapping: 1, // ACESFilmicToneMapping
            toneMappingExposure: 0.8
          }}
          dpr={[1, 2]}

        >
          {/* Scene Background */}
          <SceneBackground backgroundType={backgroundType} />

          {/* Dynamic Lighting System */}
          <LightingSystem
            preset={lightingPreset}
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
            minDistance={3.5}
            maxDistance={5}
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
              bottomColor={getColorForSpeckle(bottomColor, soleHasSplatter)}
              topColor={getColorForSpeckle(topColor, upperHasSplatter)}
              upperHasSplatter={upperHasSplatter}
              soleHasSplatter={soleHasSplatter}
              upperSplatterColor={upperSplatterColor}
              soleSplatterColor={soleSplatterColor}
              upperPaintDensity={upperPaintDensity}
              solePaintDensity={solePaintDensity}
              // Gradient props
              upperHasGradient={upperHasGradient}
              soleHasGradient={soleHasGradient}
              upperGradientColor1={upperGradientColor1}
              upperGradientColor2={upperGradientColor2}
              soleGradientColor1={soleGradientColor1}
              soleGradientColor2={soleGradientColor2}
              // Texture props
              upperTexture={upperTexture}
              soleTexture={soleTexture}
              // Lace and logo colors (single color for both left and right)
              laceColor={laceColor}
              logoColor={logoColor}
              // Logo props
              logoUrl={logoUrl}
              logoPosition={logoPosition}
              logoRotation={logoRotation}
              logoPlacementMode={logoPlacementMode}
              onLogoPositionSet={handleLogoPositionSet}
              // Second logo props
              logo2Position={logo2Position}
              logo2Rotation={logo2Rotation}
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

        {/* ViewerControls - Right Side Under Share Button */}
        <div className="absolute top-12 md:top-32  right-8 z-10 hidden md:block">
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
            backgroundType={backgroundType}
            onBackgroundToggle={setBackgroundType}
          />
        </div>

        {/* ViewerControls - Mobile: Right Side Lower */}
        <div className="absolute top-32 right-8 z-10 md:hidden">
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
            backgroundType={backgroundType}
            onBackgroundToggle={setBackgroundType}
          />
        </div>

        {/* Lighting Controls - Top Right, Next to Share Button */}
        <div className="absolute top-4 right-20 z-10">
          <LightingControls
            intensity={lightingIntensity}
            onIntensityChange={setLightingIntensity}
            shadowIntensity={shadowIntensity}
            onShadowIntensityChange={setShadowIntensity}
            isDarkMode={isDarkMode}
            onPresetChange={setLightingPreset}
          />
        </div>

        {/* Color Customizer - Bottom Panel */}
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
          // Lace and logo colors (single color for both left and right)
          laceColor={laceColor}
          logoColor={logoColor}
          onLaceColorChange={setLaceColor}
          onLogoColorChange={setLogoColor}
          // Gradient props
          upperHasGradient={upperHasGradient}
          soleHasGradient={soleHasGradient}
          upperGradientColor1={upperGradientColor1}
          upperGradientColor2={upperGradientColor2}
          soleGradientColor1={soleGradientColor1}
          soleGradientColor2={soleGradientColor2}
          onUpperGradientToggle={setUpperHasGradient}
          onSoleGradientToggle={setSoleHasGradient}
          onUpperGradientColor1Change={setUpperGradientColor1}
          onUpperGradientColor2Change={setUpperGradientColor2}
          onSoleGradientColor1Change={setSoleGradientColor1}
          onSoleGradientColor2Change={setSoleGradientColor2}
          // Texture props
          upperTexture={upperTexture}
          soleTexture={soleTexture}
          onUpperTextureChange={setUpperTexture}
          onSoleTextureChange={setSoleTexture}
          // Logo props
          logoUrl={logoUrl}
          onLogoChange={setLogoUrl}
          // Dark mode
          isDarkMode={isDarkMode}
          // Height callback for AIChat positioning
          onHeightChange={setCustomizerHeight}
        />

        {/* AI Chat - Fixed Position (handles its own responsive positioning) */}
        <AIChat
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
          upperHasGradient={upperHasGradient}
          soleHasGradient={soleHasGradient}
          upperGradientColor1={upperGradientColor1}
          upperGradientColor2={upperGradientColor2}
          soleGradientColor1={soleGradientColor1}
          soleGradientColor2={soleGradientColor2}
          onUpperGradientToggle={setUpperHasGradient}
          onSoleGradientToggle={setSoleHasGradient}
          onUpperGradientColor1Change={setUpperGradientColor1}
          onUpperGradientColor2Change={setUpperGradientColor2}
          onSoleGradientColor1Change={setSoleGradientColor1}
          onSoleGradientColor2Change={setSoleGradientColor2}
          upperTexture={upperTexture}
          soleTexture={soleTexture}
          onUpperTextureChange={setUpperTexture}
          onSoleTextureChange={setSoleTexture}
          isDarkMode={isDarkMode}
          // ColorCustomizer height for positioning
          customizerHeight={customizerHeight}
        />

        {/* Debug Menu 
        <DebugMenu
          visible={debugVisible}
          onToggleVisibility={() => setDebugVisible(!debugVisible)}
          onHotspotAdd={handleHotspotAdd}
          onCameraPositionSet={handleCameraPositionSet}
          cameraInfo={cameraInfo}
          onCameraReset={handleCameraReset}
          onGoToHotspot={handleGoToHotspot}
          onLogoPlacementModeToggle={handleLogoPlacementModeToggle}
          logoPlacementMode={logoPlacementMode}
          onLogoPositionSet={handleLogoPositionSet}
          onLogoRotationSet={handleLogoRotationSet}
          logoPosition={logoPosition}
          logoRotation={logoRotation}
        /> */}
      </ErrorBoundary>
    </div>
  );
};