import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader
} from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Mesh, Group, AnimationMixer, Box3, Vector3, MeshStandardMaterial, Texture, CanvasTexture } from 'three';
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

const MODEL_URL = 'https://1ykb2g02vo.ufs.sh/f/vZDRAlpZjEG4foxLh8y6DeirLamH7Y1SBOW8l6CycoPdFvg4';

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
  const [isHovered, setIsHovered] = useState(false);
  const [clickedPart, setClickedPart] = useState<string | null>(null);
  const bounds = useBounds();
  const originalMaterialsRef = useRef<Map<string, MeshStandardMaterial>>(new Map());

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
      }
    };
  }, [onLoad, onError]);

  // Create ultra-dense, high-resolution splatter texture
  const createSplatterTexture = (baseColor: string, splatterColor: string, isUpper: boolean = false, paintDensity: number = 50): Texture => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Doubled resolution for sharper detail
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Fill base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 1024, 1024);

    // Calculate number of splatters based on density (10% = 1000, 100% = 10000, 200% = 20000)
    const baseSplatters = isUpper ? 5000 : 3000;
    const numSplatters = Math.floor((baseSplatters * paintDensity) / 50); // 50% = base amount

    // Sharper, smaller dots for higher resolution
    const minRadius = isUpper ? 0.4 : 1.0; // Doubled for higher res canvas
    const maxRadius = isUpper ? 1.6 : 3.0; // Doubled for higher res canvas

    // Use source-over blend mode and full opacity for splatter to ensure visibility
    ctx.globalCompositeOperation = 'source-over';

    for (let i = 0; i < numSplatters; i++) {
      // Random position across entire canvas
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;

      // Size variation based on part type
      const radius = minRadius + Math.random() * (maxRadius - minRadius);

      // Use full opacity for splatter color to ensure it shows on any background
      ctx.globalAlpha = 0.8 + Math.random() * 0.2; // High opacity (80-100%)
      ctx.fillStyle = splatterColor; // Set color for each dot to ensure consistency

      // Create sharper edges with no anti-aliasing
      ctx.imageSmoothingEnabled = false;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new CanvasTexture(canvas);
    texture.generateMipmaps = false; // Disable mipmaps for sharper texture
    texture.minFilter = 1003; // NearestFilter for sharp pixels
    texture.magFilter = 1003; // NearestFilter for sharp pixels

    return texture;
  };

  // Update colors when they change
  useEffect(() => {
    if (!gltf) return;

    gltf.scene.traverse((child) => {
      if (child instanceof Mesh && child.name) {
        const isBottomPart = child.name === 'shoe_left_bottom' || child.name === 'shoe_right_bottom';
        const isTopPart = child.name === 'shoe_left_top' || child.name === 'shoe_right_top';

        // Get the original material for this part
        const originalMaterial = originalMaterialsRef.current.get(child.name);

        if (isBottomPart) {
          // Create material with or without splatter for bottom parts (old way)
          const material = new MeshStandardMaterial({
            roughness: 0.9, // Higher roughness to reduce shine
            metalness: 0.05, // Lower metalness
          });

          if (soleHasSplatter) {
            material.map = createSplatterTexture(bottomColor, soleSplatterColor, false, solePaintDensity);
            material.roughness = 0.95; // Even higher roughness for splatter
          } else {
            material.color.set(bottomColor);
          }

          child.material = material;
        } else if (isTopPart) {
          // Clone the original material to preserve textures
          const material = originalMaterial ? originalMaterial.clone() : new MeshStandardMaterial();

          // Make upper completely matte: max roughness, no metalness
          material.roughness = 1;
          material.metalness = 0;

          if (upperHasSplatter) {
            // Apply splatter texture over the original
            material.map = createSplatterTexture(topColor, upperSplatterColor, true, upperPaintDensity);
          } else {
            // Preserve original texture but tint it with the selected color
            material.color.set(topColor);
            // Keep original map if it exists
            if (originalMaterial?.map) {
              material.map = originalMaterial.map;
              // Ensure the texture is properly configured for color multiplication
              material.map.needsUpdate = true;
            }
          }

          // Force material update
          material.needsUpdate = true;

          child.material = material;
        }
      }
    });
  }, [gltf, bottomColor, topColor, upperHasSplatter, soleHasSplatter, upperSplatterColor, soleSplatterColor, upperPaintDensity, solePaintDensity]);

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
      const partName = event.object.userData.name;
      setClickedPart(partName);

      // Determine part type and notify parent
      if (event.object.name) {
        const isBottomPart = event.object.name === 'shoe_left_bottom' || event.object.name === 'shoe_right_bottom';
        const isTopPart = event.object.name === 'shoe_left_top' || event.object.name === 'shoe_right_top';

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
          setClickedPart(null);
        }, 200);
      }

      // Fit the clicked part in view
      if (bounds && event.object) {
        bounds.refresh(event.object).fit();
      }
    }
  };

  const handlePointerOver = (event: any) => {
    setIsHovered(true);
    document.body.style.cursor = 'pointer';

    // Highlight hovered part
    if (event.object && event.object.material) {
      event.object.material.emissive?.setHex(0x222222);
    }
  };

  const handlePointerOut = (event: any) => {
    setIsHovered(false);
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