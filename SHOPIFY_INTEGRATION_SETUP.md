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

### 1. Create a Custom App in Shopify (New Method - dev.shopify.com)

#### Option A: Using dev.shopify.com (Recommended for your setup)
1. Go to **https://dev.shopify.com**
2. Navigate to **"Apps"** in your partner dashboard
3. Find your existing app with Client ID: `d4d69ee44cf2dd4522f73989a961c273`
4. Click on your app to open it
5. Go to **"App setup"** tab
6. Look for **"Admin API access token"** section

#### Option B: Direct Store Admin (Alternative)
1. Go to your **Shopify store admin** (your-store.myshopify.com/admin)
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **"Develop apps"** 
4. Click **"Create an app"**
5. Name your app (e.g., "KANE Footwear Configurator")

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

#### For dev.shopify.com Apps:
1. In your app dashboard on dev.shopify.com:
   - Go to **"App setup"** tab
   - Scroll to **"Admin API access token"** section
   - If no token exists, click **"Generate token"**
   - **Important**: You need to install the app on a development store first!

#### Steps to Install on Development Store:
1. In dev.shopify.com, go to **"Test your app"** tab
2. Select a development store or create one
3. Click **"Install app"** 
4. After installation, go back to **"App setup"** tab
5. The **Admin API access token** will now be visible
6. Copy this token (starts with `shpat_...`)

#### Alternative - Direct Store Method:
1. After configuring permissions in your store admin
2. Click **"Install app"** 
3. Copy the **Admin API access token** that appears
4. Keep this token secure - you'll need it for the connection

**Note**: The access token is only generated AFTER you install the app on a store!

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

### Can't Find Access Token?
**Issue**: Only seeing Client ID and Secret on dev.shopify.com

**Common Issue**: App shows broken embedded view after installation

**Root Cause**: Your app is configured as "embedded" but your React app isn't designed for iframe embedding.

**Solutions**:

#### Option 1: Fix Embedded App (Recommended)
1. In dev.shopify.com, go to your app settings
2. Find **"App setup"** → **"URLs"** section
3. Configure the URLs as follows:
   - **App URL**: `https://kaneconfig.netlify.app/shopify-embedded`
   - **Allowed redirection URL(s)**: `https://kaneconfig.netlify.app/auth/shopify/callback`
4. Make sure **"Embedded in Shopify admin"** is turned ON
5. Save settings and reinstall the app
6. The embedded route is now configured to work properly in iframes

#### Option 2: Disable Embedded Mode (Easier for testing)
1. In dev.shopify.com, go to **"App setup"**
2. Look for **"Embedded in Shopify admin"** setting
3. **Turn OFF** embedded mode
4. Configure the URLs as follows:
   - **App URL**: `https://kaneconfig.netlify.app/admin`
   - **Allowed redirection URL(s)**: `https://kaneconfig.netlify.app/auth/shopify/callback`
5. Save the settings
6. **Reinstall the app** on your development store
7. After reinstalling, the access token should appear in "App setup" tab

**Note**: After changing embedded settings, you must reinstall the app!

## 📋 Complete URL Configuration

In your Shopify app settings on dev.shopify.com, you need to configure these URLs:

### For Embedded App (Recommended):
```
App URL: https://kaneconfig.netlify.app/
Allowed redirection URL(s): https://kaneconfig.netlify.app/auth/shopify/callback
```

### For Non-Embedded App (Testing):
```
App URL: https://kaneconfig.netlify.app/admin
Allowed redirection URL(s): https://kaneconfig.netlify.app/auth/shopify/callback
```

**Note**: For embedded apps, use the root URL (`/`) - the app will automatically detect it's embedded and show the appropriate interface.

### What Each URL Does:
- **App URL**: Where Shopify loads your app (embedded in iframe or as standalone)
- **Allowed redirection URL(s)**: Where Shopify redirects after OAuth authentication

### Important Notes:
- ✅ Always use `https://` (required by Shopify)
- ✅ Use your actual domain: `kaneconfig.netlify.app`
- ✅ The redirect URL is the same for both modes
- ✅ You can add multiple redirect URLs (one per line) if needed

### Step-by-Step Token Generation:
1. Go to https://dev.shopify.com
2. Click on your app (Client ID: d4d69ee44cf2dd4522f73989a961c273)
3. Go to **"Test your app"** tab
4. Click **"Select store"** → Choose or create a development store
5. Click **"Install app"** (this is crucial!)
6. After installation, go to **"App setup"** tab
7. Scroll to **"Admin API access token"** 
8. Copy the token (should start with `shpat_`)

### Connection Issues
1. Verify shop domain format (`shop.myshopify.com`)
2. Check access token validity (starts with `shpat_`)
3. Ensure all required scopes are enabled
4. Make sure app is installed on the store
5. Check browser console for detailed errors

### API Errors
- **401 Unauthorized**: Invalid access token or app not installed
- **403 Forbidden**: Missing required scopes
- **404 Not Found**: Invalid shop domain
- **429 Rate Limited**: Too many requests

### No Development Store?
1. Go to https://partners.shopify.com
2. Click **"Stores"** → **"Add store"** 
3. Select **"Development store"**
4. Create a new development store
5. Use this store to install and test your app

## Files Created
- `src/lib/shopify.ts` - Shopify API client and helpers
- `src/hooks/useShopify.ts` - React hook for Shopify integration
- `src/components/ShopifyConnection.tsx` - Connection UI component
- `src/components/ShopifyAdmin.tsx` - Admin dashboard
- `src/pages/Admin.tsx` - Admin page

Ready to build! 🚀
