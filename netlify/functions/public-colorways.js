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
    if (!shop) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing shop parameter' }) };
    }
    const accessToken = await getShopToken(shop);
    if (!accessToken) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Shop not connected' }) };
    }

    const cleanDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const query = `#graphql
      query {
        products(first: 100) {
          edges {
            node {
              id
              title
              metafields(first: 50, namespace: "custom") { edges { node { key value type } } }
            }
          }
        }
      }
    `;

    const resp = await fetch(`https://${cleanDomain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ query })
    });
    if (!resp.ok) {
      const text = await resp.text();
      return { statusCode: resp.status, headers, body: JSON.stringify({ error: 'Shopify request failed', details: text }) };
    }
    const data = await resp.json();
    const products = data?.data?.products?.edges?.map(e => e.node) || [];

    // Transform to colorways shape
    const colorways = products.map(p => {
      const m = {}; (p.metafields?.edges || []).forEach(edge => { m[edge.node.key] = edge.node.value; });
      return {
        id: `product-${p.id.replace('gid://shopify/Product/', '')}`,
        name: p.title,
        description: '',
        productId: p.id.replace('gid://shopify/Product/', ''),
        upper: {
          baseColor: m.upper_base_hex || '#000000',
          hasSplatter: !!m.upper_splatter_hex,
          splatterColor: m.upper_splatter_hex || null,
          splatterBaseColor: m.upper_darkbase_hex || null,
          splatterColor2: m.upper_splatter2_hex || null,
          useDualSplatter: !!m.upper_splatter2_hex
        },
        sole: {
          baseColor: m.sole_base_hex || '#000000',
          hasSplatter: !!m.sole_splatter_hex,
          splatterColor: m.sole_splatter_hex || null,
          splatterBaseColor: m.sole_splatter_base_hex || null,
          splatterColor2: m.sole_splatter2_hex || null,
          useDualSplatter: !!m.sole_splatter2_hex
        },
        laces: { color: m.lace_color_hex || '#000000' }
      };
    });

    return { statusCode: 200, headers, body: JSON.stringify({ colorways }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error', message: err.message }) };
  }
};


