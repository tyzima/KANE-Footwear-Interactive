import { useState, useEffect, useCallback } from 'react';
import { useShopify } from './useShopify';
import colorwaysData from '../data/colorways.json';

export interface Colorway {
  id: string;
  name: string;
  description: string;
  productId?: string; // Optional product ID for Shopify colorways
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

export const useColorways = () => {
  const { isConnected, getColorways } = useShopify();
  const [colorways, setColorways] = useState<Colorway[]>(colorwaysData.colorways);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load dynamic colorways from Shopify
  const loadDynamicColorways = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Admin/connected path
      if (isConnected) {
        const dynamicColorways = await getColorways();
        if (dynamicColorways && dynamicColorways.length > 0) {
          setColorways(dynamicColorways);
          setLastUpdated(new Date());
          return;
        }
      }

      // Public/customer path via Netlify function
      const params = new URLSearchParams(window.location.search);
      const shop = params.get('shop');
      if (shop) {
        const resp = await fetch(`/.netlify/functions/public-colorways?shop=${encodeURIComponent(shop)}`);
        if (resp.ok) {
          const json = await resp.json();
          if (Array.isArray(json.colorways) && json.colorways.length > 0) {
            setColorways(json.colorways as Colorway[]);
            setLastUpdated(new Date());
            return;
          }
        }
      }

      // Fallback to static
      setColorways(colorwaysData.colorways);
      setLastUpdated(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load colorways';
      console.error('Error loading colorways:', err);
      setError(errorMessage);
      setColorways(colorwaysData.colorways);
      setLastUpdated(null);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getColorways]);

  // Load colorways when connected
  useEffect(() => {
    loadDynamicColorways();
  }, [loadDynamicColorways]);

  // Manual refresh function
  const refreshColorways = useCallback(async () => {
    if (isConnected) {
      await loadDynamicColorways();
    }
  }, [isConnected, loadDynamicColorways]);

  return {
    colorways,
    isLoading,
    error,
    lastUpdated,
    refreshColorways,
    isUsingDynamicData: !!lastUpdated,
    totalCount: colorways.length
  };
};
