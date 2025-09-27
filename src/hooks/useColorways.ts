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
    if (!isConnected) {
      console.log('Not connected to Shopify, using static colorways');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading dynamic colorways from Shopify...');
      const dynamicColorways = await getColorways();
      
      if (dynamicColorways && dynamicColorways.length > 0) {
        console.log(`Loaded ${dynamicColorways.length} dynamic colorways from Shopify`);
        setColorways(dynamicColorways);
        setLastUpdated(new Date());
      } else {
        console.log('No colorways found in Shopify, falling back to static data');
        setColorways(colorwaysData.colorways);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load colorways';
      console.error('Error loading dynamic colorways:', err);
      setError(errorMessage);
      
      // Fallback to static colorways on error
      console.log('Falling back to static colorways due to error');
      setColorways(colorwaysData.colorways);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getColorways]);

  // Load colorways when connected
  useEffect(() => {
    if (isConnected) {
      loadDynamicColorways();
    } else {
      // Use static colorways when not connected
      setColorways(colorwaysData.colorways);
      setLastUpdated(null);
      setError(null);
    }
  }, [isConnected, loadDynamicColorways]);

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
    isUsingDynamicData: isConnected && !error,
    totalCount: colorways.length
  };
};
