import { useState, useEffect } from 'react';
import { Colorway } from '../data/colorways.json';

interface PublicColorwaysResponse {
  colorways: Colorway[];
  error?: string;
}

export const usePublicColorways = (shopDomain?: string) => {
  const [colorways, setColorways] = useState<Colorway[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingDynamicData, setIsUsingDynamicData] = useState(false);

  useEffect(() => {
    const fetchPublicColorways = async () => {
      if (!shopDomain) {
        console.log('No shop domain provided for public colorways');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching public colorways for shop: ${shopDomain}`);
        
        const response = await fetch(`/.netlify/functions/public-colorways?shop=${encodeURIComponent(shopDomain)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch public colorways: ${response.status}`);
        }

        const data: PublicColorwaysResponse = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (data.colorways && data.colorways.length > 0) {
          console.log(`Loaded ${data.colorways.length} public colorways from Shopify`);
          setColorways(data.colorways);
          setIsUsingDynamicData(true);
        } else {
          console.log('No public colorways found, will use fallback');
          setColorways([]);
          setIsUsingDynamicData(false);
        }

      } catch (error) {
        console.error('Error fetching public colorways:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setColorways([]);
        setIsUsingDynamicData(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicColorways();
  }, [shopDomain]);

  return {
    colorways,
    isLoading,
    error,
    isUsingDynamicData
  };
};
