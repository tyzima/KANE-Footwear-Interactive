import { useState, useEffect, useCallback } from 'react';

interface PublicShopifyDataState {
  colorways: any[];
  inventory: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;
}

export const usePublicShopifyData = (shop?: string, productId?: string) => {
  const [state, setState] = useState<PublicShopifyDataState>({
    colorways: [],
    inventory: {},
    isLoading: false,
    error: null,
    isAvailable: false
  });

  const fetchColorways = useCallback(async () => {
    if (!shop) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({
        shop,
        action: 'colorways',
        ...(productId && { productId })
      });

      const response = await fetch(`/.netlify/functions/public-product-data?${params}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          colorways: data.colorways || [],
          isAvailable: true,
          isLoading: false
        }));
      } else {
        // Public API not available, fall back to default behavior
        console.log('Public API not configured for shop:', shop, data.message);
        setState(prev => ({
          ...prev,
          isAvailable: false,
          isLoading: false,
          error: null // Don't treat this as an error, just unavailable
        }));
      }
    } catch (error) {
      console.error('Failed to fetch public colorways:', error);
      setState(prev => ({
        ...prev,
        isAvailable: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch colorways'
      }));
    }
  }, [shop, productId]);

  const fetchInventory = useCallback(async () => {
    if (!shop || !productId) return;

    try {
      const params = new URLSearchParams({
        shop,
        action: 'inventory',
        productId
      });

      const response = await fetch(`/.netlify/functions/public-product-data?${params}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          inventory: data.inventory || {}
        }));
      } else {
        // Public API not available, use mock data
        console.log('Public inventory API not configured, using mock data');
        
        // Generate mock inventory for demo purposes
        const mockInventory: Record<string, number> = {};
        const sizes = [
          'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18',
          'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20'
        ];
        
        sizes.forEach(size => {
          mockInventory[size] = Math.floor(Math.random() * 20) + 1; // 1-20 random inventory
        });
        
        setState(prev => ({
          ...prev,
          inventory: mockInventory
        }));
      }
    } catch (error) {
      console.error('Failed to fetch public inventory:', error);
      // Don't update error state for inventory failures, just use empty inventory
    }
  }, [shop, productId]);

  useEffect(() => {
    if (shop) {
      fetchColorways();
      fetchInventory();
    }
  }, [fetchColorways, fetchInventory]);

  return {
    ...state,
    refetchColorways: fetchColorways,
    refetchInventory: fetchInventory
  };
};
