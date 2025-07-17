import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, PlaneGeometry, MeshStandardMaterial, TextureLoader, Texture, DoubleSide, Group } from 'three';
import { useLoader } from '@react-three/fiber';

interface JibbitLogoProps {
  logoUrl?: string | null;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  visible?: boolean;
}

export const JibbitLogo: React.FC<JibbitLogoProps> = ({
  logoUrl = null,
  position = [0.8, 0.2, 0.35], // Default position on the side of the upper
  rotation = [Math.PI / 2, -0.3, 0], // Rotate 90 degrees around X-axis to lay flat against surface
  scale = 0.10,
  visible = true
}) => {
  const groupRef = useRef<Group>(null);
  const [texture, setTexture] = useState<Texture | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load texture when logoUrl changes
  useEffect(() => {
    if (!logoUrl) {
      setTexture(null);
      return;
    }

    console.log('Loading logo:', logoUrl);
    setIsLoading(true);

    // Create texture from data URL or regular URL
    if (logoUrl.startsWith('data:')) {
      // Handle data URL (uploaded image)
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Set canvas size to maintain aspect ratio
        const maxSize = 256;
        const aspectRatio = img.width / img.height;

        if (aspectRatio > 1) {
          canvas.width = maxSize;
          canvas.height = maxSize / aspectRatio;
        } else {
          canvas.width = maxSize * aspectRatio;
          canvas.height = maxSize;
        }

        // Draw image with transparent background support
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Create texture from canvas
        const canvasTexture = new Texture(canvas);
        canvasTexture.needsUpdate = true;
        canvasTexture.generateMipmaps = true;

        setTexture(canvasTexture);
        setIsLoading(false);
        console.log('Logo loaded successfully (data URL)');
      };

      img.onerror = () => {
        console.error('Failed to load logo image (data URL)');
        setIsLoading(false);
      };

      img.src = logoUrl;
    } else {
      // Handle regular URL (including SVGs) - try direct TextureLoader first for external URLs
      console.log('Attempting to load external URL with TextureLoader:', logoUrl);
      
      const loader = new TextureLoader();
      loader.load(
        logoUrl,
        (loadedTexture) => {
          // Successfully loaded with TextureLoader
          setTexture(loadedTexture);
          setIsLoading(false);
          console.log('Logo loaded successfully (TextureLoader)');
        },
        undefined,
        (loaderError) => {
          console.log('TextureLoader failed, trying Image approach:', loaderError);
          
          // Fallback to Image approach without crossOrigin for external URLs
          const img = new Image();
          // Don't set crossOrigin for external URLs to avoid CORS issues
          
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d')!;

              // Set canvas size to maintain aspect ratio
              const maxSize = 256;
              const aspectRatio = img.width / img.height;

              if (aspectRatio > 1) {
                canvas.width = maxSize;
                canvas.height = maxSize / aspectRatio;
              } else {
                canvas.width = maxSize * aspectRatio;
                canvas.height = maxSize;
              }

              // Draw image
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

              // Create texture from canvas
              const canvasTexture = new Texture(canvas);
              canvasTexture.needsUpdate = true;
              canvasTexture.generateMipmaps = true;

              setTexture(canvasTexture);
              setIsLoading(false);
              console.log('Logo loaded successfully (Image fallback)');
            } catch (canvasError) {
              console.error('Canvas drawing failed:', canvasError);
              setIsLoading(false);
            }
          };

          img.onerror = (imgError) => {
            console.error('All methods failed to load logo:', imgError);
            setIsLoading(false);
          };

          img.src = logoUrl;
        }
      );
    }
  }, [logoUrl]);

  // Remove floating animation - keep logo static
  useFrame(() => {
    if (groupRef.current && visible) {
      // Keep logo at exact position without any animation
      groupRef.current.position.set(position[0], position[1], position[2]);
    }
  });

  // Don't render if no logo or not visible
  if (!visible || !logoUrl || !texture) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={[scale, scale, scale]}
    >
      {/* Base layer - slightly recessed */}
      <mesh
        position={[0, 0, -0.02]}
        castShadow
        receiveShadow={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          alphaTest={0.1}
          roughness={0.4}
          metalness={0.1}
          opacity={0.8}
        />
      </mesh>

      {/* Middle layer - main logo */}
      <mesh
        position={[0, 0, 0]}
        castShadow
        receiveShadow={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          alphaTest={0.1}
          roughness={0.3}
          metalness={0.2}
          emissive="#111111"
          emissiveIntensity={0.02}
        />
      </mesh>

      {/* Top layer - raised highlight */}
      <mesh
        position={[0, 0, 0.05]}
        castShadow
        receiveShadow={false}
      >
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent={true}
          alphaTest={0.1}
          roughness={0.0}
          metalness={0.5}
          emissive="#222222"
          emissiveIntensity={0.15}
          opacity={0.9}
        />
      </mesh>
    </group>
  );
};