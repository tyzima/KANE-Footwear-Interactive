// Public API endpoint for customer embeds to access product data
// This bypasses OAuth by using stored admin credentials for the specific shop

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const { shop, productId, action = 'colorways' } = event.queryStringParameters || {};

    if (!shop) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Shop domain is required',
          message: 'Please provide the shop parameter'
        })
      };
    }

    // Clean shop domain
    const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // For now, we'll need to store admin tokens for shops that want public embeds
    // In production, this should be stored securely (database, environment variables, etc.)
    // For demo purposes, we'll check if we have stored credentials for this shop
    
    // TODO: Implement secure credential storage for shops that enable public embeds
    // This could be done through:
    // 1. Database storage when admin connects
    // 2. Environment variables for specific shops
    // 3. Encrypted storage with shop-specific keys
    
    // For now, return a helpful message about setup
    if (action === 'colorways') {
      if (productId) {
        // Get colorways for specific product
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            message: 'Public API access not yet configured for this shop',
            shop: shopDomain,
            productId: productId,
            setup_required: true,
            instructions: [
              '1. Admin must connect via OAuth first',
              '2. Admin must enable public embed access',
              '3. Credentials will be stored securely for public API access'
            ]
          })
        };
      } else {
        // Get all colorways for shop
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            message: 'Public API access not yet configured for this shop',
            shop: shopDomain,
            setup_required: true,
            fallback: 'Using default colorways'
          })
        };
      }
    }

    if (action === 'inventory' && productId) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          message: 'Public inventory API not yet configured for this shop',
          shop: shopDomain,
          productId: productId,
          setup_required: true,
          fallback: 'Using mock inventory data'
        })
      };
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Invalid action',
        supported_actions: ['colorways', 'inventory']
      })
    };

  } catch (error) {
    console.error('Public product data API error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
