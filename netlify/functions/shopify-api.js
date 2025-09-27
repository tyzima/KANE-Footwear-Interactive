exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Shopify-Access-Token, X-Shop-Domain',
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
    const accessToken = event.headers['x-shopify-access-token'];
    const shopDomain = event.headers['x-shop-domain'];
    const { query, variables } = JSON.parse(event.body);

    if (!accessToken || !shopDomain) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing access token or shop domain' }),
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

    // Make request to Shopify GraphQL API
    const response = await fetch(`https://${cleanDomain}/admin/api/2024-01/graphql.json`, {
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
      const errorText = await response.text();
      console.error('Shopify API error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `Shopify API request failed: ${response.status} ${response.statusText}`,
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
    console.error('Shopify API function error:', error);
    
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
