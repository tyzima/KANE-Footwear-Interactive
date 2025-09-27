import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShopifyProductEmbed } from '@/components/ShopifyProductEmbed';

// This component handles requests from Shopify's App Proxy
// URLs like: https://yourstore.com/apps/kane/configurator?product_id=123&shop=store.myshopify.com
export const AppProxy: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isValidRequest, setIsValidRequest] = useState(false);

  // Extract Shopify proxy parameters
  const shop = searchParams.get('shop');
  const productId = searchParams.get('product_id');
  const productHandle = searchParams.get('product_handle');
  const timestamp = searchParams.get('timestamp');
  const signature = searchParams.get('signature');

  useEffect(() => {
    // Validate the request is from Shopify
    // In production, you should verify the signature
    const validateShopifyRequest = () => {
      if (!shop || !timestamp) {
        console.error('Missing required Shopify proxy parameters');
        return false;
      }

      // TODO: Verify HMAC signature in production
      // const calculatedSignature = crypto
      //   .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
      //   .update(queryString)
      //   .digest('hex');
      
      return true;
    };

    setIsValidRequest(validateShopifyRequest());
  }, [shop, timestamp, signature]);

  if (!isValidRequest) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Invalid Request</h2>
          <p className="text-red-600">This configurator can only be accessed from a Shopify store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ShopifyProductEmbed
        productId={productId || undefined}
        shopDomain={shop || undefined}
        productHandle={productHandle || undefined}
      />
    </div>
  );
};

export default AppProxy;
