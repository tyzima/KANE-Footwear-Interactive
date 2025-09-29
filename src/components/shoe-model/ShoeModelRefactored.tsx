import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, AnimationMixer, PlaneGeometry, MeshLambertMaterial, CylinderGeometry, MeshStandardMaterial, CircleGeometry } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { JibbitLogo } from '../JibbitLogo';
import { ModelLoader } from './ModelLoader';
import { TextureManager } from './TextureManager';
import { MaterialManager } from './MaterialManager';
import { useColorProcessor } from './ColorProcessor';
// Import colorways data to get first colorway as fallback default
import colorwaysData from '../../data/colorways.json';

interface ShoeModelProps {
    onLoad?: () => void;
    onError?: (error: Error) => void;
    onPartClick?: (partType: 'upper' | 'sole' | 'laces' | 'logos') => void;
    scale?: number;
    backgroundType?: 'light' | 'dark';
    // Add defaultColorway prop to handle both static and dynamic colorways
    defaultColorway?: {
        upper: {
            baseColor: string;
            hasSplatter: boolean;
            splatterColor: string | null;
            splatterBaseColor: string | null;
            splatterColor2: string | null;
            useDualSplatter: boolean;
        };
        sole: {
            baseColor: string;
            hasSplatter: boolean;
            splatterColor: string | null;
            splatterBaseColor: string | null;
            splatterColor2: string | null;
            useDualSplatter: boolean;
        };
        laces: {
            color: string;
        };
    };
    bottomColor?: string;
    topColor?: string;
    upperHasSplatter?: boolean;
    soleHasSplatter?: boolean;
    upperSplatterColor?: string;
    soleSplatterColor?: string;
    upperSplatterColor2?: string;
    soleSplatterColor2?: string;
    upperSplatterBaseColor?: string;
    soleSplatterBaseColor?: string;
    upperUseDualSplatter?: boolean;
    soleUseDualSplatter?: boolean;
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
    // Lace colors (single color for both left and right)
    laceColor?: string;
    // Logo colors - now supporting 3 separate colors
    logoColor1?: string; // Blue parts
    logoColor2?: string; // Black parts
    logoColor3?: string; // Red parts
    // Circle logo in SVG texture
    circleLogoUrl?: string | null;
    // Logo props (Jibbit logos)
    logoUrl?: string | null;
    logoPosition?: [number, number, number];
    logoRotation?: [number, number, number];
    logoPlacementMode?: boolean;
    onLogoPositionSet?: (position: [number, number, number], normal: [number, number, number]) => void;
    // Second logo props
    logo2Position?: [number, number, number];
    logo2Rotation?: [number, number, number];
}

// Get fallback colorway from static data
const fallbackColorway = colorwaysData.colorways[0];

export const ShoeModelRefactored: React.FC<ShoeModelProps> = ({
    onLoad,
    onError,
    onPartClick,
    scale = 1,
    backgroundType = 'light',
    // Use defaultColorway prop or fallback to static colorway to prevent visual jump
    defaultColorway,
    bottomColor = defaultColorway?.sole.baseColor || fallbackColorway.sole.baseColor,
    topColor = defaultColorway?.upper.baseColor || fallbackColorway.upper.baseColor,
    upperHasSplatter = defaultColorway?.upper.hasSplatter || fallbackColorway.upper.hasSplatter,
    soleHasSplatter = defaultColorway?.sole.hasSplatter || fallbackColorway.sole.hasSplatter,
    upperSplatterColor = defaultColorway?.upper.splatterColor || fallbackColorway.upper.splatterColor || '#f8f8ff',
    soleSplatterColor = defaultColorway?.sole.splatterColor || fallbackColorway.sole.splatterColor || '#f8f8f8ff',
    upperSplatterColor2 = defaultColorway?.upper.splatterColor2 || fallbackColorway.upper.splatterColor2 || null,
    soleSplatterColor2 = defaultColorway?.sole.splatterColor2 || fallbackColorway.sole.splatterColor2 || null,
    upperSplatterBaseColor = defaultColorway?.upper.splatterBaseColor || fallbackColorway.upper.splatterBaseColor || null,
    soleSplatterBaseColor = defaultColorway?.sole.splatterBaseColor || fallbackColorway.sole.splatterBaseColor || null,
    upperUseDualSplatter = defaultColorway?.upper.useDualSplatter || fallbackColorway.upper.useDualSplatter,
    soleUseDualSplatter = defaultColorway?.sole.useDualSplatter || fallbackColorway.sole.useDualSplatter,
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
    // Lace and logo colors with defaults from colorway
    laceColor = defaultColorway?.laces.color || fallbackColorway.laces.color,
    logoColor1 = '#FFFFFF',
    logoColor2 = '#FFFFFF',
    logoColor3 = '#FFFFFF',
    // Circle logo in SVG texture
    circleLogoUrl = null,
    // Logo props with defaults (Jibbit logos)
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
    const { darkenLightMaterials } = useColorProcessor();

    // Handle model loading
    const handleModelReady = useCallback((loadedGltf: GLTF) => {
        setGltf(loadedGltf);
    }, []);

    // Setup animations when GLTF loads
    useEffect(() => {
        if (gltf && gltf.animations && gltf.animations.length > 0) {
            const mixer = new AnimationMixer(gltf.scene);
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.play();
            });
            mixerRef.current = mixer;
        }

        return () => {
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
            }
        };
    }, [gltf]);

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

    // Helper function to clone material for unique interaction
    const makeMaterialUnique = useCallback((object: any) => {
        if (object.userData.isMaterialCloned) {
            return;
        }

        const material = object.material;
        if (material && object.name) {
            const newMaterial = material.clone();
            object.material = newMaterial;
            object.userData.isMaterialCloned = true;
        }
    }, []);

    if (!gltf) {
        return (
            <ModelLoader
                onLoad={onLoad}
                onError={onError}
                onModelReady={handleModelReady}
            />
        );
    }

    return (
        <TextureManager>
            {(textureManager) => (
                <MaterialManager gltf={gltf}>
                    {(materialManager) => {
                        // Update sole/bottom parts only when sole-related props change
                        useEffect(() => {
                            const soleFilter = (child: any) =>
                                child.name.includes('bottom') || child.name.includes('sole');

                            const soleUpdate = (child: any, material: any) => {
                                material.transparent = true;
                                material.opacity = 0.95;
                                material.roughness = 0.9;
                                material.metalness = 0.02;

                                const currentTexture = material.map;
                                let newTexture = currentTexture;

                                if (soleTexture) {
                                    newTexture = textureManager.createTextureFromDataUrl(soleTexture);
                                    if (material.map !== newTexture) {
                                        material.map = newTexture;
                                        material.roughness = 0.9;
                                        material.metalness = 0.05;
                                        material.color.setHex(0xffffff);
                                    }
                                } else if (soleHasGradient) {
                                    newTexture = textureManager.createGradientTexture(bottomColor, soleGradientColor1, soleGradientColor2, false);
                                    if (material.map !== newTexture) {
                                        material.map = newTexture;
                                        material.roughness = 0.9;
                                    }
                                } else if (soleHasSplatter) {
                                    newTexture = textureManager.createSplatterTexture(bottomColor, soleSplatterColor, soleSplatterBaseColor, soleSplatterColor2, soleUseDualSplatter, false, solePaintDensity);
                                    if (material.map !== newTexture) {
                                        material.map = newTexture;
                                        material.roughness = 0.9;
                                        material.color.setHex(0xffffff);
                                    }
                                } else {
                                    newTexture = textureManager.createInnerShadowTexture(bottomColor);
                                    if (material.map !== newTexture) {
                                        material.map = newTexture;
                                        material.roughness = 0.9;
                                        material.metalness = 0.02;
                                        material.color.setHex(0xffffff);
                                    }
                                }

                                if (newTexture !== currentTexture) {
                                    material.needsUpdate = true;
                                }
                            };

                            materialManager.updateMaterialsForParts(soleFilter, soleUpdate);
                        }, [gltf, bottomColor, soleHasSplatter, soleSplatterColor, soleSplatterBaseColor, soleSplatterColor2, soleUseDualSplatter, solePaintDensity, soleHasGradient, soleGradientColor1, soleGradientColor2, soleTexture, textureManager, materialManager]);

                        // Update upper/top parts only when upper-related props change
                        useEffect(() => {
                            const upperFilter = (child: any) => {
                                const lowerName = child.name.toLowerCase();
                                // Exclude logo parts from upper splatter effects
                                const isLogoPart = lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') ||
                                    lowerName.includes('swoosh') || lowerName.includes('mark') || lowerName.includes('badge');
                                return (child.name.includes('top') || child.name.includes('upper')) && !isLogoPart;
                            };

                            const upperUpdate = (child: any, material: any, originalMaterial?: any) => {
                                material.roughness = 0.9;
                                material.metalness = 0.02;

                                const currentTexture = material.map;
                                let newTexture = currentTexture;

                                if (upperTexture) {
                                    newTexture = textureManager.createTextureFromDataUrl(upperTexture);
                                    if (material.map !== newTexture) {
                                        material.map = newTexture;
                                        material.roughness = 0.9;
                                        material.metalness = 0.05;
                                        material.color.setHex(0xffffff);
                                    }
                                } else if (upperHasGradient) {
                                    newTexture = textureManager.createGradientTexture(topColor, upperGradientColor1, upperGradientColor2, true);
                                    if (material.map !== newTexture) {
                                        material.map = newTexture;
                                        material.roughness = 0.9;
                                    }
                                } else if (upperHasSplatter) {
                                    newTexture = textureManager.createSplatterTexture(topColor, upperSplatterColor, upperSplatterBaseColor, upperSplatterColor2, upperUseDualSplatter, true, upperPaintDensity);
                                    if (material.map !== newTexture) {
                                        material.map = newTexture;
                                        material.roughness = 0.9;
                                        material.color.setHex(0xffffff);
                                    }
                                } else {
                                    const originalTexture = originalMaterial?.map || null;
                                    newTexture = originalTexture;
                                    if (material.map !== originalTexture) {
                                        material.map = originalTexture;
                                    }
                                    // Apply darkening to light colors to prevent overexposure
                                    const adjustedColor = darkenLightMaterials(topColor);
                                    material.color.set(adjustedColor);
                                    if (originalTexture) {
                                        material.roughness = originalMaterial?.roughness ?? 0.9;
                                        material.metalness = originalMaterial?.metalness ?? 0.02;
                                    }
                                }

                                if (newTexture !== currentTexture) {
                                    material.needsUpdate = true;
                                }
                            };

                            materialManager.updateMaterialsForParts(upperFilter, upperUpdate);
                        }, [gltf, topColor, upperHasSplatter, upperSplatterColor, upperSplatterColor2, upperSplatterBaseColor, upperUseDualSplatter, upperPaintDensity, upperHasGradient, upperGradientColor1, upperGradientColor2, upperTexture, textureManager, materialManager, darkenLightMaterials]);

                        // Update lace parts only when lace-related props change
                        useEffect(() => {
                            const laceFilter = (child: any) => {
                                const lowerName = child.name.toLowerCase();
                                return lowerName.includes('lace') || lowerName.includes('string') || lowerName.includes('shoelace') ||
                                    lowerName.includes('cord') || lowerName.includes('tie') || lowerName.includes('eyelet');
                            };

                            const laceUpdate = (child: any, material: any) => {
                                material.roughness = 0.9;
                                material.metalness = 0.02;

                                const laceTexture = textureManager.createLaceTexture(laceColor);
                                if (material.map !== laceTexture) {
                                    material.map = laceTexture;
                                    material.color.setHex(0xffffff);
                                }
                            };

                            materialManager.updateMaterialsForParts(laceFilter, laceUpdate);
                        }, [gltf, laceColor, textureManager, materialManager]);

                        // Update logo parts
                        useEffect(() => {
                            const logoFilter = (child: any) => {
                                const lowerName = child.name.toLowerCase();
                                return lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') ||
                                    lowerName.includes('swoosh') || lowerName.includes('mark') || lowerName.includes('badge');
                            };

                            const logoUpdate = (child: any, material: any, originalMaterial?: any) => {
                                if (!child.name) return;

                                material.roughness = 0.9;
                                material.metalness = 0.05;

                                // This function now handles everything, preventing the flash.
                                textureManager.getOrCreateAndUpdateLogoTexture(
                                    child.name,
                                    material,
                                    originalMaterial?.map || null, {
                                        color1: logoColor1,
                                        color2: logoColor2,
                                        color3: logoColor3
                                    },
                                    circleLogoUrl
                                );
                            };

                            materialManager.updateMaterialsForParts(logoFilter, logoUpdate);
                        }, [gltf, logoColor1, logoColor2, logoColor3, circleLogoUrl, textureManager, materialManager, topColor, upperHasSplatter, upperTexture, upperHasGradient]);

                        // Secondary logo effect to ensure logos are restored after any material changes
                        useEffect(() => {
                            if (!gltf || !circleLogoUrl) return;

                            // Small delay to run after other material effects
                            const timeoutId = setTimeout(() => {
                                const logoFilter = (child: any) => {
                                    const lowerName = child.name.toLowerCase();
                                    return lowerName.includes('logo') || lowerName.includes('brand') || lowerName.includes('emblem') ||
                                        lowerName.includes('swoosh') || lowerName.includes('mark') || lowerName.includes('badge');
                                };

                                const logoRestoreUpdate = (child: any, material: any, originalMaterial?: any) => {
                                    if (!child.name) return;

                                    // Force restore the logo texture
                                    textureManager.getOrCreateAndUpdateLogoTexture(
                                        child.name,
                                        material,
                                        originalMaterial?.map || null,
                                        {
                                            color1: logoColor1,
                                            color2: logoColor2,
                                            color3: logoColor3
                                        },
                                        circleLogoUrl
                                    );
                                };

                                materialManager.updateMaterialsForParts(logoFilter, logoRestoreUpdate);
                            }, 100); // Small delay to ensure it runs after other effects

                            return () => clearTimeout(timeoutId);
                        }, [gltf, circleLogoUrl, logoColor1, logoColor2, logoColor3, textureManager, materialManager, topColor, upperHasSplatter, upperTexture]);


                        return (
                            <group
                                ref={groupRef}
                                position={[0, 0.15, 0]}
                            >
                                <primitive
                                    object={gltf.scene}
                                    dispose={null}
                                    castShadow
                                    receiveShadow
                                />
                                <JibbitLogo
                                    logoUrl={logoUrl}
                                    position={logoPosition}
                                    rotation={logoRotation}
                                    scale={0.15}
                                    visible={!!logoUrl}
                                    castShadow
                                />
                                <JibbitLogo
                                    logoUrl={logoUrl}
                                    position={logo2Position}
                                    rotation={logo2Rotation}
                                    scale={0.15}
                                    visible={!!logoUrl}
                                    castShadow
                                />
                                
                                {/* Infinity Studio Background */}
                                <group>
                                    {/* Main infinity backdrop - taller to hide top edge */}
                                    <mesh
                                        position={[0, 0, -3]}
                                        rotation={[0, 0, 0]}
                                        receiveShadow
                                    >
                                        <cylinderGeometry args={[12, 12, 12, 64, 1, true]} />
                                        <meshStandardMaterial
                                            color={backgroundType === 'dark' ? '#000000' : topColor}
                                            roughness={0.9}
                                            metalness={0.0}
                                            side={2} // DoubleSide
                                        />
                                    </mesh>
                                    
                                    {/* Ground plane for shadows - circular */}
                                    <mesh
                                        position={[0, -0.5, 0]}
                                        rotation={[-Math.PI / 2, 0, 0]}
                                        receiveShadow
                                    >
                                        <circleGeometry args={[7.5, 32]} />
                                        <meshStandardMaterial
                                            color={backgroundType === 'dark' ? '#000000' : '#ffffff'}
                                            roughness={0.95}
                                            metalness={0.0}
                                        />
                                    </mesh>
                                    
                                    {/* Shadow gradient overlay for more focused shadows - circular */}
                                    <mesh
                                        position={[0, -0.49, 0]}
                                        rotation={[-Math.PI / 2, 0, 0]}
                                    >
                                        <circleGeometry args={[4, 32]} />
                                        <meshStandardMaterial
                                            color={backgroundType === 'dark' ? '#000000' : '#f5f5f5'}
                                            transparent
                                            opacity={backgroundType === 'dark' ? 0.4 : 0.1}
                                            side={2}
                                        />
                                    </mesh>
                                </group>
                            </group>
                        );
                    }}
                </MaterialManager>
            )}
        </TextureManager>
    );
};
