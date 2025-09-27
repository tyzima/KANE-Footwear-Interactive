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
    console.log('initializeConnection called with:', {
      shopDomain,
      hasToken: !!accessToken,
      tokenPrefix: accessToken?.substring(0, 10) + '...'
    });
    
    setConnectionState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Initialize the Shopify client
      console.log('Initializing Shopify client...');
      initializeShopifyClient(shopDomain, accessToken);

      // Test the connection
      console.log('Testing Shopify connection...');
      const connectionResult = await checkShopifyConnection();
      console.log('Connection test result:', connectionResult);

      if (connectionResult.connected) {
        console.log('Connection successful, updating state...');
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
    console.log('🚨 DISCONNECT CALLED - Clearing all stored credentials');
    console.trace('Disconnect call stack');
    
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
      console.log('Checking for existing Shopify connection...');
      console.log('Current context:', {
        hostname: window.location.hostname,
        origin: window.location.origin,
        href: window.location.href,
        isEmbedded: window.self !== window.top,
        localStorage: {
          shopify_connection: !!localStorage.getItem('shopify_connection'),
          shopify_domain: localStorage.getItem('shopify_domain'),
          shopify_access_token: !!localStorage.getItem('shopify_access_token')
        }
      });
      
      // Try new storage format first
      const connectionDataStr = localStorage.getItem('shopify_connection');
      
      if (connectionDataStr) {
        try {
          const connectionData = JSON.parse(connectionDataStr);
          const now = new Date();
          const expiresAt = new Date(connectionData.expiresAt);
          
          console.log('Found stored connection data:', {
            shopDomain: connectionData.shopDomain,
            hasToken: !!connectionData.accessToken,
            expiresAt: connectionData.expiresAt,
            isExpired: now > expiresAt
          });
          
          // Check if connection has expired
          if (now > expiresAt) {
            console.log('Shopify connection expired, clearing stored data');
            localStorage.removeItem('shopify_connection');
            return;
          }
          
          console.log('Attempting to reconnect with stored credentials...');
          const result = await initializeConnection(connectionData.shopDomain, connectionData.accessToken);
          console.log('Reconnection result:', result);
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
        console.log('Found old format connection, attempting reconnect...', {
          domain: storedDomain,
          hasToken: !!storedToken
        });
        const result = await initializeConnection(storedDomain, storedToken);
        console.log('Old format reconnection result:', result);
      } else {
        console.log('No stored connection found');
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
    
    // Store the shop domain for the callback
    localStorage.setItem('shopify_oauth_shop', fullDomain);
    
    // Check if we're in an embedded context
    const isEmbedded = window.self !== window.top;
    
    console.log('OAuth Flow Debug:', {
      isEmbedded,
      windowSelf: window.self,
      windowTop: window.top,
      fullDomain,
      authUrl
    });
    
    if (isEmbedded) {
      // If embedded, we need to break out of the iframe for OAuth
      // because accounts.shopify.com cannot be displayed in iframes
      console.log('Breaking out of iframe for OAuth to:', fullDomain);
      try {
        window.top!.location.href = authUrl;
      } catch (error) {
        console.error('Failed to break out of iframe, trying fallback:', error);
        // Fallback: try to navigate the current window
        window.location.href = authUrl;
      }
    } else {
      // If not embedded, redirect normally
      console.log('Redirecting to OAuth for:', fullDomain);
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
    updateProductMetafields: shopifyAPI.updateProductMetafields,
    getProductMetafields: shopifyAPI.getProductMetafields,
  };
};
