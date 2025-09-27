// Shopify Storefront API Client
// This is used for customer-facing requests that don't require admin authentication

// Helper function to make GraphQL requests to Shopify Storefront API via Netlify function
const makeStorefrontRequest = async (shopDomain: string, query: string, variables?: any) => {
  console.log('Making Storefront API request to:', shopDomain);
  
  const response = await fetch('/.netlify/functions/shopify-storefront', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shop-Domain': shopDomain,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Storefront API request failed:', response.status, errorData);
    throw new Error(errorData.error || `Storefront API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Storefront API response received:', data);
  
  if (data.errors && data.errors.length > 0) {
    console.error('Storefront API GraphQL errors:', data.errors);
    throw new Error(`Shopify Storefront GraphQL error: ${data.errors[0].message}`);
  }

  return data;
};

// Shopify Storefront API Helper Functions
export const storefrontAPI = {
  // Get products with metafields (for colorways)
  async getProducts(shopDomain: string, limit = 50) {
    const query = `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              productType
              vendor
              tags
              variants(first: 50) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                    quantityAvailable
                    sku
                  }
                }
              }
              metafields(identifiers: [
                {namespace: "custom", key: "upper_base_hex"},
                {namespace: "custom", key: "upper_darkbase_hex"},
                {namespace: "custom", key: "upper_splatter_hex"},
                {namespace: "custom", key: "upper_splatter2_hex"},
                {namespace: "custom", key: "sole_base_hex"},
                {namespace: "custom", key: "sole_splatter_hex"},
                {namespace: "custom", key: "sole_splatter2_hex"},
                {namespace: "custom", key: "lace_color_hex"}
              ]) {
                namespace
                key
                value
                type
              }
              images(first: 5) {
                edges {
                  node {
                    id
                    url
                    altText
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await makeStorefrontRequest(shopDomain, query, { first: limit });
    return response.data?.products?.edges?.map((edge: any) => ({
      ...edge.node,
      variants: edge.node.variants.edges.map((vEdge: any) => vEdge.node),
      images: edge.node.images.edges.map((iEdge: any) => iEdge.node),
    })) || [];
  },

  // Get specific product by ID
  async getProduct(shopDomain: string, productId: string) {
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          description
          productType
          vendor
          tags
          variants(first: 50) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
                sku
              }
            }
          }
          metafields(identifiers: [
            {namespace: "custom", key: "upper_base_hex"},
            {namespace: "custom", key: "upper_darkbase_hex"},
            {namespace: "custom", key: "upper_splatter_hex"},
            {namespace: "custom", key: "upper_splatter2_hex"},
            {namespace: "custom", key: "sole_base_hex"},
            {namespace: "custom", key: "sole_splatter_hex"},
            {namespace: "custom", key: "sole_splatter2_hex"},
            {namespace: "custom", key: "lace_color_hex"}
          ]) {
            namespace
            key
            value
            type
          }
          images(first: 5) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
        }
      }
    `;

    const response = await makeStorefrontRequest(shopDomain, query, { id: productId });
    const product = response.data?.product;
    if (product) {
      return {
        ...product,
        variants: product.variants.edges.map((vEdge: any) => vEdge.node),
        images: product.images.edges.map((iEdge: any) => iEdge.node),
      };
    }
    return null;
  },

  // Get product by handle (for URL-based access)
  async getProductByHandle(shopDomain: string, handle: string) {
    const query = `
      query getProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
          id
          title
          handle
          description
          productType
          vendor
          tags
          variants(first: 50) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
                sku
              }
            }
          }
          metafields(identifiers: [
            {namespace: "custom", key: "upper_base_hex"},
            {namespace: "custom", key: "upper_darkbase_hex"},
            {namespace: "custom", key: "upper_splatter_hex"},
            {namespace: "custom", key: "upper_splatter2_hex"},
            {namespace: "custom", key: "sole_base_hex"},
            {namespace: "custom", key: "sole_splatter_hex"},
            {namespace: "custom", key: "sole_splatter2_hex"},
            {namespace: "custom", key: "lace_color_hex"}
          ]) {
            namespace
            key
            value
            type
          }
          images(first: 5) {
            edges {
              node {
                id
                url
                altText
              }
            }
          }
        }
      }
    `;

    const response = await makeStorefrontRequest(shopDomain, query, { handle });
    const product = response.data?.productByHandle;
    if (product) {
      return {
        ...product,
        variants: product.variants.edges.map((vEdge: any) => vEdge.node),
        images: product.images.edges.map((iEdge: any) => iEdge.node),
      };
    }
    return null;
  }
};

// Transform Storefront API product data to colorways
export const getColorwaysFromStorefront = async (shopDomain: string) => {
  console.log('Fetching colorways from Shopify Storefront API...');
  
  try {
    // Get all products with their metafields
    const products = await storefrontAPI.getProducts(shopDomain, 100);
    console.log('Storefront API products response:', products.length, 'products');
    
    // Debug: Log first product's metafields structure
    if (products.length > 0) {
      console.log('First product metafields:', products[0].metafields);
    }
  
  const colorways = products
    .filter(product => {
      // Only include products that have at least some colorway metafields
      return product.metafields && product.metafields.some((m: any) => 
        m && m.key && ['upper_base_hex', 'sole_base_hex', 'lace_color_hex'].includes(m.key)
      );
    })
    .map(product => {
      // Transform product metafields into colorway format
      const metafields = product.metafields || [];
      
      // Helper function to get metafield value
      const getMetafield = (key: string) => {
        const field = metafields.find((m: any) => m && m.key === key && m.namespace === 'custom');
        return field?.value || null;
      };
      
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
      
      return {
        id: `product-${product.id.replace('gid://shopify/Product/', '')}`,
        productId: product.id.replace('gid://shopify/Product/', ''),
        name: product.title,
        description: product.description || `Custom colorway for ${product.title}`,
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
          splatterBaseColor: upperDarkBaseColor, // Use upper dark base for sole splatter base
          splatterColor2: soleSplatterColor2,
          useDualSplatter: soleUseDualSplatter,
        },
        laces: {
          color: laceColor,
        },
      };
    });

    console.log(`Generated ${colorways.length} colorways from Shopify Storefront API:`, colorways);
    return colorways;
    
  } catch (error) {
    console.error('Error in getColorwaysFromStorefront:', error);
    throw error;
  }
};

// Get inventory for a specific product
export const getProductInventory = async (shopDomain: string, productId: string) => {
  const product = await storefrontAPI.getProduct(shopDomain, productId);
  
  if (!product || !product.variants) {
    return {};
  }

  // Transform variants into inventory data
  const inventory: Record<string, number> = {};
  
  product.variants.forEach((variant: any) => {
    // Extract size from variant title or SKU
    const size = extractSizeFromVariant(variant);
    if (size && variant.availableForSale) {
      inventory[size] = variant.quantityAvailable || 0;
    }
  });

  return inventory;
};

// Helper function to extract size from variant
const extractSizeFromVariant = (variant: { title?: string; sku?: string }) => {
  // Try to extract from title (e.g., "Men's 10", "Women's 8", "M10", "W8")
  const title = variant.title || '';
  const sku = variant.sku || '';
  
  // Common size patterns
  const patterns = [
    /\b(M|Men's?)\s*(\d+(?:\.\d+)?)\b/i,
    /\b(W|Women's?)\s*(\d+(?:\.\d+)?)\b/i,
    /\bSize\s*(\d+(?:\.\d+)?)\b/i,
    /\b(\d+(?:\.\d+)?)\b/
  ];
  
  for (const pattern of patterns) {
    const titleMatch = title.match(pattern);
    if (titleMatch) {
      const prefix = titleMatch[1];
      const size = titleMatch[2] || titleMatch[1];
      
      if (prefix && prefix.toLowerCase().startsWith('w')) {
        return `W${size}`;
      } else if (prefix && prefix.toLowerCase().startsWith('m')) {
        return `M${size}`;
      } else {
        // Default to men's if no prefix
        return `M${size}`;
      }
    }
    
    const skuMatch = sku.match(pattern);
    if (skuMatch) {
      const prefix = skuMatch[1];
      const size = skuMatch[2] || skuMatch[1];
      
      if (prefix && prefix.toLowerCase().startsWith('w')) {
        return `W${size}`;
      } else if (prefix && prefix.toLowerCase().startsWith('m')) {
        return `M${size}`;
      } else {
        return `M${size}`;
      }
    }
  }
  
  return null;
};
