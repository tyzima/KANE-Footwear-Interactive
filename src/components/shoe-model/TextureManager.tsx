import React, { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { Texture, CanvasTexture } from 'three';
import { useColorProcessor } from './ColorProcessor';

interface TextureManagerProps {
    children: (textureManager: {
        createGradientTexture: (baseColor: string, color1: string, color2: string, isUpper: boolean) => Texture;
        createTextureFromDataUrl: (dataUrl: string) => Texture;
        createInnerShadowTexture: (baseColor: string) => Texture;
        createSplatterTexture: (baseColor: string, splatterColor: string, splatterBaseColor: string | null, splatterColor2: string | null, useDualSplatter: boolean, isUpper: boolean, paintDensity: number) => Texture;
        createLaceTexture: (baseColor: string) => Texture;
        loadLaceTexture: () => Promise<Texture>;
        getOrCreateAndUpdateLogoTexture: (partName: string, material: any, originalTexture: Texture | null, colors: { color1: string; color2: string; color3: string }, userLogoUrl: string | null) => void;
        cleanup: () => void;
    }) => React.ReactNode;
}

export const TextureManager: React.FC<TextureManagerProps> = ({ children }) => {
    const textureCache = useRef<Map<string, Texture>>(new Map());
    const laceTextureRef = useRef<Texture | null>(null);
    const logoTexturesRef = useRef<Map<string, CanvasTexture>>(new Map());
    const logoUpdateTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    
    const { darkenLightMaterials } = useColorProcessor();

    // Memoized gradient paint texture creation - like painting over the shoe
    const createGradientTexture = useCallback((baseColor: string, color1: string, color2: string, isUpper: boolean = false): Texture => {
        // Apply darkening to light colors to prevent overexposure
        const adjustedBaseColor = darkenLightMaterials(baseColor);
        const adjustedColor1 = darkenLightMaterials(color1);
        const adjustedColor2 = darkenLightMaterials(color2);
        // Create cache key
        const cacheKey = `gradient-paint-${adjustedBaseColor}-${adjustedColor1}-${adjustedColor2}-${isUpper}`;

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

        // Start with the adjusted base color as background
        ctx.fillStyle = adjustedBaseColor;
        ctx.fillRect(0, 0, 1024, 1024);

        // Create gradient paint effect - like brush strokes
        const numStrokes = isUpper ? 150 : 100; // More strokes for upper

        for (let i = 0; i < numStrokes; i++) {
            // Calculate gradient position (0 to 1)
            const gradientPos = i / numStrokes;

            // Interpolate between adjusted colors
            const r1 = parseInt(adjustedColor1.slice(1, 3), 16);
            const g1 = parseInt(adjustedColor1.slice(3, 5), 16);
            const b1 = parseInt(adjustedColor1.slice(5, 7), 16);
            const r2 = parseInt(adjustedColor2.slice(1, 3), 16);
            const g2 = parseInt(adjustedColor2.slice(3, 5), 16);
            const b2 = parseInt(adjustedColor2.slice(5, 7), 16);

            const r = Math.round(r1 + (r2 - r1) * gradientPos);
            const g = Math.round(g1 + (g2 - g1) * gradientPos);
            const b = Math.round(b1 + (b2 - b1) * gradientPos);

            const strokeColor = `rgb(${r}, ${g}, ${b})`;

            // Create paint stroke areas
            const strokeWidth = isUpper ? 15 + Math.random() * 25 : 20 + Math.random() * 30;
            const strokeHeight = isUpper ? 8 + Math.random() * 15 : 12 + Math.random() * 20;

            // Position strokes to create gradient flow
            const x = isUpper ?
                (gradientPos * 900) + Math.random() * 124 // Diagonal flow for upper
                :
                Math.random() * 1024; // Random horizontal for sole
            const y = isUpper ?
                (gradientPos * 900) + Math.random() * 124 // Diagonal flow for upper  
                :
                (gradientPos * 900) + Math.random() * 124; // Vertical flow for sole

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
    }, [darkenLightMaterials]);

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
        canvas.width = 2048; // Increased from 1024
        canvas.height = 2048; // Increased from 1024
        const ctx = canvas.getContext('2d')!;

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Create a neutral background instead of transparent to prevent flashing
        ctx.fillStyle = '#808080'; // Medium gray as placeholder
        ctx.fillRect(0, 0, 2048, 2048);

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
                0, -0.25, 0, -0.25, 2, -0.25,
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

        img.onerror = () => {
            console.error('Failed to load AI texture image');
            // Create a fallback pattern instead of leaving it blank
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 2048, 2048);
            texture.needsUpdate = true;
        };

        img.src = dataUrl;

        // Cache the texture
        textureCache.current.set(cacheKey, texture);

        return texture;
    }, []);

    // Create inner shadow texture for sole parts
    const createInnerShadowTexture = useCallback((baseColor: string): Texture => {
        // Apply darkening to light colors to prevent overexposure
        const adjustedColor = darkenLightMaterials(baseColor);
        const cacheKey = `inner-shadow-${adjustedColor}`;

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

        // Start with the adjusted base color
        ctx.fillStyle = adjustedColor;
        ctx.fillRect(0, 0, 1024, 1024);

        // Create radial gradient for inner shadow effect
        const centerX = 512;
        const centerY = 400; // Slightly higher to simulate the arch area
        const innerRadius = 150;
        const outerRadius = 450;

        // Create multiple shadow layers for realistic depth
        const shadowLayers = [{
            radius: outerRadius,
            opacity: 0.15,
            color: '#000000'
        }, {
            radius: outerRadius * 0.8,
            opacity: 0.12,
            color: '#000000'
        }, {
            radius: outerRadius * 0.6,
            opacity: 0.08,
            color: '#000000'
        }, {
            radius: outerRadius * 0.4,
            opacity: 0.05,
            color: '#000000'
        }, ];

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
    }, [darkenLightMaterials]);

    // Memoized splatter texture creation with caching
    const createSplatterTexture = useCallback((baseColor: string, splatterColor: string, splatterBaseColor: string | null = null, splatterColor2: string | null = null, useDualSplatter: boolean = false, isUpper: boolean = false, paintDensity: number = 20): Texture => {
        // Apply darkening to light colors to prevent overexposure
        const adjustedBaseColor = darkenLightMaterials(baseColor);
        const adjustedSplatterColor = darkenLightMaterials(splatterColor);
        const adjustedSplatterBaseColor = splatterBaseColor ? darkenLightMaterials(splatterBaseColor) : null;
        const adjustedSplatterColor2 = splatterColor2 ? darkenLightMaterials(splatterColor2) : null;
        
        // For dual splatter, use the original baseColor as the background if no splatterBaseColor is provided
        // This ensures the base color shows through properly instead of being darkened
        const textureBaseColor = useDualSplatter && !splatterBaseColor 
            ? baseColor 
            : (adjustedSplatterBaseColor || adjustedBaseColor);
        
        // Create cache key
        const cacheKey = `${textureBaseColor}-${adjustedSplatterColor}-${adjustedSplatterColor2 || 'none'}-${useDualSplatter}-${isUpper}-${paintDensity}`;

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

        // Use the splatter base color (darker version) for the texture background
        ctx.fillStyle = textureBaseColor;
        ctx.fillRect(0, 0, 1024, 1024);

        // Calculate number of splatters based on density
        // Reduce density for both single and dual color splatter
        const baseSplatters = isUpper ? 1000 : 1000;
        const densityMultiplier = useDualSplatter ? 0.6 : 0.3; // 40% less density for dual, 70% less for single
        const numSplatters = Math.floor((baseSplatters * paintDensity * densityMultiplier) / 10);

        // Adjusted for higher resolution canvas
        const minRadius = useDualSplatter 
            ? (isUpper ? 0.1 : 0.02) // Very small dots for dual splatter
            : (isUpper ? 0.4 : 0.1); // Standard small dots for single splatter
        // Different max sizes for single vs dual splatter
        const maxRadius = useDualSplatter 
            ? (isUpper ? 4.0 : 3.5) // Bigger dots for dual splatter
            : (isUpper ? 2.5 : 2.0); // Smaller dots for single splatter
        ctx.globalCompositeOperation = 'source-over';

        for (let i = 0; i < numSplatters; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;

            // Use stronger exponential distribution to heavily favor smaller dots, but allow occasional larger ones
            const sizeRandom = Math.pow(Math.random(), 4.0); // Increased from 3.5 to 4.0 for more extreme distribution
            const baseSize = minRadius + sizeRandom * (maxRadius - minRadius);

            // Use varying opacity for more natural look
            ctx.globalAlpha = 0.7 + Math.random() * 0.3;
            
            // Choose adjusted splatter color based on dual splatter setting
            if (useDualSplatter && adjustedSplatterColor2) {
                // Use both adjusted colors with some randomness
                ctx.fillStyle = Math.random() < 0.6 ? adjustedSplatterColor : adjustedSplatterColor2;
            } else {
                ctx.fillStyle = adjustedSplatterColor;
            }

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
    }, [darkenLightMaterials]);

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

    // REFACTOR: This new function gets a persistent texture for a logo part.
    // If the texture doesn't exist, it creates it and assigns it to the material.
    // It then asynchronously updates the texture's canvas content with the latest colors.
    // This prevents re-creating texture objects, which eliminates flashing.
    const getOrCreateAndUpdateLogoTexture = useCallback((
        partName: string,
        material: any,
        originalTexture: Texture | null,
        colors: { color1: string; color2: string; color3: string },
        userLogoUrl: string | null
    ) => {
        let canvasTexture = logoTexturesRef.current.get(partName);

        // If this part doesn't have a dedicated canvas texture yet, create one.
        if (!canvasTexture) {
            const width = originalTexture?.image?.width || 1024;
            const height = originalTexture?.image?.height || 1024;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d') !;

            // Draw an initial blank state to avoid a transparent frame
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            canvasTexture = new CanvasTexture(canvas);

            // Copy properties from the original model's texture to maintain UV mapping
            if (originalTexture) {
                canvasTexture.wrapS = originalTexture.wrapS;
                canvasTexture.wrapT = originalTexture.wrapT;
                canvasTexture.repeat.copy(originalTexture.repeat);
                canvasTexture.offset.copy(originalTexture.offset);
                canvasTexture.center.copy(originalTexture.center);
                canvasTexture.rotation = originalTexture.rotation;
            }
            canvasTexture.generateMipmaps = true;
            canvasTexture.minFilter = THREE.LinearMipmapLinearFilter;
            canvasTexture.magFilter = THREE.LinearFilter;
            canvasTexture.anisotropy = 16;

            logoTexturesRef.current.set(partName, canvasTexture);

            // Assign this new, persistent texture to the material. This only happens ONCE.
            material.map = canvasTexture;
            material.color.set(0xffffff); // Ensure material color doesn't tint the texture
            material.transparent = true; // The SVG may have transparency
            material.needsUpdate = true;
        } else {
            // Ensure the existing texture is still assigned to the material
            // This prevents other effects from overwriting the logo texture
            if (material.map !== canvasTexture) {
                material.map = canvasTexture;
                material.color.set(0xffffff);
                material.transparent = true;
                material.needsUpdate = true;
            }
        }

        // The texture object now exists and is assigned.
        // We can now update its contents asynchronously without causing a flash.
        const canvas = canvasTexture.image as HTMLCanvasElement;
        const ctx = canvas.getContext('2d') !;
        const { width, height } = canvas;
        const { color1, color2, color3 } = colors;

        // Create circle content - either user logo or solid color
        let circleContent = '';
        if (userLogoUrl) {
            circleContent = `
                <defs>
                    <clipPath id="circleClip">
                        <circle cx="931.55" cy="599.53" r="49.96"/>
                    </clipPath>
                </defs>
                <image x="${931.55 - 49.96}" y="${599.53 - 49.96}" width="${49.96 * 2}" height="${49.96 * 2}"
                       href="${userLogoUrl}" clip-path="url(#circleClip)" preserveAspectRatio="xMidYMid slice"/>
                <circle cx="931.55" cy="599.53" r="49.96" fill="none" stroke="${color1}" stroke-width="2" opacity="1"/>`;
        } else {
            circleContent = `<circle cx="931.55" cy="599.53" r="49.96" fill="${color1}" opacity="1"/>`;
        }

        // Create the full SVG string with dynamic colors
        const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${width}" height="${height}">
                <rect width="1024" height="1024" fill="#FFFFFF"/>
                <path d="M963.16,527.14l-.13-137.38c-5.1-38.17-55.76-37.96-61.03.04l-.17,134.83c-5.74,4.39-12.32,7.42-17.85,12.15-36.3,31.01-36.45,91.19-.51,122.54,5.66,4.94,12.27,8.36,18.37,12.63l.27,133.73c6.39,37.37,55.52,36.47,60.93-.85l-.08-134.87c56.69-28.83,57.21-114.2.2-142.83ZM951.13,660.93l-.26,139.74c-2.87,27.21-35.28,25.16-36.86-.89l-.15-137.85c-8.54-4.71-17.06-7.83-24.34-14.66-36.2-34-22.12-96.75,24.51-112.65l-.07-138.86c.65-26.62,33.99-29.64,36.91-1.84l.29,142.22c42.94,16.23,55.41,71.96,25.81,106.63-7.24,8.48-16.07,13.25-25.84,18.16Z"
                      fill="none" stroke="${color2}" stroke-width="100" opacity="1"/>
                <path d="M963.16,527.14l-.13-137.38c-5.1-38.17-55.76-37.96-61.03.04l-.17,134.83c-5.74,4.39-12.32,7.42-17.85,12.15-36.3,31.01-36.45,91.19-.51,122.54,5.66,4.94,12.27,8.36,18.37,12.63l.27,133.73c6.39,37.37,55.52,36.47,60.93-.85l-.08-134.87c56.69-28.83,57.21-114.2.2-142.83ZM951.13,660.93l-.26,139.74c-2.87,27.21-35.28,25.16-36.86-.89l-.15-137.85c-8.54-4.71-17.06-7.83-24.34-14.66-36.2-34-22.12-96.75,24.51-112.65l-.07-138.86c.65-26.62,33.99-29.64,36.91-1.84l.29,142.22c42.94,16.23,55.41,71.96,25.81,106.63-7.24,8.48-16.07,13.25-25.84,18.16Z"
                      fill="${color2}" opacity="1"/>
                <path d="M951.16,536.14l-.29-142.22c-2.93-27.8-36.27-24.78-36.91,1.84l.07,138.86c-46.63,15.9-60.71,78.65-24.51,112.65,7.28,6.83,15.8,9.94,24.34,14.66l.15,137.85c1.58,26.06,33.99,28.1,36.86.89l.26-139.74c9.77-4.91,18.6-9.68,25.84-18.16,29.6-34.67,17.13-90.4-25.81-106.63ZM931.55,649.49c-27.59,0-49.96-22.37-49.96-49.96s22.37-49.96,49.96-49.96,49.96,22.37,49.96,49.96-22.37,49.96-49.96,49.96Z"
                      fill="${color3}" opacity="1"/>
                ${circleContent}
            </svg>`;

        // Clear any existing timeout for this part to prevent rapid updates
        const existingTimeout = logoUpdateTimeoutsRef.current.get(partName);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Debounce the texture update to prevent rapid changes
        const updateTimeout = setTimeout(() => {
            const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                // Update the canvas that the EXISTING texture is using.
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                // This is the crucial step: signal to three.js that the texture's content has changed.
                canvasTexture!.needsUpdate = true;
                
                // Force a render update to ensure the texture is applied immediately
                if (canvasTexture!.source) {
                    canvasTexture!.source.needsUpdate = true;
                }
            };

            img.onerror = (err) => {
                console.error('Failed to load SVG for logo texture update:', err);
                // Fallback: create a solid color circle if image loading fails
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                
                // Draw a simple circle as fallback
                ctx.fillStyle = color1;
                ctx.beginPath();
                ctx.arc(931.55, 599.53, 49.96, 0, Math.PI * 2);
                ctx.fill();
                
                canvasTexture!.needsUpdate = true;
                if (canvasTexture!.source) {
                    canvasTexture!.source.needsUpdate = true;
                }
            };

            img.src = svgDataUrl;
        }, 50); // Small delay to debounce rapid changes

        logoUpdateTimeoutsRef.current.set(partName, updateTimeout);
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
                // Use overlay blend mode to overlay lace texture on colored base
                tempCtx.globalCompositeOperation = 'overlay';
                tempCtx.globalAlpha = 0.8; // Adjust opacity for realistic blend

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
        });

        // Cache the texture
        textureCache.current.set(cacheKey, texture);

        return texture;
    }, [loadLaceTexture]);

    const cleanup = useCallback(() => {
        // Clear texture cache
        textureCache.current.forEach((texture) => texture.dispose());
        textureCache.current.clear();

        // Dispose of the persistent logo textures
        logoTexturesRef.current.forEach((texture) => texture.dispose());
        logoTexturesRef.current.clear();

        // Clear any pending logo update timeouts
        logoUpdateTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        logoUpdateTimeoutsRef.current.clear();

        // Clear lace texture
        if (laceTextureRef.current) {
            laceTextureRef.current.dispose();
            laceTextureRef.current = null;
        }
    }, []);

    return (
        <>
            {children({
                createGradientTexture,
                createTextureFromDataUrl,
                createInnerShadowTexture,
                createSplatterTexture,
                createLaceTexture,
                loadLaceTexture,
                getOrCreateAndUpdateLogoTexture,
                cleanup
            })}
        </>
    );
};
