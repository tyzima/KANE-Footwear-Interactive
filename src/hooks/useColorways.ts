import { useState, useEffect, useCallback } from 'react';
import { useShopify } from './useShopify';
import { useShopifyCustomer } from './useShopifyCustomer';
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

export const useColorways = (shopDomain?: string, isCustomerContext = false) => {
  const { isConnected, getColorways } = useShopify();
  const customerAPI = useShopifyCustomer(isCustomerContext ? shopDomain : undefined);
  
  console.log('useColorways: Initialization:', {
    shopDomain,
    isCustomerContext,
    isConnected,
    customerAPIInitialized: !!customerAPI,
    passedShopDomain: isCustomerContext ? shopDomain : undefined
  });
  const [colorways, setColorways] = useState<Colorway[]>(colorwaysData.colorways);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load dynamic colorways from Shopify Admin API only
  const loadAdminColorways = useCallback(async () => {
    if (!isConnected) {
      console.log('Not connected to Shopify admin, using static colorways');
      setColorways(colorwaysData.colorways);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading dynamic colorways from Shopify Admin API...');
      const dynamicColorways = await getColorways();
      
      if (dynamicColorways && dynamicColorways.length > 0) {
        console.log(`Loaded ${dynamicColorways.length} dynamic colorways from Admin API`);
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

  // Sync customer API state
  useEffect(() => {
    console.log('useColorways: Checking customer context sync:', {
      isCustomerContext,
      shopDomain,
      customerAPIColorways: customerAPI.colorways.length,
      customerAPILoading: customerAPI.isLoading,
      customerAPIError: customerAPI.error,
      customerAPIUsingStorefront: customerAPI.isUsingStorefront
    });
    
    if (isCustomerContext && shopDomain) {
      console.log('Customer context detected, syncing Storefront API state');
      setIsLoading(customerAPI.isLoading);
      setError(customerAPI.error);
      
      if (customerAPI.colorways.length > 0) {
        console.log('Setting colorways from customer API:', customerAPI.colorways.length);
        setColorways(customerAPI.colorways);
        setLastUpdated(new Date());
      } else if (!customerAPI.isLoading && !customerAPI.error) {
        // Fallback to static if no customer colorways and not loading
        console.log('No customer colorways, falling back to static');
        setColorways(colorwaysData.colorways);
      }
    }
  }, [isCustomerContext, shopDomain, customerAPI.colorways, customerAPI.isLoading, customerAPI.error, customerAPI.isUsingStorefront]);

  // Load admin colorways when connected
  useEffect(() => {
    if (!isCustomerContext && isConnected) {
      loadAdminColorways();
    } else if (!isCustomerContext && !isConnected) {
      // Use static colorways when not connected and not in customer context
      setColorways(colorwaysData.colorways);
      setLastUpdated(null);
      setError(null);
    }
  }, [isConnected, isCustomerContext, loadAdminColorways]);

  // Manual refresh function
  const refreshColorways = useCallback(async () => {
    if (isCustomerContext && shopDomain) {
      await customerAPI.refreshColorways();
    } else if (isConnected) {
      await loadAdminColorways();
    }
  }, [isConnected, isCustomerContext, shopDomain, customerAPI.refreshColorways, loadAdminColorways]);

  return {
    colorways,
    isLoading,
    error,
    lastUpdated,
    refreshColorways,
    isUsingDynamicData: (isCustomerContext && customerAPI.isUsingStorefront) || (isConnected && !error),
    totalCount: colorways.length
  };
};
