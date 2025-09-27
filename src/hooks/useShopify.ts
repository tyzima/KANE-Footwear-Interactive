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

        // Store credentials securely (you might want to encrypt these)
        localStorage.setItem('shopify_domain', shopDomain);
        localStorage.setItem('shopify_access_token', accessToken);

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
    localStorage.removeItem('shopify_domain');
    localStorage.removeItem('shopify_access_token');
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
      const storedDomain = localStorage.getItem('shopify_domain');
      const storedToken = localStorage.getItem('shopify_access_token');

      if (storedDomain && storedToken) {
        await initializeConnection(storedDomain, storedToken);
      }
    };

    checkExistingConnection();
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
    
    // Check if we're in an iframe (embedded app)
    const isEmbedded = window.self !== window.top;
    
    if (isEmbedded) {
      // If embedded, open OAuth in a new window/tab
      const authWindow = window.open(authUrl, 'shopify-oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      // Listen for the callback message from the popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'SHOPIFY_OAUTH_SUCCESS') {
          console.log('OAuth success received from popup');
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
          
          // Reload the current page to pick up the new connection
          window.location.reload();
        } else if (event.data.type === 'SHOPIFY_OAUTH_ERROR') {
          console.error('OAuth error received from popup:', event.data.error);
          authWindow?.close();
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);
    } else {
      // If not embedded, redirect normally
      window.location.href = authUrl;
    }
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
