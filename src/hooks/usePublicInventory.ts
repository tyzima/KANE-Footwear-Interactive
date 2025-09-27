import { useState, useCallback } from 'react';

interface PublicInventoryResponse {
  success: boolean;
  shop: string;
  productId: string;
  inventory: {
    productId: string;
    productTitle: string;
    inventory: Record<string, number>;
    variants: Array<{
      id: string;
      title: string;
      sku: string;
      size: string | null;
      inventoryQuantity: number;
      availableForSale: boolean;
      price: string;
    }>;
  };
  timestamp: string;
  source: string;
}

export const usePublicInventory = () => {
  const [inventoryData, setInventoryData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInventory = useCallback(async (shop: string, productId: string) => {
    if (!shop || !productId) {
      console.log('Shop and productId are required for inventory lookup');
      return {};
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching inventory from public API...', { shop, productId });
      
      const params = new URLSearchParams({ shop, productId });
      const apiUrl = `/.netlify/functions/public-inventory?${params.toString()}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: PublicInventoryResponse = await response.json();
      
      if (data.success && data.inventory) {
        console.log('Loaded inventory from', data.source, data.inventory);
        const inventory = data.inventory.inventory;
        setInventoryData(inventory);
        setLastUpdated(new Date(data.timestamp));
        return inventory;
      } else {
        console.log('No inventory found');
        setInventoryData({});
        return {};
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load inventory';
      console.error('Error loading inventory:', err);
      setError(errorMessage);
      setInventoryData({});
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAvailableQuantity = useCallback((size: string) => {
    return inventoryData[size] || 0;
  }, [inventoryData]);

  const isSizeAvailable = useCallback((size: string) => {
    return getAvailableQuantity(size) > 0;
  }, [getAvailableQuantity]);

  return {
    inventoryData,
    isLoading,
    error,
    lastUpdated,
    fetchInventory,
    getAvailableQuantity,
    isSizeAvailable
  };
};
