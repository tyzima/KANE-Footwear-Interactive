import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoeViewer } from '@/components/ShoeViewer';
import { ShareButton } from '@/components/ShareButton';
import { BuyButton } from '@/components/BuyButton';
import { useShopify } from '@/hooks/useShopify';
import { useColorways } from '@/hooks/useColorways';

// This component creates an embeddable iframe version
// Usage: <iframe src="https://kaneconfig.netlify.app/embed?shop=store.myshopify.com&product=123" />
export const Embed: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { initializeFromParams, isConnected, getProduct } = useShopify();
  const { colorways } = useColorways();
  const [selectedColorway, setSelectedColorway] = useState<any>(null);
  const [colorConfiguration, setColorConfiguration] = useState<any>(null);
  const [currentProduct, setCurrentProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // URL parameters
  const shop = searchParams.get('shop');
  const productId = searchParams.get('product');
  const token = searchParams.get('token');
  const theme = searchParams.get('theme') || 'dark';
  const showBuy = searchParams.get('buy') !== 'false';
  const showShare = searchParams.get('share') !== 'false';

  useEffect(() => {
    const initializeEmbed = async () => {
      try {
        if (shop && token) {
          console.log('Initializing embed with Shopify connection...');
          await initializeFromParams(shop, token);
        } else {
          console.log('No Shopify connection params, using default mode');
        }

        if (isConnected && productId) {
          console.log('Loading product for embed:', productId);
          const product = await getProduct(productId);
          setCurrentProduct(product);
        }
      } catch (error) {
        console.error('Error initializing embed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeEmbed();
  }, [shop, token, productId, initializeFromParams, isConnected, getProduct]);

  // Auto-select colorway
  useEffect(() => {
    if (colorways.length > 0) {
      // Try to find a colorway matching the product
      let matchingColorway = null;
      
      if (currentProduct) {
        matchingColorway = colorways.find(c => 
          c.id === `product-${currentProduct.id.replace('gid://shopify/Product/', '')}` ||
          c.name.toLowerCase().includes(currentProduct.title.toLowerCase())
        );
      }

      setSelectedColorway(matchingColorway || colorways[0]);
    }
  }, [colorways, currentProduct]);

  // Set iframe-friendly styles
  useEffect(() => {
    // Remove default margins/padding for iframe
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    // Prevent parent page scrolling
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    
    window.addEventListener('wheel', preventScroll, { passive: false });
    
    return () => {
      window.removeEventListener('wheel', preventScroll);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Loading KANE Configurator...</p>
        </div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`w-full h-screen relative ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Branding */}
      <div className="absolute top-4 left-4 z-30">
        <div className={`px-3 py-1 rounded text-sm font-medium ${
          isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-gray-900'
        }`}>
          KANE Configurator
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        {showShare && (
          <ShareButton
            isDarkMode={isDark}
            getCurrentDesign={() => ({
              colorwayId: selectedColorway?.id || 'custom',
              colorConfiguration: colorConfiguration,
            })}
          />
        )}
        {showBuy && (
          <BuyButton
            isDarkMode={isDark}
            currentProduct={currentProduct}
            currentColorway={selectedColorway}
            getColorConfiguration={() => colorConfiguration}
          />
        )}
      </div>

      {/* 3D Viewer */}
      <ShoeViewer
        className="h-full"
        backgroundType={isDark ? "dark" : "light"}
        onColorConfigurationChange={setColorConfiguration}
        colorConfiguration={colorConfiguration}
        onSelectedColorwayChange={setSelectedColorway}
      />

      {/* Product Info */}
      {currentProduct && (
        <div className={`absolute bottom-4 left-4 z-30 p-3 rounded-lg max-w-xs ${
          isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-gray-900'
        }`}>
          <h3 className="font-semibold text-sm">{currentProduct.title}</h3>
          {selectedColorway && (
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedColorway.name}
            </p>
          )}
          {isConnected && (
            <div className={`text-xs mt-2 flex items-center gap-1 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Live Inventory
            </div>
          )}
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && shop && (
        <div className="absolute bottom-4 right-4 z-30">
          <div className="bg-yellow-500 text-black px-3 py-1 rounded text-xs">
            Offline Mode
          </div>
        </div>
      )}
    </div>
  );
};

export default Embed;
