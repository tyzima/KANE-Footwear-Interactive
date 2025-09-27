import { useState, useEffect, useCallback } from 'react';
import { useShopify } from './useShopify';

export interface Colorway {
  id: string;
  name: string;
  description: string;
  shopifyProductId?: string;
  image?: string;
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
}

interface ColorwayState {
  colorways: Colorway[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useColorways = () => {
  const { isConnected, getColorwaysFromProducts } = useShopify();
  const [state, setState] = useState<ColorwayState>({
    colorways: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // Load colorways from Shopify
  const loadColorways = useCallback(async (forceRefresh = false) => {
    if (!isConnected) {
      console.log('Shopify not connected, skipping colorway load');
      return;
    }

    // Don't reload if we already have data and it's not forced
    if (!forceRefresh && state.colorways.length > 0 && state.lastUpdated) {
      const timeSinceUpdate = Date.now() - state.lastUpdated.getTime();
      const fiveMinutes = 5 * 60 * 1000;
      if (timeSinceUpdate < fiveMinutes) {
        console.log('Using cached colorways (less than 5 minutes old)');
        return;
      }
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Loading colorways from Shopify products...');
      const colorways = await getColorwaysFromProducts();
      
      setState({
        colorways,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

      console.log(`Loaded ${colorways.length} colorways from Shopify`);
    } catch (error) {
      console.error('Failed to load colorways:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load colorways',
      }));
    }
  }, [isConnected, getColorwaysFromProducts, state.colorways.length, state.lastUpdated]);

  // Auto-load colorways when Shopify connection is established
  useEffect(() => {
    if (isConnected && state.colorways.length === 0) {
      loadColorways();
    }
  }, [isConnected, loadColorways, state.colorways.length]);

  // Get colorway by ID
  const getColorwayById = useCallback((id: string): Colorway | undefined => {
    return state.colorways.find(colorway => colorway.id === id);
  }, [state.colorways]);

  // Get colorways by product ID
  const getColorwaysByProductId = useCallback((productId: string): Colorway[] => {
    return state.colorways.filter(colorway => colorway.shopifyProductId === productId);
  }, [state.colorways]);

  return {
    ...state,
    loadColorways,
    getColorwayById,
    getColorwaysByProductId,
    refreshColorways: () => loadColorways(true),
  };
};
