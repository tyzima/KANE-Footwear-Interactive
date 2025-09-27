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
    const { query, variables } = JSON.parse(event.body);

    if (!shopDomain) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing shop domain' }),
      };
    }

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing GraphQL query' }),
      };
    }

    // Clean shop domain
    const cleanDomain = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Storefront API access token (this should be set in your Shopify app settings)
    // For now, we'll use a placeholder - you'll need to get this from your Shopify app
    const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    
    if (!storefrontAccessToken) {
      console.error('SHOPIFY_STOREFRONT_ACCESS_TOKEN not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Storefront API not configured' }),
      };
    }

    // Make request to Shopify Storefront API
    const response = await fetch(`https://${cleanDomain}/api/2024-01/graphql.json`, {
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
      const errorText = await response.text();
      console.error('Shopify Storefront API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Shopify Storefront API request failed: ${response.status} ${response.statusText}`,
          details: errorText
        }),
      };
    }

    const data = await response.json();

    // Return the GraphQL response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Shopify Storefront API function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }),
    };
  }
};
