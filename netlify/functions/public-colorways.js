/**
 * Public API endpoint for fetching colorways
 * This endpoint can be called by customers without authentication
 * It uses stored admin credentials to fetch data from Shopify
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
    
    if (!shop) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Shop parameter is required' }),
      };
    }

    // Get stored credentials for this shop
    // In a production app, you'd store these in a secure database
    // For now, we'll use environment variables or a simple storage solution
    const shopCredentials = await getShopCredentials(shop);
    
    if (!shopCredentials) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Shop not found or not connected',
          fallback: true // Indicate client should use fallback data
        }),
      };
    }

    // Fetch colorways from Shopify using admin credentials
    const colorways = await fetchColorwaysFromShopify(shopCredentials, productId);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        shop,
        productId,
        colorways,
        timestamp: new Date().toISOString(),
        source: 'shopify'
      }),
    };

  } catch (error) {
    console.error('Error fetching colorways:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch colorways',
        message: error.message,
        fallback: true // Indicate client should use fallback data
      }),
    };
  }
};

/**
 * Get stored credentials for a shop
 * This would typically query a database, but for now we'll use environment variables
 */
async function getShopCredentials(shop) {
  // For development, you can store credentials in environment variables
  // In production, use a secure database like Supabase, PlanetScale, etc.
  
  // Check if this is the connected shop
  const connectedShop = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (shop === connectedShop && accessToken) {
    return {
      shop: connectedShop,
      accessToken: accessToken
    };
  }
  
  // TODO: In production, query database for stored shop credentials
  // const credentials = await db.query('SELECT * FROM shop_tokens WHERE shop = ?', [shop]);
  
  return null;
}

/**
 * Fetch colorways from Shopify using admin credentials
 */
async function fetchColorwaysFromShopify(credentials, productId = null) {
  const { shop, accessToken } = credentials;
  
  // GraphQL query to get products with metafields
  const query = productId 
    ? `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
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
    `
    : `
      query getProducts($first: Int!) {
        products(first: $first) {
          edges {
            node {
              id
              title
              handle
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
            }
          }
        }
      }
    `;

  const variables = productId 
    ? { id: productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}` }
    : { first: 100 };

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

  // Transform data to colorways format
  const products = productId 
    ? (data.data?.product ? [data.data.product] : [])
    : (data.data?.products?.edges?.map(edge => edge.node) || []);

  const colorways = products
    .filter(product => {
      // Only include products that have colorway metafields
      const metafields = product.metafields?.edges?.map(edge => edge.node) || [];
      return metafields.some(m => 
        ['upper_base_hex', 'sole_base_hex', 'lace_color_hex'].includes(m.key)
      );
    })
    .map(product => {
      const metafields = product.metafields?.edges?.map(edge => edge.node) || [];
      
      // Helper function to get metafield value
      const getMetafield = (key) => {
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
        description: `Custom colorway for ${product.title}`,
        productId: product.id.replace('gid://shopify/Product/', ''),
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
          splatterBaseColor: upperDarkBaseColor, // Use upper dark base for sole too
          splatterColor2: soleSplatterColor2,
          useDualSplatter: soleUseDualSplatter,
        },
        laces: {
          color: laceColor,
        },
      };
    });

  return colorways;
}
