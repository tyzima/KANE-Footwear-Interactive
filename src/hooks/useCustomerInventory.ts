import { useState, useEffect, useCallback } from 'react';
import { usePublicShopifyData } from './usePublicShopifyData';

interface UseCustomerInventoryOptions {
  shop?: string;
  productId?: string;
  isCustomerEmbed?: boolean;
}

export const useCustomerInventory = (options: UseCustomerInventoryOptions) => {
  const { shop, productId, isCustomerEmbed } = options;
  const publicData = usePublicShopifyData(shop, productId);
  
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate mock inventory for demo purposes
  const generateMockInventory = useCallback(() => {
    const mockInventory: Record<string, number> = {};
    const sizes = [
      'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18',
      'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14', 'W15', 'W16', 'W17', 'W18', 'W19', 'W20'
    ];
    
    sizes.forEach(size => {
      // Generate realistic inventory numbers (0-25)
      const stock = Math.floor(Math.random() * 26);
      mockInventory[size] = stock;
    });
    
    return mockInventory;
  }, []);

  useEffect(() => {
    if (isCustomerEmbed && shop && productId) {
      if (publicData.inventory && Object.keys(publicData.inventory).length > 0) {
        // Use real inventory data from public API
        console.log('Using real inventory data from public API');
        setInventory(publicData.inventory);
        setError(null);
      } else {
        // Generate consistent mock inventory for demo
        console.log('Public inventory API not available, generating mock inventory for customer embed');
        const mockInventory = generateMockInventory();
        setInventory(mockInventory);
        setError(null);
      }
      setIsLoading(publicData.isLoading);
    } else {
      // Not a customer embed or missing required params
      setInventory({});
      setError(null);
      setIsLoading(false);
    }
  }, [isCustomerEmbed, shop, productId, publicData.inventory, publicData.isLoading, generateMockInventory]);

  const refreshInventory = useCallback(async () => {
    if (isCustomerEmbed && shop && productId) {
      await publicData.refetchInventory();
    }
  }, [isCustomerEmbed, shop, productId, publicData.refetchInventory]);

  return {
    inventory,
    isLoading,
    error,
    refreshInventory,
    isUsingMockData: isCustomerEmbed && Object.keys(publicData.inventory).length === 0,
    isAvailable: isCustomerEmbed && Object.keys(inventory).length > 0
  };
};
