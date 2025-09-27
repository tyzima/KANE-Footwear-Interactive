import { useState, useEffect, useCallback } from 'react';
import { useDesignSharing, DesignData } from './useDesignSharing';
import { SavedDesign } from '@/lib/supabase';

export interface DesignLoadResult {
  design: SavedDesign | null;
  isLoading: boolean;
  error: string | null;
  hasSharedDesign: boolean;
}

export const useSharedDesignLoader = (onDesignLoaded?: (design: SavedDesign) => void) => {
  const [loadResult, setLoadResult] = useState<DesignLoadResult>({
    design: null,
    isLoading: false,
    error: null,
    hasSharedDesign: false
  });

  const { loadDesign } = useDesignSharing();

  const loadSharedDesignFromUrl = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const designToken = urlParams.get('design');

    if (!designToken) {
      setLoadResult(prev => ({ ...prev, hasSharedDesign: false }));
      return;
    }

    setLoadResult(prev => ({ 
      ...prev, 
      isLoading: true, 
      hasSharedDesign: true,
      error: null 
    }));

    try {
      const design = await loadDesign(designToken);
      
      if (design) {
        setLoadResult({
          design,
          isLoading: false,
          error: null,
          hasSharedDesign: true
        });

        // Call the callback if provided
        if (onDesignLoaded) {
          onDesignLoaded(design);
        }

        // Optional: Clean URL after loading (removes ?design=token)
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      } else {
        setLoadResult({
          design: null,
          isLoading: false,
          error: 'Design not found or not available',
          hasSharedDesign: true
        });
      }
    } catch (error) {
      console.error('Error loading shared design:', error);
      setLoadResult({
        design: null,
        isLoading: false,
        error: 'Failed to load shared design',
        hasSharedDesign: true
      });
    }
  }, [loadDesign, onDesignLoaded]);

  useEffect(() => {
    loadSharedDesignFromUrl();
  }, [location.search]); // Only depend on URL search params, not the function

  return {
    ...loadResult,
    reloadFromUrl: loadSharedDesignFromUrl
  };
};

// Helper function to convert SavedDesign to DesignData for applying to the UI
export const convertSavedDesignToDesignData = (savedDesign: SavedDesign): DesignData => {
  return {
    colorwayId: savedDesign.colorway_id,
    logoUrl: savedDesign.logo_url,
    logoColor1: savedDesign.logo_color1,
    logoColor2: savedDesign.logo_color2,
    logoColor3: savedDesign.logo_color3,
    logoPosition: savedDesign.logo_position,
    logoRotation: savedDesign.logo_rotation,
    logoScale: savedDesign.logo_scale,
    circleLogoUrl: savedDesign.circle_logo_url,
    customColors: {
      upperBaseColor: savedDesign.custom_upper_base_color,
      soleBaseColor: savedDesign.custom_sole_base_color,
      laceColor: savedDesign.custom_lace_color,
    },
    splatterConfig: savedDesign.design_config?.splatterConfig || {
      upperHasSplatter: false,
      soleHasSplatter: false,
      upperSplatterColor: '#FFFFFF',
      soleSplatterColor: '#FFFFFF',
      upperUseDualSplatter: false,
      soleUseDualSplatter: false,
      upperPaintDensity: 50,
      solePaintDensity: 50,
    },
    gradientConfig: savedDesign.design_config?.gradientConfig || {
      upperHasGradient: false,
      soleHasGradient: false,
      upperGradientColor1: '#4a8c2b',
      upperGradientColor2: '#c25d1e',
      soleGradientColor1: '#4a8c2b',
      soleGradientColor2: '#c25d1e',
    },
    textureConfig: savedDesign.design_config?.textureConfig || {
      upperTexture: null,
      soleTexture: null,
    },
  };
};
