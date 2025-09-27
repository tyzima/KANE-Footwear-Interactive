// Shopify Checkout Integration for Customer-Facing Embeds
// Creates draft orders and redirects to Shopify checkout

interface CheckoutLineItem {
  variantId: string;
  quantity: number;
  customAttributes?: Array<{
    key: string;
    value: string;
  }>;
}

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface ColorConfiguration {
  upper: {
    baseColor: string;
    hasSplatter: boolean;
    splatterColor: string;
    splatterColor2?: string;
    splatterBaseColor?: string;
    useDualSplatter?: boolean;
    hasGradient: boolean;
    gradientColor1: string;
    gradientColor2: string;
    texture: string | null;
  };
  sole: {
    baseColor: string;
    hasSplatter: boolean;
    splatterColor: string;
    splatterColor2?: string;
    splatterBaseColor?: string;
    useDualSplatter?: boolean;
    hasGradient: boolean;
    gradientColor1: string;
    gradientColor2: string;
    texture: string | null;
  };
  laces: {
    color: string;
  };
  logo: {
    color: string;
    url: string | null;
  };
}

export interface CheckoutData {
  lineItems: CheckoutLineItem[];
  customerInfo: CustomerInfo;
  colorConfiguration: ColorConfiguration;
  notes?: string;
  screenshot?: string;
}

// Create checkout URL using Shopify's cart permalink
export const createShopifyCheckoutUrl = (
  shopDomain: string,
  lineItems: CheckoutLineItem[],
  customerInfo?: CustomerInfo
): string => {
  const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // Build cart permalink URL
  // Format: https://shop.myshopify.com/cart/VARIANT_ID:QUANTITY,VARIANT_ID:QUANTITY
  const cartItems = lineItems
    .map(item => `${item.variantId.replace('gid://shopify/ProductVariant/', '')}:${item.quantity}`)
    .join(',');
  
  let checkoutUrl = `https://${cleanDomain}/cart/${cartItems}`;
  
  // Add customer info as URL parameters if provided
  if (customerInfo) {
    const params = new URLSearchParams();
    
    if (customerInfo.email) {
      params.set('checkout[email]', customerInfo.email);
    }
    
    if (customerInfo.firstName || customerInfo.lastName) {
      params.set('checkout[shipping_address][first_name]', customerInfo.firstName || '');
      params.set('checkout[shipping_address][last_name]', customerInfo.lastName || '');
    }
    
    if (customerInfo.address) {
      params.set('checkout[shipping_address][address1]', customerInfo.address.line1);
      if (customerInfo.address.line2) {
        params.set('checkout[shipping_address][address2]', customerInfo.address.line2);
      }
      params.set('checkout[shipping_address][city]', customerInfo.address.city);
      params.set('checkout[shipping_address][province]', customerInfo.address.state);
      params.set('checkout[shipping_address][zip]', customerInfo.address.zip);
      params.set('checkout[shipping_address][country]', customerInfo.address.country);
    }
    
    if (customerInfo.phone) {
      params.set('checkout[shipping_address][phone]', customerInfo.phone);
    }
    
    if (params.toString()) {
      checkoutUrl += `?${params.toString()}`;
    }
  }
  
  return checkoutUrl;
};

// Create draft order via Admin API (for admin users)
export const createDraftOrder = async (
  shopDomain: string,
  checkoutData: CheckoutData
): Promise<{ draftOrderId: string; checkoutUrl: string }> => {
  const mutation = `
    mutation DraftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
          order {
            id
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Convert line items to draft order format
  const lineItems = checkoutData.lineItems.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity,
    customAttributes: [
      ...(item.customAttributes || []),
      // Add color configuration as custom attributes
      { key: 'Upper Color', value: checkoutData.colorConfiguration.upper.baseColor },
      { key: 'Sole Color', value: checkoutData.colorConfiguration.sole.baseColor },
      { key: 'Lace Color', value: checkoutData.colorConfiguration.laces.color },
      { key: 'Has Upper Splatter', value: checkoutData.colorConfiguration.upper.hasSplatter.toString() },
      { key: 'Has Sole Splatter', value: checkoutData.colorConfiguration.sole.hasSplatter.toString() },
      ...(checkoutData.colorConfiguration.upper.hasSplatter ? [
        { key: 'Upper Splatter Color', value: checkoutData.colorConfiguration.upper.splatterColor }
      ] : []),
      ...(checkoutData.colorConfiguration.sole.hasSplatter ? [
        { key: 'Sole Splatter Color', value: checkoutData.colorConfiguration.sole.splatterColor }
      ] : []),
      ...(checkoutData.notes ? [{ key: 'Customer Notes', value: checkoutData.notes }] : []),
      ...(checkoutData.screenshot ? [{ key: 'Design Screenshot', value: checkoutData.screenshot }] : [])
    ]
  }));

  const variables = {
    input: {
      lineItems,
      customer: {
        firstName: checkoutData.customerInfo.firstName,
        lastName: checkoutData.customerInfo.lastName,
        email: checkoutData.customerInfo.email,
        phone: checkoutData.customerInfo.phone
      },
      shippingAddress: checkoutData.customerInfo.address ? {
        firstName: checkoutData.customerInfo.firstName,
        lastName: checkoutData.customerInfo.lastName,
        address1: checkoutData.customerInfo.address.line1,
        address2: checkoutData.customerInfo.address.line2,
        city: checkoutData.customerInfo.address.city,
        province: checkoutData.customerInfo.address.state,
        zip: checkoutData.customerInfo.address.zip,
        country: checkoutData.customerInfo.address.country,
        phone: checkoutData.customerInfo.phone
      } : undefined,
      note: checkoutData.notes
    }
  };

  try {
    const response = await fetch('/.netlify/functions/shopify-api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shop-Domain': shopDomain,
      },
      body: JSON.stringify({
        query: mutation,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Draft order creation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors && data.errors.length > 0) {
      throw new Error(`Shopify GraphQL error: ${data.errors[0].message}`);
    }

    if (data.data?.draftOrderCreate?.userErrors?.length > 0) {
      const errors = data.data.draftOrderCreate.userErrors;
      throw new Error(`Draft order creation failed: ${errors.map((e: any) => e.message).join(', ')}`);
    }

    const draftOrder = data.data?.draftOrderCreate?.draftOrder;
    
    if (!draftOrder) {
      throw new Error('No draft order returned from Shopify');
    }

    return {
      draftOrderId: draftOrder.id,
      checkoutUrl: draftOrder.invoiceUrl
    };
  } catch (error) {
    console.error('Error creating draft order:', error);
    throw error;
  }
};

// Main checkout function - chooses the best method based on context
export const processCheckout = async (
  shopDomain: string,
  checkoutData: CheckoutData,
  isAdminContext: boolean = false
): Promise<{ checkoutUrl: string; method: 'cart' | 'draft_order' }> => {
  
  if (isAdminContext) {
    // For admin users, create a draft order
    console.log('Creating draft order via Admin API...');
    const result = await createDraftOrder(shopDomain, checkoutData);
    return {
      checkoutUrl: result.checkoutUrl,
      method: 'draft_order'
    };
  } else {
    // For customers, use cart permalink (simpler, no API required)
    console.log('Creating cart checkout URL...');
    const checkoutUrl = createShopifyCheckoutUrl(
      shopDomain,
      checkoutData.lineItems,
      checkoutData.customerInfo
    );
    
    return {
      checkoutUrl,
      method: 'cart'
    };
  }
};

// Helper function to map size quantities to Shopify variant IDs
export const mapSizeQuantitiesToLineItems = (
  sizeQuantities: Record<string, number>,
  productVariants: Array<{
    id: string;
    title: string;
    sku: string;
    size?: string;
  }>
): CheckoutLineItem[] => {
  const lineItems: CheckoutLineItem[] = [];
  
  Object.entries(sizeQuantities).forEach(([size, quantity]) => {
    if (quantity > 0) {
      // Find the variant that matches this size
      const variant = productVariants.find(v => {
        // Check if size is already provided
        if (v.size === size) return true;
        
        // Try to extract from title (e.g., "Men's 10", "Women's 8", "M10", "W8")
        const title = v.title || '';
        const sizeMatch = title.match(/(?:Men's|M)\s*(\d+(?:\.\d+)?)|(?:Women's|W)\s*(\d+(?:\.\d+)?)/i);
        
        if (sizeMatch) {
          const mensSize = sizeMatch[1];
          const womensSize = sizeMatch[2];
          
          if (mensSize && size === `M${mensSize}`) return true;
          if (womensSize && size === `W${womensSize}`) return true;
        }
        
        // Try to extract from SKU
        const sku = v.sku || '';
        const skuMatch = sku.match(/(?:M|MENS?)[-_]?(\d+(?:\.\d+)?)|(?:W|WOMENS?)[-_]?(\d+(?:\.\d+)?)/i);
        
        if (skuMatch) {
          const mensSize = skuMatch[1];
          const womensSize = skuMatch[2];
          
          if (mensSize && size === `M${mensSize}`) return true;
          if (womensSize && size === `W${womensSize}`) return true;
        }
        
        return false;
      });
      
      if (variant) {
        lineItems.push({
          variantId: variant.id,
          quantity
        });
      } else {
        console.warn(`Could not find variant for size: ${size}`);
      }
    }
  });
  
  return lineItems;
};
