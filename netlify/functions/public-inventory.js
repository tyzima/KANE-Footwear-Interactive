const { getShopToken } = require('./_supabase');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const shop = (event.queryStringParameters?.shop || '').trim();
    const productId = (event.queryStringParameters?.productId || '').trim();
    if (!shop || !productId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing shop or productId parameter' }) };
    }

    const accessToken = await getShopToken(shop);
    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Shop not connected' }) };
    }

    const cleanDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const gid = productId.startsWith('gid://') ? productId : `gid://shopify/Product/${productId}`;
    const query = `#graphql
      query($id: ID!) {
        product(id: $id) {
          id
          variants(first: 100) { edges { node { id title sku inventoryQuantity } } }
        }
      }
    `;
    const resp = await fetch(`https://${cleanDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ query, variables: { id: gid } })
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { statusCode: resp.status, headers, body: JSON.stringify({ error: 'Shopify request failed', details: text }) };
    }
    const data = await resp.json();
    const variants = data?.data?.product?.variants?.edges?.map(e => e.node) || [];
    return { statusCode: 200, headers, body: JSON.stringify({ variants }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error', message: err.message }) };
  }
};


