import { createAdminApiClient } from '@shopify/admin-api-client';

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

// Shopify Admin API Client
let shopifyClient: ReturnType<typeof createAdminApiClient> | null = null;

export const initializeShopifyClient = (shopDomain: string, accessToken: string) => {
  shopifyClient = createAdminApiClient({
    storeDomain: shopDomain,
    accessToken: accessToken,
    apiVersion: '2024-01',
  });
  return shopifyClient;
};

export const getShopifyClient = () => {
  if (!shopifyClient) {
    throw new Error('Shopify client not initialized. Please call initializeShopifyClient first.');
  }
  return shopifyClient;
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

// Shopify API Helper Functions
export const shopifyAPI = {
  // Products
  async getProducts(limit = 50) {
    const client = getShopifyClient();
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
              metafields(first: 20) {
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

    const response = await client.request(query, { variables: { first: limit } });
    return response.data?.products?.edges?.map((edge: any) => edge.node) || [];
  },

  // Get specific product by ID
  async getProduct(productId: string) {
    const client = getShopifyClient();
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

    const response = await client.request(query, { variables: { id: productId } });
    return response.data?.product;
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

    const response = await client.request(query, {
      variables: { inventoryItemIds },
    });

    return response.data?.inventoryItems?.edges?.map((edge: any) => edge.node) || [];
  },
};

// Shopify Connection Status
export const checkShopifyConnection = async () => {
  try {
    const client = getShopifyClient();
    const query = `
      query {
        shop {
          id
          name
          email
          domain
          myshopifyDomain
        }
      }
    `;

    const response = await client.request(query);
    return {
      connected: true,
      shop: response.data?.shop,
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
