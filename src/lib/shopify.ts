// Note: We use direct fetch calls instead of @shopify/admin-api-client 
// because that library is server-side only and cannot be used in browsers

// Shopify App Configuration
export const SHOPIFY_CONFIG = {
  clientId: 'd4d69ee44cf2dd4522f73989a961c273',
  clientSecret: '3c4fbf1eb5b479e223c4f940871bd489',
  scopes: [
    'read_products',
    'write_products',
    'read_customers',
    'write_customers',
    'read_orders',
    'write_orders',
    'read_draft_orders',
    'write_draft_orders',
    'read_inventory',
    'write_inventory',
  ],
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/auth/shopify/callback` : '',
};

// Shopify connection configuration
let shopifyConfig: {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
} | null = null;

export const initializeShopifyClient = (shopDomain: string, accessToken: string) => {
  shopifyConfig = {
    storeDomain: shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    accessToken: accessToken,
    apiVersion: '2024-01',
  };
  return shopifyConfig;
};

export const getShopifyConfig = () => {
  if (!shopifyConfig) {
    throw new Error('Shopify client not initialized. Please call initializeShopifyClient first.');
  }
  return shopifyConfig;
};

// Helper function to make GraphQL requests to Shopify via Netlify function
const makeShopifyRequest = async (query: string, variables?: any) => {
  const config = getShopifyConfig();
  
  const response = await fetch('/.netlify/functions/shopify-api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': config.accessToken,
      'X-Shop-Domain': config.storeDomain,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Shopify API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`Shopify GraphQL error: ${data.errors[0].message}`);
  }

  return data;
};

// OAuth URL Generator
export const generateShopifyAuthUrl = (shopDomain: string) => {
  const params = new URLSearchParams({
    client_id: SHOPIFY_CONFIG.clientId,
    scope: SHOPIFY_CONFIG.scopes.join(','),
    redirect_uri: SHOPIFY_CONFIG.redirectUri,
    state: generateRandomState(),
  });

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
};

// Generate random state for OAuth security
const generateRandomState = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Exchange OAuth code for access token via Netlify function
export const exchangeCodeForToken = async (shopDomain: string, code: string): Promise<string> => {
  const response = await fetch('/.netlify/functions/shopify-oauth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shop: shopDomain,
      code: code,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `OAuth token exchange failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error('No access token received from server');
  }

  return data.access_token;
};

// Shopify API Helper Functions
export const shopifyAPI = {
  // Products
  async getProducts(limit = 50) {
    const query = `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
              description
              status
              productType
              vendor
              tags
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price
                    inventoryQuantity
                    sku
                    barcode
                    availableForSale
                  }
                }
              }
              metafields(first: 20, namespace: "custom") {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                    type
                  }
                }
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

    const response = await makeShopifyRequest(query, { first: limit });
    return response.data?.products?.edges?.map((edge: any) => ({
      ...edge.node,
      variants: edge.node.variants.edges.map((vEdge: any) => vEdge.node),
      metafields: edge.node.metafields.edges.map((mEdge: any) => mEdge.node),
      images: edge.node.images.edges.map((iEdge: any) => iEdge.node),
    })) || [];
  },

  // Get specific product by ID
  async getProduct(productId: string) {
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          description
          status
          productType
          vendor
          tags
          variants(first: 50) {
            edges {
              node {
                id
                title
                price
                inventoryQuantity
                sku
                barcode
                availableForSale
              }
            }
          }
          metafields(first: 50) {
            edges {
              node {
                id
                namespace
                key
                value
                type
              }
            }
          }
        }
      }
    `;

    const response = await makeShopifyRequest(query, { id: productId });
    const product = response.data?.product;
    if (product) {
      return {
        ...product,
        variants: product.variants.edges.map((vEdge: any) => vEdge.node),
        metafields: product.metafields.edges.map((mEdge: any) => mEdge.node),
      };
    }
    return null;
  },

  // Customers
  async createCustomer(customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      address1: string;
      city: string;
      province: string;
      country: string;
      zip: string;
    };
  }) {
    const client = getShopifyClient();
    const mutation = `
      mutation createCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
          customer {
            id
            firstName
            lastName
            email
            phone
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.request(mutation, {
      variables: {
        input: customerData,
      },
    });

    if (response.data?.customerCreate?.userErrors?.length > 0) {
      throw new Error(`Customer creation failed: ${response.data.customerCreate.userErrors[0].message}`);
    }

    return response.data?.customerCreate?.customer;
  },

  // Draft Orders
  async createDraftOrder(orderData: {
    customerId?: string;
    lineItems: Array<{
      variantId: string;
      quantity: number;
      customAttributes?: Array<{ key: string; value: string }>;
    }>;
    shippingAddress?: {
      firstName: string;
      lastName: string;
      address1: string;
      city: string;
      province: string;
      country: string;
      zip: string;
    };
    note?: string;
  }) {
    const client = getShopifyClient();
    const mutation = `
      mutation createDraftOrder($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            name
            email
            phone
            totalPrice
            subtotalPrice
            totalTax
            status
            invoiceUrl
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPrice
                  variant {
                    id
                    title
                  }
                  customAttributes {
                    key
                    value
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.request(mutation, {
      variables: {
        input: orderData,
      },
    });

    if (response.data?.draftOrderCreate?.userErrors?.length > 0) {
      throw new Error(`Draft order creation failed: ${response.data.draftOrderCreate.userErrors[0].message}`);
    }

    return response.data?.draftOrderCreate?.draftOrder;
  },

  // Inventory
  async getInventoryLevels(inventoryItemIds: string[]) {
    const client = getShopifyClient();
    const query = `
      query getInventoryLevels($inventoryItemIds: [ID!]!) {
        inventoryItems(first: 50, query: $inventoryItemIds) {
          edges {
            node {
              id
              sku
              inventoryLevels(first: 10) {
                edges {
                  node {
                    id
                    available
                    location {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await makeShopifyRequest(query, { inventoryItemIds });

    return response.data?.inventoryItems?.edges?.map((edge: any) => edge.node) || [];
  },

  // Update product metafields
  async updateProductMetafields(productId: string, metafields: Record<string, string>) {
    console.log('updateProductMetafields called with:', { productId, metafields });
    
    const metafieldInputs = Object.entries(metafields).map(([key, value]) => ({
      namespace: 'custom',
      key: key,
      value: value,
      type: 'color'
    }));

    const mutation = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            metafields(first: 50) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const finalProductId = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`;
    console.log('Using product ID for mutation:', finalProductId);
    
    const input = {
      id: finalProductId,
      metafields: metafieldInputs
    };

    console.log('GraphQL input:', JSON.stringify(input, null, 2));
    const response = await makeShopifyRequest(mutation, { input });
    console.log('GraphQL response:', JSON.stringify(response, null, 2));
    
    if (response.data?.productUpdate?.userErrors?.length > 0) {
      console.error('Shopify API user errors:', response.data.productUpdate.userErrors);
      throw new Error(response.data.productUpdate.userErrors[0].message);
    }

    console.log('Metafields update successful, updated product:', response.data?.productUpdate?.product);
    return response.data?.productUpdate?.product;
  },

  // Get product metafields
  async getProductMetafields(productId: string) {
    const query = `
      query getProductMetafields($id: ID!) {
        product(id: $id) {
          id
          metafields(first: 50, namespace: "custom") {
            edges {
              node {
                id
                namespace
                key
                value
                type
              }
            }
          }
        }
      }
    `;

    const response = await makeShopifyRequest(query, { 
      id: productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}` 
    });
    
    return response.data?.product?.metafields?.edges?.map((edge: any) => edge.node) || [];
  },

  // Get colorways from Shopify products (products with inventory and valid color metafields)
  async getColorwaysFromProducts() {
    const query = `
      query getColorwayProducts($first: Int!) {
        products(first: $first, query: "inventory_total:>0") {
          edges {
            node {
              id
              title
              handle
              description
              status
              productType
              vendor
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    inventoryQuantity
                    availableForSale
                  }
                }
              }
              metafields(first: 20, namespace: "custom") {
                edges {
                  node {
                    id
                    namespace
                    key
                    value
                    type
                  }
                }
              }
              images(first: 1) {
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

    const response = await makeShopifyRequest(query, { first: 100 });
    const products = response.data?.products?.edges?.map((edge: any) => edge.node) || [];
    
    // Filter and transform products into colorway format
    const colorways = products
      .filter((product: any) => {
        // Check if product has valid colorway metafields (at least one non-#000000 color)
        const metafields = product.metafields?.edges?.map((edge: any) => edge.node) || [];
        const colorMetafields = metafields.filter((m: any) => 
          ['upper_base_hex', 'upper_darkbase_hex', 'upper_splatter_hex', 'sole_base_hex', 'sole_splatter_hex', 'lace_color_hex'].includes(m.key)
        );
        
        return colorMetafields.some((m: any) => m.value && m.value !== '#000000');
      })
      .map((product: any) => {
        const metafields = product.metafields?.edges?.map((edge: any) => edge.node) || [];
        
        // Helper function to get metafield value or null if #000000
        const getColorValue = (key: string) => {
          const metafield = metafields.find((m: any) => m.key === key);
          const value = metafield?.value;
          return (value && value !== '#000000') ? value : null;
        };

        // Check if splatter should be enabled (if splatter colors exist)
        const upperSplatterColor = getColorValue('upper_splatter_hex');
        const soleSplatterColor = getColorValue('sole_splatter_hex');
        const upperDarkBase = getColorValue('upper_darkbase_hex');

        return {
          id: product.handle,
          name: product.title,
          description: product.description || `Custom colorway for ${product.title}`,
          shopifyProductId: product.id,
          image: product.images?.edges?.[0]?.node?.url,
          upper: {
            baseColor: getColorValue('upper_base_hex') || '#000000',
            hasSplatter: !!upperSplatterColor,
            splatterColor: upperSplatterColor,
            splatterBaseColor: upperDarkBase,
            splatterColor2: null, // Not using dual splatter from Shopify data
            useDualSplatter: false
          },
          sole: {
            baseColor: getColorValue('sole_base_hex') || '#000000',
            hasSplatter: !!soleSplatterColor,
            splatterColor: soleSplatterColor,
            splatterBaseColor: null, // Only using upper dark base
            splatterColor2: null,
            useDualSplatter: false
          },
          laces: {
            color: getColorValue('lace_color_hex') || '#FFFFFF'
          }
        };
      });

    console.log('Generated colorways from Shopify products:', colorways);
    return colorways;
  },
};

// Shopify Connection Status
export const checkShopifyConnection = async () => {
  try {
    const query = `
      query {
        shop {
          id
          name
          email
          myshopifyDomain
          primaryDomain {
            host
            url
          }
        }
      }
    `;

    const response = await makeShopifyRequest(query);
    const shop = response.data?.shop;
    
    // Transform the response to include a domain field for backward compatibility
    if (shop) {
      shop.domain = shop.primaryDomain?.host || shop.myshopifyDomain;
    }
    
    return {
      connected: true,
      shop: shop,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Types
export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  status: string;
  productType: string;
  vendor: string;
  tags: string[];
  variants: ShopifyVariant[];
  metafields: ShopifyMetafield[];
  images: ShopifyImage[];
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: string;
  inventoryQuantity: number;
  sku: string;
  barcode: string;
  availableForSale: boolean;
}

export interface ShopifyMetafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export interface ShopifyImage {
  id: string;
  url: string;
  altText: string;
}

export interface ShopifyCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShopifyDraftOrder {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalPrice: string;
  subtotalPrice: string;
  totalTax: string;
  status: string;
  invoiceUrl: string;
  lineItems: any[];
}
