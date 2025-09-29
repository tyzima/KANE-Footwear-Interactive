import React, { useRef, useCallback, useEffect } from 'react';
import { Mesh, MeshStandardMaterial, GLTF } from 'three';
import { useColorProcessor } from './ColorProcessor';

interface MaterialManagerProps {
    gltf: GLTF | null;
    children: (materialManager: {
        updateMaterialsForParts: (partFilter: (child: Mesh) => boolean, updateFn: (child: Mesh, material: MeshStandardMaterial, originalMaterial?: MeshStandardMaterial) => void) => void;
        cleanup: () => void;
    }) => React.ReactNode;
}

export const MaterialManager: React.FC<MaterialManagerProps> = ({ gltf, children }) => {
    const originalMaterialsRef = useRef<Map<string, MeshStandardMaterial>>(new Map());
    const currentMaterialsRef = useRef<Map<string, MeshStandardMaterial>>(new Map());
    const { darkenLightMaterials } = useColorProcessor();

    // Initialize original materials when GLTF loads
    useEffect(() => {
        if (gltf) {
            gltf.scene.traverse((child) => {
                if (child instanceof Mesh && child.material && child.name) {
                    const originalMaterial = child.material.clone();
                    originalMaterialsRef.current.set(child.name, originalMaterial);
                }
            });
        }
    }, [gltf]);

    // Cleanup function for materials and textures
    const cleanupMaterials = useCallback(() => {
        currentMaterialsRef.current.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
        });
        currentMaterialsRef.current.clear();
    }, []);

    // Helper function to update materials with proper cleanup
    const updateMaterialsForParts = useCallback((
        partFilter: (child: Mesh) => boolean,
        updateFn: (child: Mesh, material: MeshStandardMaterial, originalMaterial?: MeshStandardMaterial) => void
    ) => {
        if (!gltf) return;

        const materialsToCleanup: MeshStandardMaterial[] = [];

        gltf.scene.traverse((child) => {
            if (child instanceof Mesh && child.name && partFilter(child)) {
                const originalMaterial = originalMaterialsRef.current.get(child.name);

                // Get or create material for this part
                const existingMaterial = currentMaterialsRef.current.get(child.name);
                let material: MeshStandardMaterial;

                if (existingMaterial) {
                    material = existingMaterial;
                    if (child.material !== material) {
                        materialsToCleanup.push(child.material as MeshStandardMaterial);
                    }
                } else {
                    // Clone original material to preserve original textures and properties
                    material = originalMaterial ? originalMaterial.clone() : new MeshStandardMaterial();
                    currentMaterialsRef.current.set(child.name, material);
                    if (child.material) {
                        materialsToCleanup.push(child.material as MeshStandardMaterial);
                    }
                }

                // Store the current texture before applying updates to prevent flashing
                const previousTexture = material.map;

                // Apply the specific update function
                updateFn(child, material, originalMaterial);

                // Only assign material if it's different to prevent flashing
                if (child.material !== material) {
                    child.material = material;
                }

                // Ensure shadow properties are maintained for consistency
                child.castShadow = true;
                child.receiveShadow = true;

                // Force material update to ensure texture is properly applied
                material.needsUpdate = true;
            }
        });

        // Schedule cleanup of old materials after a longer delay to prevent flashing
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
            }, 200); // Increased delay to ensure rendering is complete

            return () => {
                clearTimeout(timeoutId);
            };
        }
    }, [gltf]);

    const cleanup = useCallback(() => {
        // Clean up current materials and textures
        currentMaterialsRef.current.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
        });
        currentMaterialsRef.current.clear();

        // Clear original materials
        originalMaterialsRef.current.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
        });
        originalMaterialsRef.current.clear();
    }, []);

    return (
        <>
            {children({
                updateMaterialsForParts,
                cleanup
            })}
        </>
    );
};
