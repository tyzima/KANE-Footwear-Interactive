import React, { Suspense, useState, useRef, useEffect } from 'react';
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
import { useTheme } from '@/hooks/use-theme';
import { useColorways } from '@/hooks/useColorways';

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

// Define breakpoints for responsive design
const DESKTOP_BREAKPOINT = 768;
const DESKTOP_ZOOM = 0.8;
const MOBILE_ZOOM = 0.6;


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
    if (backgroundType === 'turf') {
      // Load forest/turf image as background
      const loader = new THREE.TextureLoader();
      loader.load(
        '/rogland_moonlit_night.jpg',
        (texture) => {
          // Configure texture for background
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(1, 1);
          texture.offset.set(0, 0);
          
          // Enhance texture quality and color
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.anisotropy = 16; // Maximum anisotropic filtering for better quality
          texture.colorSpace = THREE.SRGBColorSpace; // Ensure proper color space
          
          // Create a sphere geometry for the background
          const geometry = new THREE.SphereGeometry(10, 12, 32);
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            // Enhance color saturation and contrast
            color: new THREE.Color(1.2, 1.2, 1.2), // Brighten the texture
            transparent: false,
            opacity: 1.0
          });
          
          // Remove existing background
          scene.background = null;
          
          // Remove existing background sphere if it exists
          const existingBackground = scene.getObjectByName('backgroundSphere');
          if (existingBackground) {
            scene.remove(existingBackground);
          }
          
          // Create new background sphere
          const backgroundSphere = new THREE.Mesh(geometry, material);
          backgroundSphere.name = 'backgroundSphere';
          scene.add(backgroundSphere);
        },
        undefined,
        (error) => {
          console.warn('Failed to load forest background image, falling back to solid color:', error);
          // Fallback to solid color if image fails to load
          scene.background = new THREE.Color('#1b4f2a');
        }
      );
    } else {
      // Remove background sphere for non-turf backgrounds
      const existingBackground = scene.getObjectByName('backgroundSphere');
      if (existingBackground) {
        scene.remove(existingBackground);
      }
      
      // Set solid color background
      let backgroundColor: string;
      switch (backgroundType) {
        case 'dark':
          backgroundColor = '#1a1a1a';
          break;
        case 'light':
        default:
          backgroundColor = '#f8f9fa';
          break;
      }
      scene.background = new THREE.Color(backgroundColor);
    }
  }, [scene, backgroundType]);

  return null;
};

interface ShoeViewerProps {
  className?: string;
  backgroundType?: 'light' | 'dark' | 'turf';
  onBackgroundTypeChange?: (type: 'light' | 'dark' | 'turf') => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  onColorConfigurationChange?: (config: any) => void;
  colorConfiguration?: any;
  onSelectedColorwayChange?: (colorway: any) => void; // External color configuration to apply (for shared designs)
  productContext?: {
    productId: string;
    shop: string;
    isCustomerEmbed: boolean;
    title?: string;
    handle?: string;
  } | null;
}

export const ShoeViewer: React.FC<ShoeViewerProps> = ({
  className = '',
  backgroundType: externalBackgroundType = 'light',
  onBackgroundTypeChange,
  canvasRef,
  onColorConfigurationChange,
  colorConfiguration: externalColorConfiguration,
  onSelectedColorwayChange,
  productContext
}) => {
  const { isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  
  // Responsive zoom state
  const [zoom, setZoom] = useState(
    typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT ? DESKTOP_ZOOM : MOBILE_ZOOM
  );

  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [bottomColor, setBottomColor] = useState('#2d5016'); // Forest Green
  const [topColor, setTopColor] = useState('#8b4513'); // Redwood
  const [upperHasSplatter, setUpperHasSplatter] = useState(false);
  const [soleHasSplatter, setSoleHasSplatter] = useState(false);
  const [upperSplatterColor, setUpperSplatterColor] = useState('#f8f8ff'); // Glacier White
  const [soleSplatterColor, setSoleSplatterColor] = useState('#f8f8ff'); // Glacier White
  const [upperSplatterColor2, setUpperSplatterColor2] = useState<string | null>(null);
  const [soleSplatterColor2, setSoleSplatterColor2] = useState<string | null>(null);
  const [upperSplatterBaseColor, setUpperSplatterBaseColor] = useState<string | null>(null);
  const [soleSplatterBaseColor, setSoleSplatterBaseColor] = useState<string | null>(null);
  const [upperUseDualSplatter, setUpperUseDualSplatter] = useState(false);
  const [soleUseDualSplatter, setSoleUseDualSplatter] = useState(false);
  const [upperPaintDensity, setUpperPaintDensity] = useState(500); // 50% default
  const [solePaintDensity, setSolePaintDensity] = useState(500); // 50% default
  const [activeColorTab, setActiveColorTab] = useState<'colorways' | 'logos'>('colorways');
  
  // Dynamic colorways from Shopify (use customer API for embeds)
  const isCustomerContext = productContext?.isCustomerEmbed || false;
  const shopDomain = productContext?.shop;
  const { colorways, isLoading: colorwaysLoading, error: colorwaysError, isUsingDynamicData } = useColorways(shopDomain, isCustomerContext);
  
  // Filter colorways based on product context (for customer embeds)
  const availableColorways = React.useMemo(() => {
    if (productContext?.isCustomerEmbed && productContext.productId && isUsingDynamicData) {
      // For customer embeds, filter to show only colorways for this specific product
      const productColorways = colorways.filter(colorway => 
        colorway.id.includes(`product-${productContext.productId}`) ||
        colorway.id === `product-${productContext.productId}` ||
        colorway.productId === productContext.productId
      );
      
      console.log('Customer embed colorway filtering:', {
        productId: productContext.productId,
        allColorways: colorways.length,
        filteredColorways: productColorways.length,
        productColorways: productColorways.map(c => ({ id: c.id, name: c.name }))
      });
      
      // If we found product-specific colorways, use them; otherwise fallback to all colorways
      return productColorways.length > 0 ? productColorways : colorways;
    }
    
    // For admin or standalone use, show all colorways
    return colorways;
  }, [colorways, productContext, isUsingDynamicData]);
  
  // Colorway state
  const [selectedColorwayId, setSelectedColorwayId] = useState('classic-forest');
  
  // Get current colorway data from available colorways
  const selectedColorway = availableColorways.find(c => c.id === selectedColorwayId) || availableColorways[0];

  // Handle colorway changes
  const handleColorwayChange = (colorway: any) => {
    setSelectedColorwayId(colorway.id);
    // Update splatter base colors from the colorway
    setUpperSplatterBaseColor(colorway.upper.splatterBaseColor);
    setSoleSplatterBaseColor(colorway.sole.splatterBaseColor);
    // Update dual splatter colors and settings
    setUpperSplatterColor2(colorway.upper.splatterColor2);
    setSoleSplatterColor2(colorway.sole.splatterColor2);
    setUpperUseDualSplatter(colorway.upper.useDualSplatter);
    setSoleUseDualSplatter(colorway.sole.useDualSplatter);
    // The ColorCustomizer will handle updating the individual color states
  };

  // ColorCustomizer height tracking for AIChat positioning
  const [customizerHeight, setCustomizerHeight] = useState(100);

  // Lace and logo colors (single color for both left and right)
  const [laceColor, setLaceColor] = useState('#FFFFFF');
  // Logo colors - now supporting 3 separate colors  
  const [logoColor1, setLogoColor1] = useState('#2048FF'); // Blue parts (Royal Blue)
  const [logoColor2, setLogoColor2] = useState('#000000'); // Black parts  
  const [logoColor3, setLogoColor3] = useState('#C01030'); // Red parts (Crimson)

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

  // Logo state (Jibbit logos)
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPlacementMode, setLogoPlacementMode] = useState(false);
  const [logoPosition, setLogoPosition] = useState<[number, number, number]>([0.668, 0.159, -0.490]);
  const [logoRotation, setLogoRotation] = useState<[number, number, number]>([1.171, -4.300, -1.100]);

  // Circle logo state (for SVG texture)
  const [circleLogoUrl, setCircleLogoUrl] = useState<string | null>(null);

  // Second logo state
  const [logo2Position, setLogo2Position] = useState<[number, number, number]>([-0.661, 0.163, -0.488]);
  const [logo2Rotation, setLogo2Rotation] = useState<[number, number, number]>([1.163, -1.905, 1.183]);

  // Apply external color configuration (for shared designs)
  useEffect(() => {
    if (externalColorConfiguration) {
      console.log('Applying external color configuration:', externalColorConfiguration);
      
      // Apply upper/top colors
      if (externalColorConfiguration.upper?.baseColor) {
        setTopColor(externalColorConfiguration.upper.baseColor);
      }
      if (externalColorConfiguration.upper?.hasSplatter !== undefined) {
        setUpperHasSplatter(externalColorConfiguration.upper.hasSplatter);
      }
      if (externalColorConfiguration.upper?.splatterColor) {
        setUpperSplatterColor(externalColorConfiguration.upper.splatterColor);
      }
      if (externalColorConfiguration.upper?.splatterColor2 !== undefined) {
        setUpperSplatterColor2(externalColorConfiguration.upper.splatterColor2);
      }
      if (externalColorConfiguration.upper?.splatterBaseColor !== undefined) {
        setUpperSplatterBaseColor(externalColorConfiguration.upper.splatterBaseColor);
      }
      if (externalColorConfiguration.upper?.useDualSplatter !== undefined) {
        setUpperUseDualSplatter(externalColorConfiguration.upper.useDualSplatter);
      }
      if (externalColorConfiguration.upper?.hasGradient !== undefined) {
        setUpperHasGradient(externalColorConfiguration.upper.hasGradient);
      }
      if (externalColorConfiguration.upper?.gradientColor1) {
        setUpperGradientColor1(externalColorConfiguration.upper.gradientColor1);
      }
      if (externalColorConfiguration.upper?.gradientColor2) {
        setUpperGradientColor2(externalColorConfiguration.upper.gradientColor2);
      }
      if (externalColorConfiguration.upper?.texture !== undefined) {
        setUpperTexture(externalColorConfiguration.upper.texture);
      }
      if (externalColorConfiguration.upper?.paintDensity !== undefined) {
        setUpperPaintDensity(externalColorConfiguration.upper.paintDensity);
      }

      // Apply sole/bottom colors
      if (externalColorConfiguration.sole?.baseColor) {
        setBottomColor(externalColorConfiguration.sole.baseColor);
      }
      if (externalColorConfiguration.sole?.hasSplatter !== undefined) {
        setSoleHasSplatter(externalColorConfiguration.sole.hasSplatter);
      }
      if (externalColorConfiguration.sole?.splatterColor) {
        setSoleSplatterColor(externalColorConfiguration.sole.splatterColor);
      }
      if (externalColorConfiguration.sole?.splatterColor2 !== undefined) {
        setSoleSplatterColor2(externalColorConfiguration.sole.splatterColor2);
      }
      if (externalColorConfiguration.sole?.splatterBaseColor !== undefined) {
        setSoleSplatterBaseColor(externalColorConfiguration.sole.splatterBaseColor);
      }
      if (externalColorConfiguration.sole?.useDualSplatter !== undefined) {
        setSoleUseDualSplatter(externalColorConfiguration.sole.useDualSplatter);
      }
      if (externalColorConfiguration.sole?.hasGradient !== undefined) {
        setSoleHasGradient(externalColorConfiguration.sole.hasGradient);
      }
      if (externalColorConfiguration.sole?.gradientColor1) {
        setSoleGradientColor1(externalColorConfiguration.sole.gradientColor1);
      }
      if (externalColorConfiguration.sole?.gradientColor2) {
        setSoleGradientColor2(externalColorConfiguration.sole.gradientColor2);
      }
      if (externalColorConfiguration.sole?.texture !== undefined) {
        setSoleTexture(externalColorConfiguration.sole.texture);
      }
      if (externalColorConfiguration.sole?.paintDensity !== undefined) {
        setSolePaintDensity(externalColorConfiguration.sole.paintDensity);
      }

      // Apply lace colors
      if (externalColorConfiguration.laces?.color) {
        setLaceColor(externalColorConfiguration.laces.color);
      }

      // Apply logo colors
      if (externalColorConfiguration.logos?.color1) {
        setLogoColor1(externalColorConfiguration.logos.color1);
      }
      if (externalColorConfiguration.logos?.color2) {
        setLogoColor2(externalColorConfiguration.logos.color2);
      }
      if (externalColorConfiguration.logos?.color3) {
        setLogoColor3(externalColorConfiguration.logos.color3);
      }
      if (externalColorConfiguration.logos?.logoUrl !== undefined) {
        setLogoUrl(externalColorConfiguration.logos.logoUrl);
      }
      if (externalColorConfiguration.logos?.circleLogoUrl !== undefined) {
        setCircleLogoUrl(externalColorConfiguration.logos.circleLogoUrl);
      }
    }
  }, [externalColorConfiguration]);

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

  // Effect to handle responsive zoom
  useEffect(() => {
    const handleResize = () => {
      const newZoom = window.innerWidth >= DESKTOP_BREAKPOINT ? DESKTOP_ZOOM : MOBILE_ZOOM;
      setZoom(newZoom);
    };

    window.addEventListener('resize', handleResize);
    // Call handler right away so state is correct on initial render
    handleResize(); 

    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect is only run on mount and unmount

  // Function to get current color configuration
  const getColorConfiguration = () => {
    return {
      upper: {
        baseColor: topColor,
        hasSplatter: upperHasSplatter,
        splatterColor: upperSplatterColor,
        splatterColor2: upperSplatterColor2,
        splatterBaseColor: upperSplatterBaseColor,
        useDualSplatter: upperUseDualSplatter,
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
        splatterColor2: soleSplatterColor2,
        splatterBaseColor: soleSplatterBaseColor,
        useDualSplatter: soleUseDualSplatter,
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
        color1: logoColor1,
        color2: logoColor2,
        color3: logoColor3,
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
    topColor, bottomColor, laceColor, logoColor1, logoColor2, logoColor3,
    upperHasSplatter, soleHasSplatter, upperSplatterColor, soleSplatterColor,
    upperSplatterColor2, soleSplatterColor2, upperSplatterBaseColor, soleSplatterBaseColor,
    upperUseDualSplatter, soleUseDualSplatter, upperPaintDensity, solePaintDensity,
    upperHasGradient, soleHasGradient,
    upperGradientColor1, upperGradientColor2, soleGradientColor1, soleGradientColor2,
    upperTexture, soleTexture, logoUrl, logoPosition, logoRotation,
    onColorConfigurationChange
  ]);

  // Effect to initialize splatter base colors from selected colorway
  useEffect(() => {
    setUpperSplatterBaseColor(selectedColorway.upper.splatterBaseColor);
    setSoleSplatterBaseColor(selectedColorway.sole.splatterBaseColor);
    setUpperSplatterColor2(selectedColorway.upper.splatterColor2);
    setSoleSplatterColor2(selectedColorway.sole.splatterColor2);
    setUpperUseDualSplatter(selectedColorway.upper.useDualSplatter);
    setSoleUseDualSplatter(selectedColorway.sole.useDualSplatter);
    
    // Notify parent component about colorway change
    if (onSelectedColorwayChange) {
      onSelectedColorwayChange(selectedColorway);
    }
  }, [selectedColorway, onSelectedColorwayChange]);

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
      // Reset to the appropriate zoom level based on screen size
      const newZoom = window.innerWidth >= DESKTOP_BREAKPOINT ? DESKTOP_ZOOM : MOBILE_ZOOM;
      handleZoomChange(newZoom);
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
    // Map all part clicks to colorways tab since we now use colorway system
    setActiveColorTab('colorways');
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
      const newZoom = window.innerWidth >= DESKTOP_BREAKPOINT ? DESKTOP_ZOOM : MOBILE_ZOOM;
      setZoom(newZoom);
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
    <div className={`relative w-full h-full bg-gradient-viewer overflow-hidden ${className}`}>
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
            useHDRI={backgroundType === 'turf'}
            hdriPath={backgroundType === 'turf' ? '/rogland_moonlit_night.jpg' : undefined}
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
              upperSplatterColor2={upperSplatterColor2}
              soleSplatterColor2={soleSplatterColor2}
              upperSplatterBaseColor={upperSplatterBaseColor}
              soleSplatterBaseColor={soleSplatterBaseColor}
              upperUseDualSplatter={upperUseDualSplatter}
              soleUseDualSplatter={soleUseDualSplatter}
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
              logoColor1={logoColor1}
              logoColor2={logoColor2}
              logoColor3={logoColor3}
              // Circle logo prop
              circleLogoUrl={circleLogoUrl}
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
            <div className="text-center p-6 bg-card border border-destructive">
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
        <div className="absolute top-12 md:top-32  right-8 hidden md:block">
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
        <div className="absolute top-32 right-8 z-9990 md:hidden">
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
          selectedColorwayId={selectedColorwayId}
          onColorwayChange={handleColorwayChange}
          topColor={topColor}
          bottomColor={bottomColor}
          onTopColorChange={setTopColor}
          onBottomColorChange={setBottomColor}
          upperHasSplatter={upperHasSplatter}
          soleHasSplatter={soleHasSplatter}
          upperSplatterColor={upperSplatterColor}
          soleSplatterColor={soleSplatterColor}
          upperSplatterColor2={upperSplatterColor2}
          soleSplatterColor2={soleSplatterColor2}
          upperSplatterBaseColor={upperSplatterBaseColor}
          soleSplatterBaseColor={soleSplatterBaseColor}
          upperUseDualSplatter={upperUseDualSplatter}
          soleUseDualSplatter={soleUseDualSplatter}
          upperPaintDensity={upperPaintDensity}
          solePaintDensity={solePaintDensity}
          onUpperSplatterToggle={setUpperHasSplatter}
          onSoleSplatterToggle={setSoleHasSplatter}
          onUpperSplatterColorChange={setUpperSplatterColor}
          onSoleSplatterColorChange={setSoleSplatterColor}
          onUpperSplatterColor2Change={setUpperSplatterColor2}
          onSoleSplatterColor2Change={setSoleSplatterColor2}
          onUpperUseDualSplatterChange={setUpperUseDualSplatter}
          onSoleUseDualSplatterChange={setSoleUseDualSplatter}
          onUpperPaintDensityChange={setUpperPaintDensity}
          onSolePaintDensityChange={setSolePaintDensity}
          activeTab={activeColorTab}
          onTabChange={setActiveColorTab}
          // Lace and logo colors
          laceColor={laceColor}
          onLaceColorChange={setLaceColor}
          // Logo colors - now supporting 3 separate colors
          logoColor1={logoColor1}
          logoColor2={logoColor2}
          logoColor3={logoColor3}
          onLogoColor1Change={setLogoColor1}
          onLogoColor2Change={setLogoColor2}
          onLogoColor3Change={setLogoColor3}
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
          // Circle logo props
          circleLogoUrl={circleLogoUrl}
          onCircleLogoChange={setCircleLogoUrl}
          // Dark mode
          isDarkMode={isDarkMode}
          // Height callback for AIChat positioning
          onHeightChange={setCustomizerHeight}
          // Product context for customer embeds
          productContext={productContext}
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
