const { upsertShopToken } = require('./_supabase');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const { shop, code } = JSON.parse(event.body);

    if (!shop || !code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing shop or code parameter' }),
      };
    }

    // Exchange code for access token
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID || 'd4d69ee44cf2dd4522f73989a961c273',
        client_secret: process.env.SHOPIFY_CLIENT_SECRET || '3c4fbf1eb5b479e223c4f940871bd489',
        code: code,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify OAuth error:', response.status, errorText);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: `OAuth token exchange failed: ${response.status} ${response.statusText}`,
          details: errorText
        }),
      };
    }

    const data = await response.json();

    if (!data.access_token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No access token received from Shopify' }),
      };
    }

    // Persist token server-side if Supabase configured (best effort)
    try {
      if (upsertShopToken && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await upsertShopToken(shop, data.access_token);
      }
    } catch (e) {
      console.warn('Supabase token save skipped:', e?.message);
    }

    // Return the access token
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        access_token: data.access_token,
        scope: data.scope 
      }),
    };

  } catch (error) {
    console.error('OAuth function error:', error);
    
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
