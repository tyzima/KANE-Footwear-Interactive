import { useState, useEffect, useCallback } from 'react';
import { useShopify } from './useShopify';
import { usePublicColorways } from './usePublicColorways';
import colorwaysData from '../data/colorways.json';

export interface Colorway {
  id: string;
  name: string;
  description: string;
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

export const useColorways = (shopDomain?: string) => {
  const { isConnected, getColorways } = useShopify();
  const [colorways, setColorways] = useState<Colorway[]>(colorwaysData.colorways);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Use public colorways hook for embedded contexts
  const publicColorways = usePublicColorways(shopDomain);
  
  // Detect if we're in an embedded context (not admin)
  const isEmbeddedContext = typeof window !== 'undefined' && 
    (window.location.pathname === '/' || !window.location.pathname.includes('admin'));

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

  // Load colorways based on context
  useEffect(() => {
    if (isEmbeddedContext && shopDomain) {
      // In embedded context, use public colorways
      console.log('Using public colorways for embedded context');
      if (publicColorways.colorways.length > 0) {
        setColorways(publicColorways.colorways);
        setLastUpdated(new Date());
        setError(publicColorways.error);
      } else if (!publicColorways.isLoading) {
        // Fallback to static if no public colorways found
        setColorways(colorwaysData.colorways);
        setLastUpdated(null);
        setError(null);
      }
      setIsLoading(publicColorways.isLoading);
    } else if (isConnected) {
      // In admin context with connection, use admin API
      console.log('Using admin colorways for connected admin context');
      loadDynamicColorways();
    } else {
      // Default: use static colorways
      console.log('Using static colorways as fallback');
      setColorways(colorwaysData.colorways);
      setLastUpdated(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isConnected, isEmbeddedContext, shopDomain, publicColorways, loadDynamicColorways]);

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
    isUsingDynamicData: (isEmbeddedContext && shopDomain && publicColorways.isUsingDynamicData) || (isConnected && !error),
    totalCount: colorways.length
  };
};
