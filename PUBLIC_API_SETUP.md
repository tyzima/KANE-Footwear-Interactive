# Public API Setup Guide

## Overview
This guide explains how to set up the public API endpoints that allow customers to access colorways and inventory data without requiring OAuth authentication.

## Environment Variables Setup

### For Netlify Deployment
Add these environment variables in your Netlify dashboard (Site settings → Environment variables):

```bash
# Shopify Store Configuration
SHOPIFY_SHOP_DOMAIN=testing-kn.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token_here
```

### For Local Development
Add these to your `.env.local` file:

```bash
# Shopify Store Configuration for Public API
SHOPIFY_SHOP_DOMAIN=testing-kn.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token_here
```

## How to Get Your Access Token

### Option 1: From Your Connected Admin Panel
1. Go to your admin panel: `https://kaneconfig.netlify.app/shopify-admin`
2. If connected, the access token should be stored in localStorage
3. Open browser dev tools → Application → Local Storage → `https://kaneconfig.netlify.app`
4. Look for `shopify_access_token` key

### Option 2: Generate New Token in Shopify Admin
1. Go to your Shopify admin: `https://testing-kn.myshopify.com/admin`
2. Navigate to Settings → Apps and sales channels
3. Click "Develop apps for your store"
4. Create or edit your KANE app
5. Go to API credentials
6. Copy the Admin API access token (starts with `shpat_`)

## API Endpoints

### Public Colorways Endpoint
```
GET /.netlify/functions/public-colorways?shop=testing-kn.myshopify.com
GET /.netlify/functions/public-colorways?shop=testing-kn.myshopify.com&productId=123
```

**Response:**
```json
{
  "success": true,
  "shop": "testing-kn.myshopify.com",
  "productId": "123",
  "colorways": [...],
  "timestamp": "2024-01-01T00:00:00Z",
  "source": "shopify"
}
```

### Public Inventory Endpoint
```
GET /.netlify/functions/public-inventory?shop=testing-kn.myshopify.com&productId=123
```

**Response:**
```json
{
  "success": true,
  "shop": "testing-kn.myshopify.com",
  "productId": "123",
  "inventory": {
    "productId": "gid://shopify/Product/123",
    "productTitle": "KANE Shoe",
    "inventory": {
      "M10": 15,
      "M11": 8,
      "W12": 12
    },
    "variants": [...]
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "source": "shopify"
}
```

## How It Works

### For Admin Users
- Uses existing OAuth flow
- Calls Shopify Admin API directly
- Full admin access to all data

### For Customer Embeds
- Uses public API endpoints (Netlify Functions)
- Functions use stored admin credentials
- No authentication required from customers
- Data is served publicly but securely

## Security Considerations

### Current Implementation (Development)
- Credentials stored in environment variables
- Single shop support
- Suitable for single-store deployments

### Production Recommendations
- Store shop credentials in secure database (Supabase, PlanetScale, etc.)
- Implement per-shop credential storage
- Add rate limiting to prevent API abuse
- Consider caching responses for performance
- Add request validation and sanitization

## Testing

### Test Customer Embed
Add this to a Shopify product page:

```liquid
<iframe 
  src="https://kaneconfig.netlify.app?shop={{ shop.domain }}&productId={{ product.id }}&customer=true"
  width="100%" 
  height="700px" 
  frameborder="0">
</iframe>
```

### Test API Endpoints Directly
```bash
# Test colorways
curl "https://kaneconfig.netlify.app/.netlify/functions/public-colorways?shop=testing-kn.myshopify.com"

# Test inventory
curl "https://kaneconfig.netlify.app/.netlify/functions/public-inventory?shop=testing-kn.myshopify.com&productId=123"
```

## Troubleshooting

### Common Issues

**"Shop not found or not connected"**
- Check SHOPIFY_SHOP_DOMAIN environment variable
- Ensure it matches exactly (no https://, no trailing slash)

**"Shopify API error: 401"**
- Check SHOPIFY_ACCESS_TOKEN is correct
- Ensure token has required permissions (read_products, read_inventory)

**"Failed to fetch colorways"**
- Check if products have custom metafields set
- Verify metafield keys match expected format (upper_base_hex, etc.)

**Customer embed shows static colorways**
- Check browser console for API errors
- Verify shop and productId are passed correctly
- Test API endpoints directly

## Migration Path

### Phase 1: Environment Variables (Current)
- Single shop support
- Credentials in environment variables
- Good for development and single-store production

### Phase 2: Database Storage (Future)
- Multi-shop support
- Secure credential storage
- Scalable for multiple merchants

### Phase 3: Advanced Features (Future)
- Caching and performance optimization
- Advanced security features
- Analytics and monitoring
