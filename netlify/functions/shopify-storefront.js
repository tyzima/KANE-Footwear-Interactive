exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Shop-Domain',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const shopDomain = event.headers['x-shop-domain'];
    const { query, variables, action } = JSON.parse(event.body);

    if (!shopDomain) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Shop domain is required' }),
      };
    }

    // For customer-facing requests, we'll use the Storefront API
    // This requires a Storefront Access Token (public token)
    const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    
    if (!storefrontAccessToken) {
      // If no storefront token, try to get data from admin API with stored credentials
      // This is a fallback for when the store owner has connected via OAuth
      return await handleAdminApiFallback(shopDomain, query, variables, action, headers);
    }

    // Make request to Shopify Storefront API
    const response = await fetch(`https://${shopDomain}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`Storefront API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Storefront API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Storefront API request failed'
      }),
    };
  }
};

// Fallback to Admin API if storefront token not available
async function handleAdminApiFallback(shopDomain, query, variables, action, headers) {
  try {
    // Try to get stored admin credentials for this shop
    // In a real implementation, you'd store these securely in a database
    // For now, we'll try to use environment variables or return an error
    
    if (action === 'getColorways') {
      return await getColorwaysFromAdmin(shopDomain, headers);
    }
    
    if (action === 'getProductInventory') {
      return await getProductInventoryFromAdmin(shopDomain, variables.productId, headers);
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Storefront access token not configured and no admin fallback available',
        message: 'Please configure SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variable'
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Admin API fallback failed',
        details: error.message
      }),
    };
  }
}

// Get colorways using Admin API (fallback)
async function getColorwaysFromAdmin(shopDomain, headers) {
  // This would need to use stored admin credentials
  // For now, return static data or error
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      data: {
        colorways: [],
        message: 'Using static colorways - admin API not available for customers'
      }
    }),
  };
}

// Get product inventory using Admin API (fallback)
async function getProductInventoryFromAdmin(shopDomain, productId, headers) {
  // This would need to use stored admin credentials
  // For now, return mock data
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      data: {
        product: {
          id: productId,
          variants: {
            edges: []
          }
        },
        message: 'Mock inventory data - admin API not available for customers'
      }
    }),
  };
}
