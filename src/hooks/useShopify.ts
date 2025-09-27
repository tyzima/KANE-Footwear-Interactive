import { useState, useEffect, useCallback } from 'react';
import { 
  initializeShopifyClient, 
  checkShopifyConnection, 
  generateShopifyAuthUrl,
  shopifyAPI,
  type ShopifyProduct 
} from '@/lib/shopify';

interface ShopifyConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  shop: {
    id: string;
    name: string;
    email: string;
    domain: string;
    myshopifyDomain: string;
  } | null;
}

export const useShopify = () => {
  const [connectionState, setConnectionState] = useState<ShopifyConnectionState>({
    isConnected: false,
    isLoading: false,
    error: null,
    shop: null,
  });

  // Initialize connection with stored credentials
  const initializeConnection = useCallback(async (shopDomain: string, accessToken: string) => {
    setConnectionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Initialize the Shopify client
      initializeShopifyClient(shopDomain, accessToken);

      // Test the connection
      const connectionResult = await checkShopifyConnection();

      if (connectionResult.connected) {
        setConnectionState({
          isConnected: true,
          isLoading: false,
          error: null,
          shop: connectionResult.shop,
        });

        // Store credentials securely with expiration (30 days)
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
        
        const connectionData = {
          shopDomain,
          accessToken,
          expiresAt: expirationDate.toISOString(),
          connectedAt: new Date().toISOString(),
          shop: connectionResult.shop
        };
        
        localStorage.setItem('shopify_connection', JSON.stringify(connectionData));

        return { success: true, shop: connectionResult.shop };
      } else {
        throw new Error(connectionResult.error || 'Connection failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionState({
        isConnected: false,
        isLoading: false,
        error: errorMessage,
        shop: null,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Disconnect from Shopify
  const disconnect = useCallback(() => {
    // Clear both old and new storage formats
    localStorage.removeItem('shopify_domain');
    localStorage.removeItem('shopify_access_token');
    localStorage.removeItem('shopify_connection');
    localStorage.removeItem('shopify_oauth_shop');
    
    setConnectionState({
      isConnected: false,
      isLoading: false,
      error: null,
      shop: null,
    });
  }, []);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      // Try new storage format first
      const connectionDataStr = localStorage.getItem('shopify_connection');
      
      if (connectionDataStr) {
        try {
          const connectionData = JSON.parse(connectionDataStr);
          const now = new Date();
          const expiresAt = new Date(connectionData.expiresAt);
          
          // Check if connection has expired
          if (now > expiresAt) {
            console.log('Shopify connection expired, clearing stored data');
            localStorage.removeItem('shopify_connection');
            return;
          }
          
          console.log('Found valid stored connection, reconnecting...');
          await initializeConnection(connectionData.shopDomain, connectionData.accessToken);
          return;
        } catch (error) {
          console.error('Error parsing stored connection data:', error);
          localStorage.removeItem('shopify_connection');
        }
      }
      
      // Fallback to old storage format
      const storedDomain = localStorage.getItem('shopify_domain');
      const storedToken = localStorage.getItem('shopify_access_token');

      if (storedDomain && storedToken) {
        console.log('Found old format connection, reconnecting...');
        await initializeConnection(storedDomain, storedToken);
      }
    };

    checkExistingConnection();

    // Listen for custom connection events
    const handleConnectionEvent = () => {
      console.log('Shopify connection event received, checking connection...');
      checkExistingConnection();
    };

    window.addEventListener('shopify-connected', handleConnectionEvent);

    return () => {
      window.removeEventListener('shopify-connected', handleConnectionEvent);
    };
  }, [initializeConnection]);

  // Shopify API wrapper functions
  const getProducts = useCallback(async (limit = 50): Promise<ShopifyProduct[]> => {
    if (!connectionState.isConnected) {
      throw new Error('Not connected to Shopify');
    }
    return await shopifyAPI.getProducts(limit);
  }, [connectionState.isConnected]);

  const getProduct = useCallback(async (productId: string) => {
    if (!connectionState.isConnected) {
      throw new Error('Not connected to Shopify');
    }
    return await shopifyAPI.getProduct(productId);
  }, [connectionState.isConnected]);

  const createCustomer = useCallback(async (customerData: any) => {
    if (!connectionState.isConnected) {
      throw new Error('Not connected to Shopify');
    }
    return await shopifyAPI.createCustomer(customerData);
  }, [connectionState.isConnected]);

  const createDraftOrder = useCallback(async (orderData: any) => {
    if (!connectionState.isConnected) {
      throw new Error('Not connected to Shopify');
    }
    return await shopifyAPI.createDraftOrder(orderData);
  }, [connectionState.isConnected]);

  const getInventoryLevels = useCallback(async (inventoryItemIds: string[]) => {
    if (!connectionState.isConnected) {
      throw new Error('Not connected to Shopify');
    }
    return await shopifyAPI.getInventoryLevels(inventoryItemIds);
  }, [connectionState.isConnected]);

  // OAuth connection flow
  const connectViaOAuth = useCallback((shopDomain: string) => {
    // Clean shop domain (remove protocol, ensure .myshopify.com)
    const cleanDomain = shopDomain
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    
    const fullDomain = cleanDomain.endsWith('.myshopify.com') 
      ? cleanDomain 
      : `${cleanDomain}.myshopify.com`;

    // Generate OAuth URL
    const authUrl = generateShopifyAuthUrl(fullDomain);
    console.log('Opening OAuth URL in new window:', authUrl);
    
    // Store the shop domain for the callback
    localStorage.setItem('shopify_oauth_shop', fullDomain);
    
    // Always redirect in the same window/iframe - no popup needed
    console.log('Redirecting to OAuth URL in same window:', authUrl);
    window.location.href = authUrl;
  }, []);

  return {
    // Connection state
    ...connectionState,
    
    // Connection management
    initializeConnection,
    connectViaOAuth,
    disconnect,
    
    // API functions
    getProducts,
    getProduct,
    createCustomer,
    createDraftOrder,
    getInventoryLevels,
  };
};
