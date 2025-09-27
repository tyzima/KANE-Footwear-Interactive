// Customer-facing Shopify API client using Storefront API
// This doesn't require authentication and can be used by customers

interface CustomerColorway {
  id: string;
  name: string;
  description: string;
  upper: {
    baseColor: string;
    hasSplatter: boolean;
    splatterColor: string | null;
    splatterBaseColor: string | null;
    splatterColor2: string | null;
    useDualSplatter: boolean;
  };
  sole: {
    baseColor: string;
    hasSplatter: boolean;
    splatterColor: string | null;
    splatterBaseColor: string | null;
    splatterColor2: string | null;
    useDualSplatter: boolean;
  };
  laces: {
    color: string;
  };
  productId?: string;
}

interface CustomerProduct {
  id: string;
  title: string;
  handle: string;
  variants: Array<{
    id: string;
    title: string;
    availableForSale: boolean;
    quantityAvailable: number;
    price: {
      amount: string;
      currencyCode: string;
    };
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
  }>;
  metafields: Array<{
    key: string;
    value: string;
    namespace: string;
  }>;
}

// Helper function to make requests to our customer Storefront API
const makeCustomerStorefrontRequest = async (shopDomain: string, query: string, variables?: any, action?: string) => {
  const response = await fetch('/.netlify/functions/shopify-storefront', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shop-Domain': shopDomain,
    },
    body: JSON.stringify({
      query,
      variables,
      action,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Customer API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`Shopify Storefront error: ${data.errors[0].message}`);
  }

  return data;
};

// Customer-facing API functions
export const customerShopifyAPI = {
  // Get product by ID with variants and inventory
  async getProduct(shopDomain: string, productId: string): Promise<CustomerProduct | null> {
    console.log('Customer API: Getting product', { shopDomain, productId });
    
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          metafields(first: 50, namespace: "custom") {
            key
            value
            namespace
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                availableForSale
                quantityAvailable
                price {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await makeCustomerStorefrontRequest(
        shopDomain, 
        query, 
        { id: productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}` },
        'getProduct'
      );

      const product = response.data?.product;
      if (!product) return null;

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        variants: product.variants.edges.map((edge: any) => edge.node),
        metafields: product.metafields || [],
      };
    } catch (error) {
      console.error('Customer API: Error getting product:', error);
      return null;
    }
  },

  // Get colorways for a specific product
  async getProductColorways(shopDomain: string, productId: string): Promise<CustomerColorway[]> {
    console.log('Customer API: Getting product colorways', { shopDomain, productId });
    
    try {
      const product = await this.getProduct(shopDomain, productId);
      if (!product || !product.metafields) {
        console.log('Customer API: No product or metafields found');
        return [];
      }

      // Transform product metafields into colorway format
      const metafields = product.metafields;
      
      // Helper function to get metafield value
      const getMetafield = (key: string) => {
        const field = metafields.find(m => m.key === key && m.namespace === 'custom');
        return field?.value || null;
      };

      // Check if this product has colorway data
      const hasColorwayData = metafields.some(m => 
        ['upper_base_hex', 'sole_base_hex', 'lace_color_hex'].includes(m.key)
      );

      if (!hasColorwayData) {
        console.log('Customer API: No colorway metafields found for product');
        return [];
      }

      // Extract colorway data from metafields
      const upperBaseColor = getMetafield('upper_base_hex') || '#000000';
      const upperDarkBaseColor = getMetafield('upper_darkbase_hex') || null;
      const upperSplatterColor = getMetafield('upper_splatter_hex') || null;
      const upperSplatterColor2 = getMetafield('upper_splatter2_hex') || null;
      const soleBaseColor = getMetafield('sole_base_hex') || '#000000';
      const soleSplatterColor = getMetafield('sole_splatter_hex') || null;
      const soleSplatterColor2 = getMetafield('sole_splatter2_hex') || null;
      const laceColor = getMetafield('lace_color_hex') || '#FFFFFF';
      
      // Determine if splatter is enabled
      const upperHasSplatter = !!(upperSplatterColor && upperSplatterColor !== '#000000');
      const soleHasSplatter = !!(soleSplatterColor && soleSplatterColor !== '#000000');
      
      // Determine if dual splatter is enabled
      const upperUseDualSplatter = !!(upperSplatterColor2 && upperSplatterColor2 !== '#000000');
      const soleUseDualSplatter = !!(soleSplatterColor2 && soleSplatterColor2 !== '#000000');

      const colorway: CustomerColorway = {
        id: `product-${productId}`,
        name: product.title,
        description: `Custom colorway for ${product.title}`,
        productId: productId,
        upper: {
          baseColor: upperBaseColor,
          hasSplatter: upperHasSplatter,
          splatterColor: upperSplatterColor,
          splatterBaseColor: upperDarkBaseColor,
          splatterColor2: upperSplatterColor2,
          useDualSplatter: upperUseDualSplatter,
        },
        sole: {
          baseColor: soleBaseColor,
          hasSplatter: soleHasSplatter,
          splatterColor: soleSplatterColor,
          splatterBaseColor: null, // Not used for sole
          splatterColor2: soleSplatterColor2,
          useDualSplatter: soleUseDualSplatter,
        },
        laces: {
          color: laceColor,
        },
      };

      console.log('Customer API: Generated colorway from product:', colorway);
      return [colorway];

    } catch (error) {
      console.error('Customer API: Error getting product colorways:', error);
      return [];
    }
  },

  // Get inventory for a product
  async getProductInventory(shopDomain: string, productId: string): Promise<Record<string, number>> {
    console.log('Customer API: Getting product inventory', { shopDomain, productId });
    
    try {
      const product = await this.getProduct(shopDomain, productId);
      if (!product) {
        console.log('Customer API: Product not found for inventory');
        return {};
      }

      const inventory: Record<string, number> = {};

      product.variants.forEach(variant => {
        // Extract size from variant title or selected options
        let size = '';
        
        // Try to get size from selectedOptions first
        const sizeOption = variant.selectedOptions.find(option => 
          option.name.toLowerCase() === 'size'
        );
        
        if (sizeOption) {
          size = sizeOption.value;
        } else {
          // Fallback: extract from title
          const sizeMatch = variant.title.match(/\b([MW]?\d+(?:\.\d+)?)\b/);
          if (sizeMatch) {
            size = sizeMatch[1];
            // Ensure proper format (M10, W12, etc.)
            if (!size.startsWith('M') && !size.startsWith('W')) {
              // Default to men's sizing if no prefix
              size = `M${size}`;
            }
          }
        }

        if (size && variant.availableForSale) {
          inventory[size] = variant.quantityAvailable || 0;
        }
      });

      console.log('Customer API: Generated inventory:', inventory);
      return inventory;

    } catch (error) {
      console.error('Customer API: Error getting product inventory:', error);
      return {};
    }
  },

  // Get all colorways from all products (for general browsing)
  async getAllColorways(shopDomain: string): Promise<CustomerColorway[]> {
    console.log('Customer API: Getting all colorways', { shopDomain });
    
    // For now, return empty array since we need product-specific colorways
    // In the future, this could query multiple products
    return [];
  },
};

export type { CustomerColorway, CustomerProduct };
