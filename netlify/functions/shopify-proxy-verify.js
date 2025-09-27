const crypto = require('crypto');

// Verify Shopify App Proxy requests
// This ensures requests are actually coming from Shopify
exports.handler = async (event, context) => {
  const { httpMethod, queryStringParameters, headers } = event;

  // Only handle GET requests
  if (httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get the signature from query parameters
    const signature = queryStringParameters?.signature;
    const timestamp = queryStringParameters?.timestamp;
    const shop = queryStringParameters?.shop;

    if (!signature || !timestamp || !shop) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Verify timestamp is recent (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    if (now - requestTime > 300) { // 5 minutes
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Request too old' })
      };
    }

    // Build query string for signature verification
    const params = { ...queryStringParameters };
    delete params.signature; // Remove signature from params
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // Calculate expected signature
    const secret = process.env.SHOPIFY_CLIENT_SECRET;
    if (!secret) {
      console.error('SHOPIFY_CLIENT_SECRET not found in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(sortedParams)
      .digest('hex');

    // Verify signature
    if (signature !== expectedSignature) {
      console.error('Signature verification failed:', {
        received: signature,
        expected: expectedSignature,
        params: sortedParams
      });
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    // Signature is valid
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ 
        valid: true, 
        shop,
        timestamp: requestTime,
        message: 'Request verified successfully'
      })
    };

  } catch (error) {
    console.error('Proxy verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
