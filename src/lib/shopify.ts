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
export const makeShopifyRequest = async (query: string, variables?: any) => {
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

  // Draft Orders
  async createDraftOrder(input: DraftOrderInput) {
    return await createDraftOrder(input);
  },

  // Customers
  async createOrFindCustomer(customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) {
    return await createOrFindCustomer(customerData);
  },

};

// Get colorways from all products with metafields
export const getColorwaysFromProducts = async () => {
  console.log('Fetching colorways from Shopify products...');
  
  // Get all products with their metafields
  const products = await shopifyAPI.getProducts(100); // Get more products for colorways
  
  const colorways = products
    .filter(product => {
      // Only include products that have at least some colorway metafields
      return product.metafields && product.metafields.some(m => 
        ['upper_base_hex', 'sole_base_hex', 'lace_color_hex'].includes(m.key)
      );
    })
    .map(product => {
      // Transform product metafields into colorway format
      const metafields = product.metafields || [];
      
      // Helper function to get metafield value
      const getMetafield = (key: string) => {
        const field = metafields.find(m => m.key === key && m.namespace === 'custom');
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
        name: product.title,
        description: product.description || `${product.title} colorway`,
        upper: {
          baseColor: upperBaseColor,
          hasSplatter: upperHasSplatter,
          splatterColor: upperSplatterColor,
          splatterBaseColor: upperDarkBaseColor,
          splatterColor2: upperSplatterColor2,
          useDualSplatter: upperUseDualSplatter
        },
        sole: {
          baseColor: soleBaseColor,
          hasSplatter: soleHasSplatter,
          splatterColor: soleSplatterColor,
          splatterBaseColor: upperDarkBaseColor, // Use upper dark base for sole splatter base too
          splatterColor2: soleSplatterColor2,
          useDualSplatter: soleUseDualSplatter
        },
        laces: {
          color: laceColor
        }
      };
    });
  
  console.log(`Generated ${colorways.length} colorways from Shopify products:`, colorways);
  return colorways;
};

// Add the function to the shopifyAPI object
shopifyAPI.getColorways = getColorwaysFromProducts;

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

// Draft Order Creation Types
export interface DraftOrderLineItem {
  variantId?: string;
  productId?: string;
  quantity: number;
  customAttributes?: Array<{
    key: string;
    value: string;
  }>;
  title?: string;
  price?: string;
  requiresShipping?: boolean;
}

export interface DraftOrderInput {
  lineItems: DraftOrderLineItem[];
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  note?: string;
  email?: string;
  phone?: string;
  useCustomerDefaultAddress?: boolean;
}

// Create a draft order in Shopify
export const createDraftOrder = async (input: DraftOrderInput): Promise<ShopifyDraftOrder> => {
  const mutation = `
    mutation DraftOrderCreate($input: DraftOrderInput!) {
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
          customer {
            id
            firstName
            lastName
            email
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                originalUnitPrice
                discountedUnitPrice
                variant {
                  id
                  title
                  sku
                }
                product {
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
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
            phone
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = { input };

  try {
    const response = await makeShopifyRequest(mutation, variables);
    
    if (response.data?.draftOrderCreate?.userErrors?.length > 0) {
      const errors = response.data.draftOrderCreate.userErrors;
      throw new Error(`Draft order creation failed: ${errors.map((e: any) => e.message).join(', ')}`);
    }

    const draftOrder = response.data?.draftOrderCreate?.draftOrder;
    
    if (!draftOrder) {
      throw new Error('No draft order returned from Shopify');
    }

    // Transform line items
    const lineItems = draftOrder.lineItems?.edges?.map((edge: any) => edge.node) || [];

    return {
      id: draftOrder.id,
      name: draftOrder.name,
      email: draftOrder.email || '',
      phone: draftOrder.phone || '',
      totalPrice: draftOrder.totalPrice,
      subtotalPrice: draftOrder.subtotalPrice,
      totalTax: draftOrder.totalTax,
      status: draftOrder.status,
      invoiceUrl: draftOrder.invoiceUrl || '',
      lineItems
    };
  } catch (error) {
    console.error('Error creating draft order:', error);
    throw error;
  }
};

// Create or find customer in Shopify
export const createOrFindCustomer = async (customerData: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}): Promise<{ id: string; firstName: string; lastName: string; email: string; phone?: string }> => {
  // First, try to find existing customer by email
  const searchQuery = `
    query CustomerSearch($query: String!) {
      customers(first: 1, query: $query) {
        edges {
          node {
            id
            firstName
            lastName
            email
            phone
          }
        }
      }
    }
  `;

  try {
    const searchResponse = await makeShopifyRequest(searchQuery, {
      query: `email:${customerData.email}`
    });

    const existingCustomer = searchResponse.data?.customers?.edges?.[0]?.node;
    
    if (existingCustomer) {
      console.log('Found existing customer:', existingCustomer.email);
      return existingCustomer;
    }

    // If no existing customer, create a new one
    const createMutation = `
      mutation CustomerCreate($input: CustomerInput!) {
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

    const createResponse = await makeShopifyRequest(createMutation, {
      input: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        phone: customerData.phone || null
      }
    });

    if (createResponse.data?.customerCreate?.userErrors?.length > 0) {
      const errors = createResponse.data.customerCreate.userErrors;
      throw new Error(`Customer creation failed: ${errors.map((e: any) => e.message).join(', ')}`);
    }

    const newCustomer = createResponse.data?.customerCreate?.customer;
    
    if (!newCustomer) {
      throw new Error('No customer returned from Shopify');
    }

    console.log('Created new customer:', newCustomer.email);
    return newCustomer;
  } catch (error) {
    console.error('Error creating/finding customer:', error);
    throw error;
  }
};
