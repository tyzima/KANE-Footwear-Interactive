import React, { useEffect, useState } from 'react';
import { ShoeViewer } from './ShoeViewer';
import { ShareButton } from './ShareButton';
import { BuyButton } from './BuyButton';
import { useShopify } from '@/hooks/useShopify';
import { useColorways } from '@/hooks/useColorways';
import { toast } from './ui/use-toast';

interface ShopifyProductEmbedProps {
  // These props will be passed from the Shopify product page
  productId?: string;
  shopDomain?: string;
  productHandle?: string;
}

export const ShopifyProductEmbed: React.FC<ShopifyProductEmbedProps> = ({
  productId,
  shopDomain,
  productHandle
}) => {
  const { initializeConnection, isConnected, getProduct } = useShopify();
  const { colorways, refreshColorways } = useColorways();
  const [selectedColorway, setSelectedColorway] = useState<any>(null);
  const [colorConfiguration, setColorConfiguration] = useState<any>(null);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Shopify connection for embedded context
  useEffect(() => {
    const initializeEmbeddedShopify = async () => {
      try {
        // Extract shop domain from current URL or use provided one
        const embedShopDomain = shopDomain || 
          new URLSearchParams(window.location.search).get('shop') ||
          window.location.hostname.replace('.myshopify.com', '');

        if (embedShopDomain) {
          console.log('Initializing embedded Shopify connection for:', embedShopDomain);
          
          // For embedded apps, we need to use a different approach
          // We'll use the Shopify Admin API with the shop's access token
          // This requires the shop to have installed your app
          
          // Check if we can access Shopify context
          if (window.ShopifyAnalytics?.meta?.shop?.domain) {
            const shopifyShopDomain = window.ShopifyAnalytics.meta.shop.domain;
            console.log('Found Shopify context:', shopifyShopDomain);
            
            // Initialize connection with shop context
            // Note: In production, you'd need proper authentication
            await initializeConnection(shopifyShopDomain, 'embedded-context');
          }
        }
      } catch (error) {
        console.error('Error initializing embedded Shopify:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeEmbeddedShopify();
  }, [shopDomain, initializeConnection]);

  // Load specific product data when connected
  useEffect(() => {
    const loadProductData = async () => {
      if (!isConnected || !productId) return;

      try {
        console.log('Loading product data for embed:', productId);
        const product = await getProduct(productId);
        setCurrentProduct(product);

        // Refresh colorways to get the latest from this shop
        await refreshColorways();
      } catch (error) {
        console.error('Error loading product for embed:', error);
        toast({
          title: "Product Loading Error",
          description: "Could not load product data for customization.",
          variant: "destructive",
        });
      }
    };

    loadProductData();
  }, [isConnected, productId, getProduct, refreshColorways]);

  // Find matching colorway for this product
  useEffect(() => {
    if (currentProduct && colorways.length > 0) {
      // Look for a colorway that matches this product
      const matchingColorway = colorways.find(c => 
        c.id === `product-${currentProduct.id.replace('gid://shopify/Product/', '')}` ||
        c.name.toLowerCase().includes(currentProduct.title.toLowerCase())
      );

      if (matchingColorway) {
        setSelectedColorway(matchingColorway);
        console.log('Found matching colorway for product:', matchingColorway);
      } else {
        // Use first available colorway as fallback
        setSelectedColorway(colorways[0]);
        console.log('Using fallback colorway:', colorways[0]);
      }
    }
  }, [currentProduct, colorways]);

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading KANE Configurator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      {/* Embedded Badge */}
      <div className="absolute top-4 left-4 z-30 bg-black/70 text-white text-xs px-2 py-1 rounded">
        KANE Configurator
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
        <BuyButton
          isDarkMode={true}
          currentProduct={currentProduct}
          currentColorway={selectedColorway}
          getColorConfiguration={() => colorConfiguration}
        />
        <ShareButton
          isDarkMode={true}
          getCurrentDesign={() => ({
            colorwayId: selectedColorway?.id || 'custom',
            // Add other design state here
          })}
        />
      </div>

      {/* 3D Viewer */}
      <ShoeViewer
        className="h-full"
        backgroundType="dark"
        onColorConfigurationChange={setColorConfiguration}
        colorConfiguration={colorConfiguration}
        onSelectedColorwayChange={setSelectedColorway}
      />

      {/* Product Info Overlay */}
      {currentProduct && (
        <div className="absolute bottom-4 left-4 z-30 bg-black/70 text-white p-3 rounded-lg max-w-xs">
          <h3 className="font-semibold text-sm">{currentProduct.title}</h3>
          {selectedColorway && (
            <p className="text-xs text-gray-300 mt-1">
              Colorway: {selectedColorway.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Script to auto-initialize embeds on Shopify pages
export const initializeShopifyEmbeds = () => {
  // Look for embed containers on the page
  const embedContainers = document.querySelectorAll('[data-kane-embed]');
  
  embedContainers.forEach((container) => {
    const productId = container.getAttribute('data-product-id');
    const shopDomain = container.getAttribute('data-shop-domain');
    const productHandle = container.getAttribute('data-product-handle');

    // Mount React component to this container
    // This would be done with your React rendering setup
    console.log('Found KANE embed container:', { productId, shopDomain, productHandle });
  });
};
