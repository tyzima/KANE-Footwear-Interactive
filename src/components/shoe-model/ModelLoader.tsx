import React, { useRef, useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Box3, Vector3, Mesh } from 'three';

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

interface ModelLoaderProps {
    onLoad?: () => void;
    onError?: (error: Error) => void;
    onModelReady: (gltf: GLTF) => void;
}

export const ModelLoader: React.FC<ModelLoaderProps> = ({
    onLoad,
    onError,
    onModelReady
}) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        preloadModel()
            .then((loadedGltf) => {
                try {
                    // Clone the preloaded model to avoid conflicts between instances
                    const clonedGltf = {
                        ...loadedGltf,
                        scene: loadedGltf.scene.clone()
                    };

                    onModelReady(clonedGltf);
                    onLoad?.();
                    setIsLoading(false);
                } catch (error) {
                    onError?.(error instanceof Error ? error : new Error('Failed to process model'));
                    setIsLoading(false);
                }
            })
            .catch((error) => {
                onError?.(error instanceof Error ? error : new Error('Failed to load model'));
                setIsLoading(false);
            });
    }, [onLoad, onError, onModelReady]);

    return null; // This component doesn't render anything
};

export { preloadModel };
