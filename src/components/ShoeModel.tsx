import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Mesh, Group, AnimationMixer, Box3, Vector3, MeshStandardMaterial, Texture, CanvasTexture, Material } from 'three';
import { useGLTF, useBounds } from '@react-three/drei';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ShoeModelProps {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onPartClick?: (partType: 'upper' | 'sole') => void;
  scale?: number;
  bottomColor?: string;
  topColor?: string;
  upperHasSplatter?: boolean;
  soleHasSplatter?: boolean;
  upperSplatterColor?: string;
  soleSplatterColor?: string;
  upperPaintDensity?: number;
  solePaintDensity?: number;
}

const MODEL_URL = 'https://1ykb2g02vo.ufs.sh/f/vZDRAlpZjEG4wM9tSdrXd4TzClS20xUyGWEH19i8nmkPheoJ';

// Configure DRACO loader for optimized loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

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
  upperPaintDensity = 50,
  solePaintDensity = 50
}) => {
  const groupRef = useRef<Group>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const bounds = useBounds();
  const originalMaterialsRef = useRef<Map<string, MeshStandardMaterial>>(new Map());
  const currentMaterialsRef = useRef<Map<string, MeshStandardMaterial>>(new Map());
  const textureCache = useRef<Map<string, Texture>>(new Map());

  // Load the model with DRACO compression support
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      MODEL_URL,
      (loadedGltf) => {
        try {
          // Center and scale the model
          const box = new Box3().setFromObject(loadedGltf.scene);
          const center = box.getCenter(new Vector3());
          const size = box.getSize(new Vector3());

          // Scale to fit in view
          const maxDim = Math.max(size.x, size.y, size.z);
          const scaleFactor = 2 / maxDim;

          loadedGltf.scene.scale.setScalar(scaleFactor);
          loadedGltf.scene.position.set(0, 0.1, 0); // Place on ground
          loadedGltf.scene.position.sub(center.multiplyScalar(scaleFactor));

          // Enable shadows and store original materials for color changes
          loadedGltf.scene.traverse((child) => {
            if (child instanceof Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              // Store original material for texture preservation
              if (child.material && child.name) {
                const originalMaterial = child.material.clone();
                originalMaterialsRef.current.set(child.name, originalMaterial);
              }

              // Add interaction data
              child.userData = {
                name: child.name || 'shoe-part',
                interactive: true
              };
            }
          });

          // Setup animations if available
          if (loadedGltf.animations && loadedGltf.animations.length > 0) {
            const mixer = new AnimationMixer(loadedGltf.scene);
            loadedGltf.animations.forEach((clip) => {
              const action = mixer.clipAction(clip);
              action.play();
            });
            mixerRef.current = mixer;
          }

          setGltf(loadedGltf);
          onLoad?.();
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error('Failed to process model'));
        }
      },
      (progress) => {
        // Loading progress - could be used for progress bar
        const percentComplete = (progress.loaded / progress.total) * 100;
        console.log(`Loading progress: ${percentComplete.toFixed(2)}%`);
      },
      (error) => {
        onError?.(error instanceof Error ? error : new Error('Failed to load model'));
      }
    );

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
      
      // Clear original materials
      originalMaterialsRef.current.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
      originalMaterialsRef.current.clear();
    };
  }, [onLoad, onError]);

  // Memoized splatter texture creation with caching
  const createSplatterTexture = useCallback((baseColor: string, splatterColor: string, isUpper: boolean = false, paintDensity: number = 50): Texture => {
    // Create cache key
    const cacheKey = `${baseColor}-${splatterColor}-${isUpper}-${paintDensity}`;
    
    // Check cache first
    if (textureCache.current.has(cacheKey)) {
      return textureCache.current.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 512; // Reduced from 1024 for better performance
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Fill base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Calculate number of splatters based on density
    const baseSplatters = isUpper ? 2500 : 1500; // Reduced for performance
    const numSplatters = Math.floor((baseSplatters * paintDensity) / 50);

    // Adjusted for smaller canvas
    const minRadius = isUpper ? 0.2 : 0.5;
    const maxRadius = isUpper ? 0.8 : 1.5;

    ctx.globalCompositeOperation = 'source-over';

    for (let i = 0; i < numSplatters; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const radius = minRadius + Math.random() * (maxRadius - minRadius);

      ctx.globalAlpha = 0.8 + Math.random() * 0.2;
      ctx.fillStyle = splatterColor;
      ctx.imageSmoothingEnabled = false;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new CanvasTexture(canvas);
    texture.generateMipmaps = true; // Enable mipmaps for better performance
    texture.needsUpdate = true;

    // Cache the texture
    textureCache.current.set(cacheKey, texture);
    
    return texture;
  }, []);

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

    // Clean up previous materials
    cleanupMaterials();

    gltf.scene.traverse((child) => {
      if (child instanceof Mesh && child.name) {
        const isBottomPart = child.name.includes('bottom') || child.name.includes('sole');
        const isTopPart = child.name.includes('top') || child.name.includes('upper');

        // Get the original material for this part
        const originalMaterial = originalMaterialsRef.current.get(child.name);
        let material: MeshStandardMaterial;

        if (isBottomPart) {
          // Reuse existing material if possible
          const existingMaterial = currentMaterialsRef.current.get(child.name);
          if (existingMaterial) {
            material = existingMaterial;
          } else {
            material = new MeshStandardMaterial({
              roughness: 0.9,
              metalness: 0.05,
            });
            currentMaterialsRef.current.set(child.name, material);
          }

          if (soleHasSplatter) {
            // Dispose old texture if it exists
            if (material.map && material.map !== originalMaterial?.map) {
              material.map.dispose();
            }
            material.map = createSplatterTexture(bottomColor, soleSplatterColor, false, solePaintDensity);
            material.roughness = 0.95;
          } else {
            // Dispose splatter texture if switching back to solid color
            if (material.map && material.map !== originalMaterial?.map) {
              material.map.dispose();
              material.map = null;
            }
            material.color.set(bottomColor);
          }

          child.material = material;
        } else if (isTopPart) {
          // Reuse existing material if possible
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

          if (upperHasSplatter) {
            // Dispose old texture if it's not the original
            if (material.map && material.map !== originalMaterial?.map) {
              material.map.dispose();
            }
            material.map = createSplatterTexture(topColor, upperSplatterColor, true, upperPaintDensity);
          } else {
            // Restore original texture or use solid color
            if (material.map && material.map !== originalMaterial?.map) {
              material.map.dispose();
            }
            material.map = originalMaterial?.map || null;
            material.color.set(topColor);
            
            // Ensure original texture is properly linked
            if (originalMaterial?.map) {
              material.map = originalMaterial.map;
              material.map.needsUpdate = true;
            }
          }

          material.needsUpdate = true;
          child.material = material;
        }
      }
    });

    // Cleanup function for this effect
    return () => {
      // Don't cleanup here as materials are still in use
    };
  }, [gltf, bottomColor, topColor, upperHasSplatter, soleHasSplatter, upperSplatterColor, soleSplatterColor, upperPaintDensity, solePaintDensity, createSplatterTexture, cleanupMaterials]);

  // Animation frame loop
  useFrame((state, delta) => {
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

    if (event.object && event.object.userData) {
      // Determine part type and notify parent
      if (event.object.name) {
        const isBottomPart = event.object.name.includes('bottom') || event.object.name.includes('sole');
        const isTopPart = event.object.name.includes('top') || event.object.name.includes('upper');

        if (isBottomPart && onPartClick) {
          onPartClick('sole');
        } else if (isTopPart && onPartClick) {
          onPartClick('upper');
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
      position={[0, 0, 0]}
    >
      <primitive
        object={gltf.scene}
        dispose={null}
      />
    </group>
  );
};

// Preload the model for better performance
useGLTF.preload(MODEL_URL);