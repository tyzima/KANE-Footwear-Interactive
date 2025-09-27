# Shopify Integration Setup Guide

## Overview
The KANE Footwear app is now integrated with Shopify to enable:
- Product synchronization
- Inventory management
- Customer creation
- Draft order generation
- Metafield-based colorway configuration

## Your Shopify App Details
- **Client ID**: `d4d69ee44cf2dd4522f73989a961c273`
- **Client Secret**: `3c4fbf1eb5b479e223c4f940871bd489`

## Setup Steps

### 1. Create a Private App in Shopify
1. Go to your Shopify Admin panel
2. Navigate to **Apps** → **App and sales channel settings**
3. Click **"Develop apps"** → **"Create an app"**
4. Name your app (e.g., "KANE Footwear Configurator")

### 2. Configure API Permissions
Enable the following scopes for your app:

#### Product Permissions:
- `read_products` - Read product data
- `write_products` - Modify product data

#### Customer Permissions:
- `read_customers` - Read customer data
- `write_customers` - Create and modify customers

#### Order Permissions:
- `read_orders` - Read order data
- `write_orders` - Create and modify orders
- `read_draft_orders` - Read draft orders
- `write_draft_orders` - Create and modify draft orders

#### Inventory Permissions:
- `read_inventory` - Read inventory levels
- `write_inventory` - Modify inventory levels

### 3. Generate Access Token
1. After configuring permissions, click **"Install app"**
2. Copy the **Admin API access token**
3. Keep this token secure - you'll need it for the connection

### 4. Connect to Your App
1. Visit your app at `/admin` route (e.g., `http://localhost:8091/admin`)
2. Click **"Connect to Shopify"**
3. Enter your shop domain (e.g., `your-shop.myshopify.com`)
4. Enter your access token
5. Click **"Connect"**

## Features Available

### 🔗 Connection Management
- Real-time connection status
- Secure credential storage
- Easy disconnect/reconnect

### 📦 Product Management
- View all Shopify products
- Sync product variants
- Read product metafields
- Display colorway configurations

### 🎨 Colorway Integration
Products can have colorway metafields in the `colorway` namespace:
- `colorway.upper_base_color`
- `colorway.sole_base_color`
- `colorway.lace_color`
- `colorway.splatter_enabled`
- `colorway.splatter_color`
- And more...

### 📊 Analytics Dashboard
- Product count
- Variant count
- Active products
- Metafield count

## Next Steps - Feature Development

### Phase 1: Basic Integration ✅
- [x] Shopify API connection
- [x] Product listing
- [x] Basic admin interface

### Phase 2: Colorway Sync (Next)
- [ ] Map Shopify metafields to colorway data
- [ ] Sync colorways from products
- [ ] Update local colorway database

### Phase 3: Order Processing
- [ ] Create customers from design orders
- [ ] Generate draft orders with custom attributes
- [ ] Include design screenshots and configurations

### Phase 4: Inventory Management
- [ ] Real-time inventory checking
- [ ] Prevent overselling
- [ ] Size-based variant mapping

### Phase 5: Advanced Features
- [ ] Webhook integration
- [ ] Automated product updates
- [ ] Bulk operations

## API Structure

### Products Query
```graphql
query getProducts($first: Int!) {
  products(first: $first) {
    edges {
      node {
        id
        title
        variants { ... }
        metafields { ... }
      }
    }
  }
}
```

### Draft Order Creation
```graphql
mutation createDraftOrder($input: DraftOrderInput!) {
  draftOrderCreate(input: $input) {
    draftOrder {
      id
      invoiceUrl
      totalPrice
    }
  }
}
```

## Security Notes
- Access tokens are stored in localStorage (consider upgrading to more secure storage)
- All API calls use HTTPS
- Client credentials are hardcoded (consider moving to environment variables)

## Troubleshooting

### Connection Issues
1. Verify shop domain format (`shop.myshopify.com`)
2. Check access token validity
3. Ensure all required scopes are enabled
4. Check browser console for detailed errors

### API Errors
- **401 Unauthorized**: Invalid access token
- **403 Forbidden**: Missing required scopes
- **404 Not Found**: Invalid shop domain
- **429 Rate Limited**: Too many requests

## Files Created
- `src/lib/shopify.ts` - Shopify API client and helpers
- `src/hooks/useShopify.ts` - React hook for Shopify integration
- `src/components/ShopifyConnection.tsx` - Connection UI component
- `src/components/ShopifyAdmin.tsx` - Admin dashboard
- `src/pages/Admin.tsx` - Admin page

Ready to build! 🚀
