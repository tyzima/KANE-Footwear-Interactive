import { useState, useEffect, useCallback } from 'react';
import { customerShopifyAPI, type CustomerColorway, type CustomerProduct } from '@/lib/shopify-customer';

interface UseCustomerShopifyProps {
  shopDomain?: string;
  productId?: string;
}

interface CustomerShopifyState {
  isLoading: boolean;
  error: string | null;
  colorways: CustomerColorway[];
  inventory: Record<string, number>;
  product: CustomerProduct | null;
}

export const useCustomerShopify = ({ shopDomain, productId }: UseCustomerShopifyProps = {}) => {
  const [state, setState] = useState<CustomerShopifyState>({
    isLoading: false,
    error: null,
    colorways: [],
    inventory: {},
    product: null,
  });

  // Load product data (colorways + inventory)
  const loadProductData = useCallback(async (shop: string, prodId: string) => {
    console.log('Customer Shopify: Loading product data', { shop, prodId });
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Load product, colorways, and inventory in parallel
      const [product, colorways, inventory] = await Promise.all([
        customerShopifyAPI.getProduct(shop, prodId),
        customerShopifyAPI.getProductColorways(shop, prodId),
        customerShopifyAPI.getProductInventory(shop, prodId),
      ]);

      console.log('Customer Shopify: Loaded data', { 
        product: !!product, 
        colorwaysCount: colorways.length, 
        inventoryKeys: Object.keys(inventory).length 
      });

      setState({
        isLoading: false,
        error: null,
        colorways,
        inventory,
        product,
      });

      return { product, colorways, inventory };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load product data';
      console.error('Customer Shopify: Error loading product data:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return null;
    }
  }, []);

  // Load colorways only
  const loadColorways = useCallback(async (shop: string, prodId?: string) => {
    console.log('Customer Shopify: Loading colorways', { shop, prodId });
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let colorways: CustomerColorway[] = [];

      if (prodId) {
        colorways = await customerShopifyAPI.getProductColorways(shop, prodId);
      } else {
        colorways = await customerShopifyAPI.getAllColorways(shop);
      }

      console.log('Customer Shopify: Loaded colorways', { count: colorways.length });

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        colorways,
      }));

      return colorways;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load colorways';
      console.error('Customer Shopify: Error loading colorways:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return [];
    }
  }, []);

  // Load inventory only
  const loadInventory = useCallback(async (shop: string, prodId: string) => {
    console.log('Customer Shopify: Loading inventory', { shop, prodId });
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const inventory = await customerShopifyAPI.getProductInventory(shop, prodId);

      console.log('Customer Shopify: Loaded inventory', { keys: Object.keys(inventory).length });

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
        inventory,
      }));

      return inventory;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load inventory';
      console.error('Customer Shopify: Error loading inventory:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return {};
    }
  }, []);

  // Auto-load data when shopDomain and productId are provided
  useEffect(() => {
    if (shopDomain && productId) {
      console.log('Customer Shopify: Auto-loading data for', { shopDomain, productId });
      loadProductData(shopDomain, productId);
    }
  }, [shopDomain, productId, loadProductData]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (shopDomain && productId) {
      return loadProductData(shopDomain, productId);
    }
    return Promise.resolve(null);
  }, [shopDomain, productId, loadProductData]);

  return {
    // State
    ...state,
    
    // Computed
    hasData: state.colorways.length > 0 || Object.keys(state.inventory).length > 0,
    isConnected: !!(shopDomain && (state.colorways.length > 0 || state.product)),
    
    // Actions
    loadProductData,
    loadColorways,
    loadInventory,
    refresh,
  };
};

export type { CustomerColorway, CustomerProduct };
