import { useState, useEffect, useCallback } from 'react';
import staticColorwaysData from '../data/colorways.json';

// Define the structure of a Colorway (same as existing)
export interface Colorway {
  id: string;
  name: string;
  description: string;
  productId?: string;
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

interface PublicColorwaysResponse {
  success: boolean;
  shop: string;
  productId?: string;
  colorways: Colorway[];
  timestamp: string;
  source: string;
}

export const usePublicColorways = (shop?: string, productId?: string) => {
  const [colorways, setColorways] = useState<Colorway[]>(staticColorwaysData.colorways as Colorway[]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingDynamicData, setIsUsingDynamicData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDynamicColorways = useCallback(async () => {
    if (!shop) {
      console.log('No shop provided, using static colorways');
      setIsUsingDynamicData(false);
      setColorways(staticColorwaysData.colorways as Colorway[]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching dynamic colorways from public API...', { shop, productId });
      
      // Build API URL
      const params = new URLSearchParams({ shop });
      if (productId) {
        params.append('productId', productId);
      }
      
      const apiUrl = `/.netlify/functions/public-colorways?${params.toString()}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: PublicColorwaysResponse = await response.json();
      
      if (data.success && data.colorways && data.colorways.length > 0) {
        console.log(`Loaded ${data.colorways.length} dynamic colorways from ${data.source}`);
        setColorways(data.colorways);
        setIsUsingDynamicData(true);
        setLastUpdated(new Date(data.timestamp));
      } else {
        console.log('No colorways found, falling back to static data');
        setColorways(staticColorwaysData.colorways as Colorway[]);
        setIsUsingDynamicData(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load colorways';
      console.error('Error loading dynamic colorways:', err);
      setError(errorMessage);
      
      // Fallback to static colorways on error
      console.log('Falling back to static colorways due to error');
      setColorways(staticColorwaysData.colorways as Colorway[]);
      setIsUsingDynamicData(false);
    } finally {
      setIsLoading(false);
    }
  }, [shop, productId]);

  // Load colorways when shop/productId changes
  useEffect(() => {
    fetchDynamicColorways();
  }, [fetchDynamicColorways]);

  // Manual refresh function
  const refreshColorways = useCallback(async () => {
    await fetchDynamicColorways();
  }, [fetchDynamicColorways]);

  return {
    colorways,
    isLoading,
    error,
    lastUpdated,
    refreshColorways,
    isUsingDynamicData,
    totalCount: colorways.length
  };
};
