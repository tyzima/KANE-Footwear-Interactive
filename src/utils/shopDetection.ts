/**
 * Utility functions for detecting shop domain in embedded contexts
 */

// Extract shop domain from URL parameters (for embedded apps)
export const getShopFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  
  if (shop) {
    // Clean the shop domain (remove .myshopify.com if present, then add it back)
    const cleanShop = shop.replace('.myshopify.com', '');
    return `${cleanShop}.myshopify.com`;
  }
  
  return null;
};

// Extract shop domain from referrer (for embedded iframes)
export const getShopFromReferrer = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const referrer = document.referrer;
    if (referrer) {
      const url = new URL(referrer);
      const hostname = url.hostname;
      
      // Check if it's a Shopify admin URL
      if (hostname.includes('admin.shopify.com')) {
        // Extract shop from admin URL like: https://admin.shopify.com/store/shop-name
        const pathParts = url.pathname.split('/');
        const storeIndex = pathParts.indexOf('store');
        if (storeIndex !== -1 && pathParts[storeIndex + 1]) {
          const shopName = pathParts[storeIndex + 1];
          return `${shopName}.myshopify.com`;
        }
      } else if (hostname.endsWith('.myshopify.com')) {
        // Direct myshopify.com domain
        return hostname;
      }
    }
  } catch (error) {
    console.warn('Error parsing referrer for shop domain:', error);
  }
  
  return null;
};

// Get shop domain from environment variable (for static embedding)
export const getShopFromEnv = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Check for shop domain in environment variables
  const envShop = import.meta.env?.VITE_SHOPIFY_SHOP_DOMAIN;
  if (envShop) {
    const cleanShop = envShop.replace('.myshopify.com', '');
    return `${cleanShop}.myshopify.com`;
  }
  
  return null;
};

// Try all methods to detect shop domain
export const detectShopDomain = (): string | null => {
  // Try URL parameters first (most reliable for embedded apps)
  const shopFromUrl = getShopFromUrl();
  if (shopFromUrl) {
    console.log('Shop domain detected from URL:', shopFromUrl);
    return shopFromUrl;
  }
  
  // Try referrer (for iframe embeds)
  const shopFromReferrer = getShopFromReferrer();
  if (shopFromReferrer) {
    console.log('Shop domain detected from referrer:', shopFromReferrer);
    return shopFromReferrer;
  }
  
  // Try environment variable (for static setups)
  const shopFromEnv = getShopFromEnv();
  if (shopFromEnv) {
    console.log('Shop domain detected from environment:', shopFromEnv);
    return shopFromEnv;
  }
  
  console.log('No shop domain detected');
  return null;
};

// Check if we're in an embedded context
export const isEmbeddedContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if we're in an iframe
  const inIframe = window !== window.top;
  
  // Check if URL has embedded-related parameters
  const hasEmbedParams = window.location.search.includes('shop=') || 
                        window.location.search.includes('embedded=') ||
                        window.location.pathname.includes('shopify');
  
  // Check if referrer is from Shopify
  const hasShopifyReferrer = document.referrer.includes('shopify.com');
  
  return inIframe || hasEmbedParams || hasShopifyReferrer;
};
