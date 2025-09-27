// Lightweight Supabase helper for Netlify Functions
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return null;
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function getShopToken(shopDomain) {
  // Optional fallback env for single-store setups
  if (process.env.SHOPIFY_FALLBACK_SHOP_DOMAIN && process.env.SHOPIFY_FALLBACK_ACCESS_TOKEN) {
    const cleanFallback = process.env.SHOPIFY_FALLBACK_SHOP_DOMAIN.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (shopDomain && shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '') === cleanFallback) {
      return process.env.SHOPIFY_FALLBACK_ACCESS_TOKEN;
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }
  const clean = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const { data, error } = await supabase
    .from('shopify_connections')
    .select('access_token')
    .eq('shop_domain', clean)
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('Supabase token lookup error:', error);
    return null;
  }
  return data?.access_token || null;
}

async function upsertShopToken(shopDomain, accessToken) {
  const supabase = getSupabase();
  if (!supabase) return false;
  const clean = shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const { error } = await supabase
    .from('shopify_connections')
    .upsert({ shop_domain: clean, access_token: accessToken, updated_at: new Date().toISOString() }, { onConflict: 'shop_domain' });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('Supabase token upsert error:', error);
    return false;
  }
  return true;
}

module.exports = { getSupabase, getShopToken, upsertShopToken };


