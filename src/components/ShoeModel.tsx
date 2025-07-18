import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { Mesh, Group, AnimationMixer, Box3, Vector3, MeshStandardMaterial, Texture, CanvasTexture } from 'three';
import { useGLTF, useBounds } from '@react-three/drei';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { JibbitLogo } from './JibbitLogo';

interface ShoeModelProps {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onPartClick?: (partType: 'upper' | 'sole' | 'laces' | 'logos') => void;
  scale?: number;
  bottomColor?: string;
  topColor?: string;
  upperHasSplatter?: boolean;
  soleHasSplatter?: boolean;
  upperSplatterColor?: string;
  soleSplatterColor?: string;
  upperPaintDensity?: number;
  solePaintDensity?: number;
  // Gradient props
  upperHasGradient?: boolean;
  soleHasGradient?: boolean;
  upperGradientColor1?: string;
  upperGradientColor2?: string;
  soleGradientColor1?: string;
  soleGradientColor2?: string;
  // Texture props
  upperTexture?: string | null;
  soleTexture?: string | null;
  // Lace and logo colors (single color for both left and right)
  laceColor?: string;
  logoColor?: string;
  // Logo props
  logoUrl?: string | null;
  logoPosition?: [number, number, number];
  logoRotation?: [number, number, number];
  logoPlacementMode?: boolean;
  onLogoPositionSet?: (position: [number, number, number], normal: [number, number, number]) => void;
  // Second logo props
  logo2Position?: [number, number, number];
  logo2Rotation?: [number, number, number];
}

const MODEL_URL = 'https://1ykb2g02vo.ufs.sh/f/vZDRAlpZjEG4zYRgLNVdU2gXuRI1OWCsNc53biYrh6QpG4Ae';

// Configure DRACO loader for optimized loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

// Global preloaded model cache to prevent stuttering
let preloadedModel: GLTF | null = null;
let preloadPromise: Promise<GLTF> | null = null;

// Preload function that ensures model is ready before use
const preloadModel = (): Promise<GLTF> => {
  if (preloadedModel) {
    return Promise.resolve(preloadedModel);
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      MODEL_URL,
      (gltf) => {
        // Process the model immediately upon loading
        const box = new Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new Vector3());
        const size = box.getSize(new Vector3());

        // Scale to fit in view
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 2 / maxDim;

        gltf.scene.scale.setScalar(scaleFactor);
        gltf.scene.position.set(0, 0.2, 0);
        gltf.scene.position.sub(center.multiplyScalar(scaleFactor));

        // Enable shadows and prepare for interaction
        gltf.scene.traverse((child) => {
          if (child instanceof Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData = {
              name: child.name || 'shoe-part',
              interactive: true
            };
          }
        });

        preloadedModel = gltf;
        resolve(gltf);
      },
      undefined,
      reject
    );
  });

  return preloadPromise;
};

export const ShoeModel: React.FC<ShoeModelProps> = ({
  onLoad,
  onError,
  onPartClick,
  scale = 1,
  bottomColor = '#2d5016',
  topColor = '#8b4513',
  upperHasSplatter = false,
  soleHasSplatter = false,
  upperSplatterColor = '#f8f8ff',
  soleSplatterColor = '#f8f8f8ff',
  upperPaintDensity = 100,
  solePaintDensity = 100,
  // Gradient props with defaults
  upperHasGradient = false,
  soleHasGradient = false,
  upperGradientColor1 = '#4a8c2b',
  upperGradientColor2 = '#c25d1e',
  soleGradientColor1 = '#4a8c2b',
  soleGradientColor2 = '#c25d1e',
  // Texture props with defaults
  upperTexture = null,
  soleTexture = null,
  // Lace and logo colors with defaults (single color for both left and right)
  laceColor = '#FFFFFF',
  logoColor = '#FFFFFF',
  // Logo props with defaults
  logoUrl = null,
  logoPosition = [.8, 0.2, 0.5],

  logoRotation = [0, -0.3, 0],
  logoPlacementMode = false,
  onLogoPositionSet,
  // Second logo props with defaults
  logo2Position = [-0.631, 0.163, -0.488],
  logo2Rotation = [1.163, -1.905, 1.183]
}) => {
  const groupRef = useRef<Group>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const bounds = useBounds();
  const originalMaterialsRef = useRef<Map<string, MeshStandardMaterial>>(new Map());
  const currentMaterialsRef = useRef<Map<string, MeshStandardMaterial>>(new Map());
  const textureCache = useRef<Map<string, Texture>>(new Map());
  const laceTextureRef = useRef<Texture | null>(null);

  // Use preloaded model to prevent stuttering during animations
  useEffect(() => {
    preloadModel()
      .then((loadedGltf) => {
        try {
          // Clone the preloaded model to avoid conflicts between instances
          const clonedGltf = {
            ...loadedGltf,
            scene: loadedGltf.scene.clone()
          };

          // Store original materials and apply them immediately for color changes
          clonedGltf.scene.traverse((child) => {
            if (child instanceof Mesh && child.material && child.name) {
              const originalMaterial = child.material.clone();
              originalMaterialsRef.current.set(child.name, originalMaterial);

              // Immediately apply the original material with proper settings
              // This ensures textures are visible from the start
              const material = originalMaterial.clone();
              material.needsUpdate = true;
              child.material = material;
              currentMaterialsRef.current.set(child.name, material);
            }
          });

          // Setup animations if available
          if (loadedGltf.animations && loadedGltf.animations.length > 0) {
            const mixer = new AnimationMixer(clonedGltf.scene);
            loadedGltf.animations.forEach((clip) => {
              const action = mixer.clipAction(clip);
              action.play();
            });
            mixerRef.current = mixer;
          }

          setGltf(clonedGltf);
          onLoad?.();
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error('Failed to process model'));
        }
      })
      .catch((error) => {
        onError?.(error instanceof Error ? error : new Error('Failed to load model'));
      });

    return () => {
      // Cleanup
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current = null;
      }

      // Clean up current materials and textures
      currentMaterialsRef.current.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
      currentMaterialsRef.current.clear();

      // Clear texture cache
      textureCache.current.forEach((texture) => texture.dispose());
      textureCache.current.clear();

      // Clear lace texture
      if (laceTextureRef.current) {
        laceTextureRef.current.dispose();
        laceTextureRef.current = null;
      }

      // Clear original materials
      originalMaterialsRef.current.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
      originalMaterialsRef.current.clear();
    };
  }, [onLoad, onError]);



  // Memoized gradient paint texture creation - like painting over the shoe
  const createGradientTexture = useCallback((baseColor: string, color1: string, color2: string, isUpper: boolean = false): Texture => {
    // Create cache key
    const cacheKey = `gradient-paint-${baseColor}-${color1}-${color2}-${isUpper}`;

    // Check cache first
    if (textureCache.current.has(cacheKey)) {
      return textureCache.current.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Enable anti-aliasing for smooth gradients
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Start with the base color as background
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 1024, 1024);

    // Create gradient paint effect - like brush strokes
    const numStrokes = isUpper ? 150 : 100; // More strokes for upper

    for (let i = 0; i < numStrokes; i++) {
      // Calculate gradient position (0 to 1)
      const gradientPos = i / numStrokes;

      // Interpolate between colors
      const r1 = parseInt(color1.slice(1, 3), 16);
      const g1 = parseInt(color1.slice(3, 5), 16);
      const b1 = parseInt(color1.slice(5, 7), 16);
      const r2 = parseInt(color2.slice(1, 3), 16);
      const g2 = parseInt(color2.slice(3, 5), 16);
      const b2 = parseInt(color2.slice(5, 7), 16);

      const r = Math.round(r1 + (r2 - r1) * gradientPos);
      const g = Math.round(g1 + (g2 - g1) * gradientPos);
      const b = Math.round(b1 + (b2 - b1) * gradientPos);

      const strokeColor = `rgb(${r}, ${g}, ${b})`;

      // Create paint stroke areas
      const strokeWidth = isUpper ? 15 + Math.random() * 25 : 20 + Math.random() * 30;
      const strokeHeight = isUpper ? 8 + Math.random() * 15 : 12 + Math.random() * 20;

      // Position strokes to create gradient flow
      const x = isUpper
        ? (gradientPos * 900) + Math.random() * 124 // Diagonal flow for upper
        : Math.random() * 1024; // Random horizontal for sole
      const y = isUpper
        ? (gradientPos * 900) + Math.random() * 124 // Diagonal flow for upper  
        : (gradientPos * 900) + Math.random() * 124; // Vertical flow for sole

      // Vary opacity for natural paint look
      ctx.globalAlpha = 0.3 + Math.random() * 0.4;
      ctx.fillStyle = strokeColor;

      // Create organic paint stroke shapes
      ctx.beginPath();
      const numPoints = 6 + Math.floor(Math.random() * 4);
      const angleStep = (Math.PI * 2) / numPoints;

      for (let j = 0; j < numPoints; j++) {
        const angle = j * angleStep + (Math.random() - 0.5) * 0.8;
        const radiusX = strokeWidth * (0.7 + Math.random() * 0.6);
        const radiusY = strokeHeight * (0.7 + Math.random() * 0.6);
        const pointX = x + Math.cos(angle) * radiusX;
        const pointY = y + Math.sin(angle) * radiusY;

        if (j === 0) {
          ctx.moveTo(pointX, pointY);
        } else {
          // Use bezier curves for smooth paint strokes
          const prevAngle = (j - 1) * angleStep + (Math.random() - 0.5) * 0.8;
          const prevRadiusX = strokeWidth * (0.7 + Math.random() * 0.6);
          const prevRadiusY = strokeHeight * (0.7 + Math.random() * 0.6);
          const prevX = x + Math.cos(prevAngle) * prevRadiusX;
          const prevY = y + Math.sin(prevAngle) * prevRadiusY;

          const cp1X = prevX + Math.cos(prevAngle + Math.PI / 2) * strokeWidth * 0.3;
          const cp1Y = prevY + Math.sin(prevAngle + Math.PI / 2) * strokeHeight * 0.3;
          const cp2X = pointX + Math.cos(angle - Math.PI / 2) * strokeWidth * 0.3;
          const cp2Y = pointY + Math.sin(angle - Math.PI / 2) * strokeHeight * 0.3;

          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, pointX, pointY);
        }
      }

      ctx.closePath();
      ctx.fill();
    }

    // Reset alpha
    ctx.globalAlpha = 1.0;

    const texture = new CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    // Cache the texture
    textureCache.current.set(cacheKey, texture);

    return texture;
  }, []);

  // Create texture from base64 data URL (for AI-generated textures)
  const createTextureFromDataUrl = useCallback((dataUrl: string): Texture => {
    const cacheKey = `ai-texture-${dataUrl.substring(0, 50)}`;

    // Check cache first
    if (textureCache.current.has(cacheKey)) {
      return textureCache.current.get(cacheKey)!;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Use higher resolution for better quality
    const canvas = document.createElement('canvas');
    canvas.width = 2048;  // Increased from 1024
    canvas.height = 2048; // Increased from 1024
    const ctx = canvas.getContext('2d')!;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Create texture immediately with placeholder
    const texture = new CanvasTexture(canvas);

    // Enhanced texture settings for better quality
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16; // Maximum anisotropic filtering
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.needsUpdate = true;

    // Load the image and update texture
    img.onload = () => {
      // Clear canvas with transparent background
      ctx.clearRect(0, 0, 2048, 2048);

      // Draw image at full resolution with high quality
      ctx.drawImage(img, 0, 0, 2048, 2048);

      // Apply sharpening filter to enhance details
      const imageData = ctx.getImageData(0, 0, 2048, 2048);
      const data = imageData.data;

      // Simple sharpening kernel to enhance texture details
      const sharpenKernel = [
        0, -0.25, 0,
        -0.25, 2, -0.25,
        0, -0.25, 0
      ];

      const sharpened = new Uint8ClampedArray(data.length);
      const width = 2048;
      const height = 2048;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) { // RGB channels only
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                sum += data[idx] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const idx = (y * width + x) * 4 + c;
            sharpened[idx] = Math.max(0, Math.min(255, sum));
          }
          // Copy alpha channel unchanged
          const idx = (y * width + x) * 4 + 3;
          sharpened[idx] = data[idx];
        }
      }

      // Apply sharpened data back to canvas
      const sharpenedImageData = new ImageData(sharpened, width, height);
      ctx.putImageData(sharpenedImageData, 0, 0);

      texture.needsUpdate = true;
    };

    img.src = dataUrl;

    // Cache the texture
    textureCache.current.set(cacheKey, texture);

    return texture;
  }, []);

  // Create inner shadow texture for sole parts
  const createInnerShadowTexture = useCallback((baseColor: string): Texture => {
    const cacheKey = `inner-shadow-${baseColor}`;

    // Check cache first
    if (textureCache.current.has(cacheKey)) {
      return textureCache.current.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Start with the base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 1024, 1024);

    // Create radial gradient for inner shadow effect
    // This simulates the natural shadowing that occurs inside a shoe sole
    const centerX = 512;
    const centerY = 400; // Slightly higher to simulate the arch area
    const innerRadius = 150;
    const outerRadius = 450;

    // Create multiple shadow layers for realistic depth
    const shadowLayers = [
      { radius: outerRadius, opacity: 0.15, color: '#000000' },
      { radius: outerRadius * 0.8, opacity: 0.12, color: '#000000' },
      { radius: outerRadius * 0.6, opacity: 0.08, color: '#000000' },
      { radius: outerRadius * 0.4, opacity: 0.05, color: '#000000' }
    ];

    shadowLayers.forEach(layer => {
      const gradient = ctx.createRadialGradient(
        centerX, centerY, innerRadius,
        centerX, centerY, layer.radius
      );
      
      gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
      gradient.addColorStop(0.3, `rgba(0, 0, 0, ${layer.opacity * 0.3})`);
      gradient.addColorStop(0.7, `rgba(0, 0, 0, ${layer.opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${layer.opacity})`);

      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);
    });

    // Add additional shadow areas to simulate the natural contours of a sole
    ctx.globalCompositeOperation = 'multiply';
    
    // Heel shadow area
    const heelGradient = ctx.createRadialGradient(512, 800, 50, 512, 800, 200);
    heelGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    heelGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.08)');
    heelGradient.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
    ctx.fillStyle = heelGradient;
    ctx.fillRect(0, 0, 1024, 1024);

    // Toe shadow area
    const toeGradient = ctx.createRadialGradient(512, 200, 50, 512, 200, 180);
    toeGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    toeGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.06)');
    toeGradient.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
    ctx.fillStyle = toeGradient;
    ctx.fillRect(0, 0, 1024, 1024);

    // Side shadows for depth
    const leftSideGradient = ctx.createLinearGradient(0, 0, 200, 0);
    leftSideGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    leftSideGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
    leftSideGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = leftSideGradient;
    ctx.fillRect(0, 0, 1024, 1024);

    const rightSideGradient = ctx.createLinearGradient(1024, 0, 824, 0);
    rightSideGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    rightSideGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.05)');
    rightSideGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = rightSideGradient;
    ctx.fillRect(0, 0, 1024, 1024);

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    const texture = new CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    // Cache the texture
    textureCache.current.set(cacheKey, texture);

    return texture;
  }, []);

  // Memoized splatter texture creation with caching
  const createSplatterTexture = useCallback((baseColor: string, splatterColor: string, isUpper: boolean = false, paintDensity: number = 20): Texture => {
    // Create cache key
    const cacheKey = `${baseColor}-${splatterColor}-${isUpper}-${paintDensity}`;

    // Check cache first
    if (textureCache.current.has(cacheKey)) {
      return textureCache.current.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Higher resolution for smoother speckles
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Enable anti-aliasing for smooth edges
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Use the base color directly (user should select darkened color from palette)
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 1024, 1024);

    // Calculate number of splatters based on density
    const baseSplatters = isUpper ? 2000 : 1000;
    const numSplatters = Math.floor((baseSplatters * paintDensity) / 10);

    // Adjusted for higher resolution canvas
    const minRadius = isUpper ? 0.05 : 0.1; // Even smaller minimum radius for tiny dots
    const maxRadius = isUpper ? 1.0 : 1.5; // Reduced maximum size further
    ctx.globalCompositeOperation = 'source-over';

    for (let i = 0; i < numSplatters; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      
      // Use stronger exponential distribution to heavily favor smaller dots
      const sizeRandom = Math.pow(Math.random(), 3.5);
      const baseSize = minRadius + sizeRandom * (maxRadius - minRadius);

      // Use varying opacity for more natural look
      ctx.globalAlpha = 0.7 + Math.random() * 0.3;
      ctx.fillStyle = splatterColor;

      ctx.beginPath();

      // Create smooth circular speckles with slight variations
      const variation = 0.8 + Math.random() * 0.4; // Size variation
      const radius = baseSize * variation;

      // Add slight irregularity to make it more organic
      const numPoints = 8 + Math.floor(Math.random() * 4); // 8-12 points for smooth but slightly irregular circles
      const angleStep = (Math.PI * 2) / numPoints;

      for (let j = 0; j < numPoints; j++) {
        const angle = j * angleStep;
        const radiusVariation = 0.9 + Math.random() * 0.2; // Subtle radius variation
        const pointRadius = radius * radiusVariation;
        const pointX = x + Math.cos(angle) * pointRadius;
        const pointY = y + Math.sin(angle) * pointRadius;

        if (j === 0) {
          ctx.moveTo(pointX, pointY);
        } else {
          // Use bezier curves for ultra-smooth edges
          const prevAngle = (j - 1) * angleStep;
          const prevRadius = radius * (0.9 + Math.random() * 0.2);
          const prevX = x + Math.cos(prevAngle) * prevRadius;
          const prevY = y + Math.sin(prevAngle) * prevRadius;

          // Control points for smooth bezier curve
          const cp1X = prevX + Math.cos(prevAngle + Math.PI / 2) * radius * 0.2;
          const cp1Y = prevY + Math.sin(prevAngle + Math.PI / 2) * radius * 0.2;
          const cp2X = pointX + Math.cos(angle - Math.PI / 2) * radius * 0.2;
          const cp2Y = pointY + Math.sin(angle - Math.PI / 2) * radius * 0.2;

          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, pointX, pointY);
        }
      }

      ctx.closePath();
      ctx.fill();

      // Add subtle shadow/depth effect for some speckles
      if (Math.random() < 0.3) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x + 0.5, y + 0.5, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new CanvasTexture(canvas);
    texture.generateMipmaps = true; // Enable mipmaps for better performance
    texture.needsUpdate = true;

    // Cache the texture
    textureCache.current.set(cacheKey, texture);

    return texture;
  }, []);

  // Load lace texture and cache it
  const loadLaceTexture = useCallback((): Promise<Texture> => {
    return new Promise((resolve, reject) => {
      if (laceTextureRef.current) {
        resolve(laceTextureRef.current);
        return;
      }

      const loader = new THREE.TextureLoader();
      loader.load(
        '/lace_texture.png',
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;

          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.needsUpdate = true;

          laceTextureRef.current = texture;
          resolve(texture);
        },
        undefined,
        (error) => {
          console.warn('Failed to load lace texture:', error);
          reject(error);
        }
      );
    });
  }, []);

  // Create lace material with color and texture overlay
  const createLaceTexture = useCallback((baseColor: string): Texture => {
    const cacheKey = `lace-${baseColor}`;

    // Check cache first
    if (textureCache.current.has(cacheKey)) {
      return textureCache.current.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Fill with the base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    // Load the lace texture and overlay it
    loadLaceTexture().then((laceTexture) => {
      // Create a temporary canvas to combine textures
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 512;
      tempCanvas.height = 512;
      const tempCtx = tempCanvas.getContext('2d')!;

      // Enable high-quality rendering
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';

      // Draw the base color
      tempCtx.fillStyle = baseColor;
      tempCtx.fillRect(0, 0, 512, 512);

      // Create an image from the lace texture
      const laceImage = new Image();
      laceImage.crossOrigin = 'anonymous';

      // Convert the lace texture to a data URL
      const laceCanvas = document.createElement('canvas');
      laceCanvas.width = laceTexture.image.width;
      laceCanvas.height = laceTexture.image.height;
      const laceCtx = laceCanvas.getContext('2d')!;
      laceCtx.drawImage(laceTexture.image, 0, 0);

      laceImage.onload = () => {
        // Use screen blend mode to overlay white lace texture on colored base
        // This preserves the white texture details while showing the base color
        tempCtx.globalCompositeOperation = 'screen';
        tempCtx.globalAlpha = 0.7; // Adjust opacity for realistic blend

        // Draw the lace texture tiled across the canvas
        const tileSize = 128; // Size of each tile
        for (let x = 0; x < 512; x += tileSize) {
          for (let y = 0; y < 512; y += tileSize) {
            tempCtx.drawImage(laceImage, x, y, tileSize, tileSize);
          }
        }

        // Reset blend mode and alpha
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.globalAlpha = 1.0;

        // Update the main texture with the combined result
        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(tempCanvas, 0, 0);
        texture.needsUpdate = true;
      };

      laceImage.src = laceCanvas.toDataURL();
    }).catch((error) => {
      console.warn('Could not apply lace texture overlay:', error);
      // Fallback to solid color if texture loading fails
    });

    // Cache the texture
    textureCache.current.set(cacheKey, texture);

    return texture;
  }, [loadLaceTexture]);

  // Cleanup function for materials and textures
  const cleanupMaterials = useCallback(() => {
    currentMaterialsRef.current.forEach((material) => {
      if (material.map) material.map.dispose();
      material.dispose();
    });
    currentMaterialsRef.current.clear();
  }, []);

  // Update colors when they change with proper memory management
  useEffect(() => {
    if (!gltf) return;

    // Don't cleanup materials immediately - let them finish rendering first
    const materialsToCleanup: MeshStandardMaterial[] = [];

    gltf.scene.traverse((child) => {
      if (child instanceof Mesh && child.name) {
        // Log ALL part names to see what's actually in the model
        console.log('Model part found:', child.name);

        const isBottomPart = child.name.includes('bottom') || child.name.includes('sole');
        const isTopPart = child.name.includes('top') || child.name.includes('upper');

        // VERY comprehensive lace and logo detection
        const lowerName = child.name.toLowerCase();

        // Lace detection - check for many possible variations
        const isLeftLace = (lowerName.includes('lace') || lowerName.includes('string') || lowerName.includes('cord') || lowerName.includes('tie')) &&
          (lowerName.includes('left') || lowerName.includes('l_') || lowerName.includes('_l') || lowerName.includes('001'));
        const isRightLace = (lowerName.includes('lace') || lowerName.includes('string') || lowerName.includes('cord') || lowerName.includes('tie')) &&
          (lowerName.includes('right') || lowerName.includes('r_') || lowerName.includes('_r') || lowerName.includes('002'));
        const isLace = lowerName.includes('lace') || lowerName.includes('string') || lowerName.includes('shoelace') ||
          lowerName.includes('cord') || lowerName.includes('tie') || lowerName.includes('eyelet');

        // Logo detection - check for many possible variations  
        const isLeftLogo = (lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') || lowerName.includes('swoosh') || lowerName.includes('mark')) &&
          (lowerName.includes('left') || lowerName.includes('l_') || lowerName.includes('_l') || lowerName.includes('001'));
        const isRightLogo = (lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') || lowerName.includes('swoosh') || lowerName.includes('mark')) &&
          (lowerName.includes('right') || lowerName.includes('r_') || lowerName.includes('_r') || lowerName.includes('002'));
        const isLogo = lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') ||
          lowerName.includes('swoosh') || lowerName.includes('mark') || lowerName.includes('badge');

        // Debug logging for lace/logo parts
        if (isLace || isLogo || isLeftLace || isRightLace || isLeftLogo || isRightLogo) {
          console.log('🎯 FOUND LACE/LOGO PART:', child.name, {
            isLace, isLogo, isLeftLace, isRightLace, isLeftLogo, isRightLogo
          });
        }

        // Get the original material for this part
        const originalMaterial = originalMaterialsRef.current.get(child.name);
        let material: MeshStandardMaterial;

        if (isBottomPart) {
          // Get or create material for this part
          const existingMaterial = currentMaterialsRef.current.get(child.name);
          if (existingMaterial) {
            material = existingMaterial;
            // Store old material for cleanup later
            if (child.material !== material) {
              materialsToCleanup.push(child.material as MeshStandardMaterial);
            }
          } else {
            material = new MeshStandardMaterial({
              roughness: 0.9,
              metalness: 0.05,
            });
            currentMaterialsRef.current.set(child.name, material);
            // Store old material for cleanup later
            if (child.material) {
              materialsToCleanup.push(child.material as MeshStandardMaterial);
            }
          }

          // Add inner shadow effect for sole parts
          // This creates a darker shadow on the inside/top of the sole
          material.transparent = true;
          material.opacity = 0.95;

          // Update material properties without disposing textures immediately
          if (soleTexture) {
            const newTexture = createTextureFromDataUrl(soleTexture);
            if (material.map !== newTexture) {
              material.map = newTexture;
              material.roughness = 0.4; // Reduced for more vibrant appearance
              material.metalness = 0.1; // Slight metalness for better reflections
              material.color.setHex(0xffffff); // Ensure white base color for texture
              material.needsUpdate = true;
            }
          } else if (soleHasGradient) {
            const newTexture = createGradientTexture(bottomColor, soleGradientColor1, soleGradientColor2, false);
            if (material.map !== newTexture) {
              material.map = newTexture;
              material.roughness = 0.8;
              material.needsUpdate = true;
            }
          } else if (soleHasSplatter) {
            const newTexture = createSplatterTexture(bottomColor, soleSplatterColor, false, solePaintDensity);
            if (material.map !== newTexture) {
              material.map = newTexture;
              material.roughness = 0.95;
              material.needsUpdate = true;
            }
          } else {
            // Solid color mode with inner shadow
            const shadowTexture = createInnerShadowTexture(bottomColor);
            if (material.map !== shadowTexture) {
              material.map = shadowTexture;
              material.roughness = 0.9;
              material.metalness = 0.05;
              material.color.setHex(0xffffff); // White base to let texture show through
              material.needsUpdate = true;
            }
          }

          // Only assign material if it's different to prevent flashing
          if (child.material !== material) {
            child.material = material;
          }
        } else if (isTopPart) {
          // Always use the existing material if it exists, otherwise create new one
          const existingMaterial = currentMaterialsRef.current.get(child.name);
          if (existingMaterial) {
            material = existingMaterial;
          } else {
            // Clone original material to preserve original textures and properties
            material = originalMaterial ? originalMaterial.clone() : new MeshStandardMaterial();
            material.roughness = 1;
            material.metalness = 0;
            currentMaterialsRef.current.set(child.name, material);
          }

          // Store old material for cleanup later only if it's different
          if (child.material && child.material !== material) {
            materialsToCleanup.push(child.material as MeshStandardMaterial);
          }

          // Update material properties without disposing textures immediately
          if (upperTexture) {
            const newTexture = createTextureFromDataUrl(upperTexture);
            if (material.map !== newTexture) {
              material.map = newTexture;
              material.roughness = 0.4; // Reduced for more vibrant appearance
              material.metalness = 0.1; // Slight metalness for better reflections
              material.color.setHex(0xffffff); // Ensure white base color for texture
              material.needsUpdate = true;
            }
          } else if (upperHasGradient) {
            const newTexture = createGradientTexture(topColor, upperGradientColor1, upperGradientColor2, true);
            if (material.map !== newTexture) {
              material.map = newTexture;
              material.roughness = 0.8;
              material.needsUpdate = true;
            }
          } else if (upperHasSplatter) {
            const newTexture = createSplatterTexture(topColor, upperSplatterColor, true, upperPaintDensity);
            if (material.map !== newTexture) {
              material.map = newTexture;
              material.roughness = 0.95;
              material.needsUpdate = true;
            }
          } else {
            // Solid color mode - ALWAYS preserve original texture and tint it
            const originalTexture = originalMaterial?.map || null;
            if (material.map !== originalTexture) {
              material.map = originalTexture;
              material.needsUpdate = true;
            }
            // Tint the original texture with the selected color
            material.color.set(topColor);
            // Ensure proper material properties for texture visibility
            if (originalTexture) {
              material.roughness = originalMaterial?.roughness ?? 0.8;
              material.metalness = originalMaterial?.metalness ?? 0.1;
            }
          }

          // Only assign material if it's different to prevent flashing
          if (child.material !== material) {
            child.material = material;
          }
        } else if (isLeftLace || isRightLace || isLace) {
          // Handle ALL laces (left, right, or generic) - Apply color with lace texture overlay
          console.log('Applying lace color and texture to:', child.name, 'Color:', laceColor);

          // Get or create material for this part
          const existingMaterial = currentMaterialsRef.current.get(child.name);
          if (existingMaterial) {
            material = existingMaterial;
            // Store old material for cleanup later
            if (child.material !== material) {
              materialsToCleanup.push(child.material as MeshStandardMaterial);
            }
          } else {
            material = new MeshStandardMaterial({
              roughness: 0.6,
              metalness: 0.1,
            });
            currentMaterialsRef.current.set(child.name, material);
            // Store old material for cleanup later
            if (child.material) {
              materialsToCleanup.push(child.material as MeshStandardMaterial);
            }
          }

          // Apply lace texture with color overlay
          const laceTexture = createLaceTexture(laceColor);
          if (material.map !== laceTexture) {
            material.map = laceTexture;
            material.color.setHex(0xffffff); // White base to let texture show through
            material.needsUpdate = true;
          }

          // Only assign material if it's different to prevent flashing
          if (child.material !== material) {
            child.material = material;
          }

        } else if (isLeftLogo || isRightLogo || isLogo) {
          // Handle ALL logos (left, right, or generic) - FORCE solid color only
          console.log('Applying logo color to:', child.name, 'Color:', logoColor);

          // Always create a completely fresh material to avoid any texture inheritance
          material = new MeshStandardMaterial({
            roughness: 0.3,
            metalness: 0.2,
            color: logoColor,
            map: null, // Force no texture
          });

          // Store old material for cleanup
          if (child.material) {
            materialsToCleanup.push(child.material as MeshStandardMaterial);
          }

          // Always assign the new material
          child.material = material;
          currentMaterialsRef.current.set(child.name, material);
        }
      }
    });

    // Schedule cleanup of old materials after a delay to prevent flashing
    if (materialsToCleanup.length > 0) {
      const timeoutId = setTimeout(() => {
        materialsToCleanup.forEach((material) => {
          if (material && material.map && !originalMaterialsRef.current.has(material.uuid)) {
            // Only dispose textures that aren't original or currently in use
            const isInUse = Array.from(currentMaterialsRef.current.values()).some(
              currentMat => currentMat.map === material.map
            );
            if (!isInUse) {
              material.map.dispose();
            }
          }
          if (material) {
            material.dispose();
          }
        });
      }, 100); // Small delay to ensure rendering is complete

      return () => {
        clearTimeout(timeoutId);
      };
    }

    // Cleanup function for this effect
    return () => {
      // Don't cleanup here as materials are still in use
    };
  }, [gltf, bottomColor, topColor, upperHasSplatter, soleHasSplatter, upperSplatterColor, soleSplatterColor, upperPaintDensity, solePaintDensity, upperHasGradient, soleHasGradient, upperGradientColor1, upperGradientColor2, soleGradientColor1, soleGradientColor2, upperTexture, soleTexture, laceColor, logoColor, createSplatterTexture, createGradientTexture, createTextureFromDataUrl, createLaceTexture, cleanupMaterials]);

  // Animation frame loop
  useFrame((_state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    if (groupRef.current) {
      // Apply scale
      groupRef.current.scale.setScalar(scale);
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();

    // Handle logo placement mode
    if (logoPlacementMode && onLogoPositionSet && event.point && event.face) {
      const position: [number, number, number] = [
        Math.round(event.point.x * 1000) / 1000,
        Math.round(event.point.y * 1000) / 1000,
        Math.round(event.point.z * 1000) / 1000
      ];

      const normal: [number, number, number] = [
        Math.round(event.face.normal.x * 1000) / 1000,
        Math.round(event.face.normal.y * 1000) / 1000,
        Math.round(event.face.normal.z * 1000) / 1000
      ];

      console.log('Logo placement click:', { position, normal, objectName: event.object?.name });
      onLogoPositionSet(position, normal);
      return;
    }

    if (event.object && event.object.userData) {
      // Determine part type and notify parent
      if (event.object.name) {
        const isBottomPart = event.object.name.includes('bottom') || event.object.name.includes('sole');
        const isTopPart = event.object.name.includes('top') || event.object.name.includes('upper');

        // Use the SAME comprehensive detection logic as in material application
        const lowerName = event.object.name.toLowerCase();

        // Lace detection - check for many possible variations (same as material logic)
        const isLeftLace = (lowerName.includes('lace') || lowerName.includes('string') || lowerName.includes('cord') || lowerName.includes('tie')) &&
          (lowerName.includes('left') || lowerName.includes('l_') || lowerName.includes('_l') || lowerName.includes('001'));
        const isRightLace = (lowerName.includes('lace') || lowerName.includes('string') || lowerName.includes('cord') || lowerName.includes('tie')) &&
          (lowerName.includes('right') || lowerName.includes('r_') || lowerName.includes('_r') || lowerName.includes('002'));
        const isLace = lowerName.includes('lace') || lowerName.includes('string') || lowerName.includes('shoelace') ||
          lowerName.includes('cord') || lowerName.includes('tie') || lowerName.includes('eyelet');

        // Logo detection - check for many possible variations (same as material logic)
        const isLeftLogo = (lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') || lowerName.includes('swoosh') || lowerName.includes('mark')) &&
          (lowerName.includes('left') || lowerName.includes('l_') || lowerName.includes('_l') || lowerName.includes('001'));
        const isRightLogo = (lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') || lowerName.includes('swoosh') || lowerName.includes('mark')) &&
          (lowerName.includes('right') || lowerName.includes('r_') || lowerName.includes('_r') || lowerName.includes('002'));
        const isLogo = lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') ||
          lowerName.includes('swoosh') || lowerName.includes('mark') || lowerName.includes('badge');

        // Debug logging for clicks
        if (isLace || isLogo || isLeftLace || isRightLace || isLeftLogo || isRightLogo) {
          console.log('🖱️ CLICKED LACE/LOGO PART:', event.object.name, {
            isLace, isLogo, isLeftLace, isRightLace, isLeftLogo, isRightLogo
          });
        }

        if (isBottomPart && onPartClick) {
          onPartClick('sole');
        } else if (isTopPart && onPartClick) {
          onPartClick('upper');
        } else if ((isLeftLace || isRightLace || isLace) && onPartClick) {
          onPartClick('laces');
        } else if ((isLeftLogo || isRightLogo || isLogo) && onPartClick) {
          onPartClick('logos');
        }
      }

      // Visual feedback for clicked part
      if (event.object.material) {
        const originalEmissive = event.object.material.emissive?.clone();
        event.object.material.emissive?.setHex(0x444444);

        setTimeout(() => {
          if (originalEmissive && event.object.material.emissive) {
            event.object.material.emissive.copy(originalEmissive);
          }
        }, 200);
      }

      // Fit the clicked part in view
      if (bounds && event.object) {
        bounds.refresh(event.object).fit();
      }
    }
  };

  const handlePointerOver = (event: any) => {
    document.body.style.cursor = 'pointer';

    // Highlight hovered part
    if (event.object && event.object.material) {
      event.object.material.emissive?.setHex(0x222222);
    }
  };

  const handlePointerOut = (event: any) => {
    document.body.style.cursor = 'auto';

    // Remove highlight
    if (event.object && event.object.material) {
      event.object.material.emissive?.setHex(0x000000);
    }
  };

  if (!gltf) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      position={[0, .27, 0]}
    >
      <primitive
        object={gltf.scene}
        dispose={null}
      />
      {/* First Jibbit Logo */}
      <JibbitLogo
        logoUrl={logoUrl}
        position={logoPosition}
        rotation={logoRotation}
        scale={0.15}
        visible={!!logoUrl}
      />
      {/* Second Jibbit Logo */}
      <JibbitLogo
        logoUrl={logoUrl}
        position={logo2Position}
        rotation={logo2Rotation}
        scale={0.15}
        visible={!!logoUrl}
      />
    </group>
  );
};

// Preload the model for better performance using both methods
useGLTF.preload(MODEL_URL);

// Start preloading immediately when module loads to prevent any stuttering
preloadModel().catch(console.error);