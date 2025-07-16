import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Mesh, Group, AnimationMixer, Box3, Vector3 } from 'three';
import { useGLTF, useBounds } from '@react-three/drei';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ShoeModelProps {
  onLoad?: () => void;
  onError?: (error: Error) => void;
  scale?: number;
}

const MODEL_URL = 'https://1ykb2g02vo.ufs.sh/f/vZDRAlpZjEG4foxLh8y6DeirLamH7Y1SBOW8l6CycoPdFvg4';

// Configure DRACO loader for optimized loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

export const ShoeModel: React.FC<ShoeModelProps> = ({ 
  onLoad, 
  onError, 
  scale = 1 
}) => {
  const groupRef = useRef<Group>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [clickedPart, setClickedPart] = useState<string | null>(null);
  const bounds = useBounds();

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
          loadedGltf.scene.position.sub(center.multiplyScalar(scaleFactor));
          
          // Enable shadows
          loadedGltf.scene.traverse((child) => {
            if (child instanceof Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
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

  // Animation frame loop
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }

    if (groupRef.current) {
      // Gentle floating animation when not interacting
      if (!isHovered && !clickedPart) {
        groupRef.current.rotation.y += delta * 0.1;
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
      }

      // Apply scale
      groupRef.current.scale.setScalar(scale);
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    
    if (event.object && event.object.userData) {
      const partName = event.object.userData.name;
      setClickedPart(partName);
      
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