/**
 * Public API endpoint for fetching product inventory
 * This endpoint can be called by customers without authentication
 * It uses stored admin credentials to fetch inventory data from Shopify
 */

exports.handler = async (event, context) => {
  // CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse query parameters
    const { shop, productId } = event.queryStringParameters || {};
    
    if (!shop || !productId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Shop and productId parameters are required' }),
      };
    }

    // Get stored credentials for this shop
    const shopCredentials = await getShopCredentials(shop);
    
    if (!shopCredentials) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Shop not found or not connected',
          fallback: true
        }),
      };
    }

    // Fetch inventory from Shopify using admin credentials
    const inventory = await fetchInventoryFromShopify(shopCredentials, productId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        shop,
        productId,
        inventory,
        timestamp: new Date().toISOString(),
        source: 'shopify'
      }),
    };

  } catch (error) {
    console.error('Error fetching inventory:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch inventory',
        message: error.message,
        fallback: true
      }),
    };
  }
};

/**
 * Get stored credentials for a shop
 */
async function getShopCredentials(shop) {
  // For development, use environment variables
  const connectedShop = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (shop === connectedShop && accessToken) {
    return {
      shop: connectedShop,
      accessToken: accessToken
    };
  }
  
  return null;
}

/**
 * Fetch inventory from Shopify using admin credentials
 */
async function fetchInventoryFromShopify(credentials, productId) {
  const { shop, accessToken } = credentials;
  
  // GraphQL query to get product variants with inventory
  const query = `
    query getProductInventory($id: ID!) {
      product(id: $id) {
        id
        title
        variants(first: 100) {
          edges {
            node {
              id
              title
              sku
              inventoryQuantity
              availableForSale
              price
            }
          }
        }
      }
    }
  `;

  const variables = {
    id: productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`
  };

  // Make request to Shopify GraphQL API
  const response = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
  }

  const product = data.data?.product;
  
  if (!product) {
    throw new Error('Product not found');
  }

  // Transform variants to inventory format
  const variants = product.variants?.edges?.map(edge => edge.node) || [];
  
  // Create inventory mapping by size
  const inventory = {};
  
  variants.forEach(variant => {
    // Extract size from variant title or SKU
    const size = extractSizeFromVariant(variant);
    if (size) {
      inventory[size] = Math.max(0, variant.inventoryQuantity || 0);
    }
  });

  return {
    productId: product.id,
    productTitle: product.title,
    inventory,
    variants: variants.map(variant => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      size: extractSizeFromVariant(variant),
      inventoryQuantity: variant.inventoryQuantity,
      availableForSale: variant.availableForSale,
      price: variant.price
    }))
  };
}

/**
 * Extract size from variant title or SKU
 */
function extractSizeFromVariant(variant) {
  // Check if size is in the title
  const title = variant.title || '';
  const sku = variant.sku || '';
  
  // Try to extract from title (e.g., "Men's 10", "Women's 8", "M10", "W8")
  const titleMatch = title.match(/(?:Men's?\s*|M)(\d+(?:\.\d+)?)|(?:Women's?\s*|W)(\d+(?:\.\d+)?)/i);
  if (titleMatch) {
    const mensSize = titleMatch[1];
    const womensSize = titleMatch[2];
    return mensSize ? `M${mensSize}` : `W${womensSize}`;
  }
  
  // Try to extract from SKU
  const skuMatch = sku.match(/[MW](\d+(?:\.\d+)?)/i);
  if (skuMatch) {
    const sizeNum = skuMatch[1];
    const gender = sku.match(/M\d/i) ? 'M' : 'W';
    return `${gender}${sizeNum}`;
  }
  
  // Try to extract just numbers from title
  const numberMatch = title.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numberMatch) {
    const sizeNum = numberMatch[1];
    // Default to men's sizing if no gender specified
    return `M${sizeNum}`;
  }
  
  return null;
}
