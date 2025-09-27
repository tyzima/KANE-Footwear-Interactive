import { useState, useEffect, useCallback } from 'react';
import { storefrontAPI, getColorwaysFromStorefront, getProductInventory } from '@/lib/shopify-storefront';
import { Colorway } from './useColorways';

interface ShopifyCustomerState {
  isLoading: boolean;
  error: string | null;
  colorways: Colorway[];
  isUsingStorefront: boolean;
}

// Hook for customer-facing Shopify interactions using Storefront API
export const useShopifyCustomer = (shopDomain?: string) => {
  const [state, setState] = useState<ShopifyCustomerState>({
    isLoading: false,
    error: null,
    colorways: [],
    isUsingStorefront: false,
  });

  // Load colorways from Storefront API
  const loadColorways = useCallback(async () => {
    if (!shopDomain) {
      console.log('No shop domain provided for customer API');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Loading colorways from Storefront API for:', shopDomain);
      const colorways = await getColorwaysFromStorefront(shopDomain);
      
      setState(prev => ({
        ...prev,
        colorways,
        isUsingStorefront: true,
        isLoading: false,
        error: null,
      }));
      
      console.log(`Loaded ${colorways.length} colorways from Storefront API`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load colorways';
      console.error('Error loading colorways from Storefront API:', err);
      
      // If it's a "not configured" error, don't set it as an error state
      // This allows fallback to static colorways
      const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('SHOPIFY_STOREFRONT_ACCESS_TOKEN');
      
      setState(prev => ({
        ...prev,
        error: isConfigError ? null : errorMessage,
        isLoading: false,
        colorways: [], // Clear colorways on error
      }));
      
      if (isConfigError) {
        console.log('Storefront API not configured, will fallback to static colorways');
      }
    }
  }, [shopDomain]);

  // Load product inventory
  const loadProductInventory = useCallback(async (productId: string) => {
    if (!shopDomain) {
      console.log('No shop domain provided for inventory lookup');
      return {};
    }

    try {
      console.log('Loading inventory from Storefront API for product:', productId);
      const inventory = await getProductInventory(shopDomain, productId);
      console.log('Loaded inventory:', inventory);
      return inventory;
    } catch (err) {
      console.error('Error loading inventory from Storefront API:', err);
      return {};
    }
  }, [shopDomain]);

  // Get specific product
  const getProduct = useCallback(async (productId: string) => {
    if (!shopDomain) {
      console.log('No shop domain provided for product lookup');
      return null;
    }

    try {
      console.log('Loading product from Storefront API:', productId);
      const product = await storefrontAPI.getProduct(shopDomain, productId);
      return product;
    } catch (err) {
      console.error('Error loading product from Storefront API:', err);
      return null;
    }
  }, [shopDomain]);

  // Get product by handle
  const getProductByHandle = useCallback(async (handle: string) => {
    if (!shopDomain) {
      console.log('No shop domain provided for product lookup');
      return null;
    }

    try {
      console.log('Loading product by handle from Storefront API:', handle);
      const product = await storefrontAPI.getProductByHandle(shopDomain, handle);
      return product;
    } catch (err) {
      console.error('Error loading product by handle from Storefront API:', err);
      return null;
    }
  }, [shopDomain]);

  // Auto-load colorways when shop domain is provided
  useEffect(() => {
    if (shopDomain) {
      loadColorways();
    }
  }, [shopDomain, loadColorways]);

  return {
    ...state,
    loadColorways,
    loadProductInventory,
    getProduct,
    getProductByHandle,
    refreshColorways: loadColorways,
  };
};
