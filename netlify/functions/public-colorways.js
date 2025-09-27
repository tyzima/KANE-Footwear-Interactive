const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get shop domain from query parameters
  const shopDomain = event.queryStringParameters?.shop;
  
  if (!shopDomain) {
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'Shop domain is required' }) 
    };
  }

  // Get credentials from environment variables
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Shopify API credentials not configured' }) 
    };
  }

  try {
    // For public access, we'll need to use a stored access token
    // In a production setup, you'd store this securely in a database
    // For now, we'll try to use a public access token if available
    const publicAccessToken = process.env[`SHOPIFY_PUBLIC_TOKEN_${shopDomain.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`];
    
    if (!publicAccessToken) {
      console.log(`No public access token found for shop: ${shopDomain}`);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({ colorways: [] }) // Return empty array if no token
      };
    }

    // GraphQL query to get products with colorway metafields
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

    const response = await fetch(`https://${shopDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': publicAccessToken,
      },
      body: JSON.stringify({
        query,
        variables: { first: 100 }
      }),
    });

    if (!response.ok) {
      throw new Error(`Shopify API request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`Shopify GraphQL error: ${data.errors[0].message}`);
    }

    // Transform products to colorways format
    const products = data.data?.products?.edges?.map(edge => edge.node) || [];
    
    const colorways = products
      .filter(product => {
        // Only include products that have colorway metafields
        const metafields = product.metafields?.edges?.map(edge => edge.node) || [];
        return metafields.some(m => 
          ['upper_base_hex', 'sole_base_hex', 'lace_color_hex'].includes(m.key)
        );
      })
      .map(product => {
        // Transform product metafields into colorway format
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
            splatterBaseColor: upperDarkBaseColor,
            splatterColor2: soleSplatterColor2,
            useDualSplatter: soleUseDualSplatter
          },
          laces: {
            color: laceColor
          }
        };
      });

    console.log(`Generated ${colorways.length} public colorways for shop: ${shopDomain}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ colorways })
    };

  } catch (error) {
    console.error('Error fetching public colorways:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch colorways',
        colorways: [] // Return empty array on error
      })
    };
  }
};
