# Shopify Storefront API Setup Guide

## Overview

Your app now uses a **dual API system** to solve the customer access issue:

- **Admin API**: For admin users (OAuth authenticated) - existing functionality
- **Storefront API**: For customers (public access) - new functionality

## 🎯 The Problem We Solved

**Before**: Customers couldn't access colorways/inventory because they don't have admin OAuth credentials.

**After**: Customers use the public Storefront API while admins continue using the Admin API.

## 🔧 Setup Required

### Step 1: Get Your Storefront Access Token (New Dev Dashboard)

#### For the New dev.shopify.com Dashboard:

1. **Go to**: https://dev.shopify.com/
2. **Navigate to**: Your App → Configuration
3. **Find**: "App access" section
4. **Enable** the following scopes:
   - `unauthenticated_read_product_listings` ✅ (you already added this)
   - `unauthenticated_read_product_inventory` ✅ (you already added this)
   - `unauthenticated_read_products` (if available, or it might be included in the above)

5. **Generate Storefront Access Token**:
   - In the same "Configuration" page, scroll down to "Storefront API access"
   - Click "Generate access token" or "Create access token"
   - **Alternative**: Go to "App access" → "Storefront API" section
   - Copy the token (format varies: could be `shpat_` or another format)

#### If you can't find "Generate access token":

1. **Go to**: Configuration → App access → Storefront API
2. **Look for**: "Access tokens" or "Private access tokens" section
3. **Create new token** with the scopes you enabled
4. **Copy the token** - it should be a long string

#### Alternative Method (if above doesn't work):

1. **Install your app** on your test store
2. **Go to your Shopify admin**: `testing-kn.myshopify.com/admin`
3. **Navigate to**: Apps → Private apps (if available)
4. **Create private app** with Storefront API access
5. **Copy the Storefront access token**

### Step 2: Add Environment Variable

Add the Storefront access token to your Netlify environment:

1. **Go to**: Netlify Dashboard → Your Site → Site settings → Environment variables
2. **Add new variable**:
   - **Key**: `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
   - **Value**: Your storefront access token from Step 1

3. **Redeploy** your site after adding the environment variable

### Step 3: Test the Setup

#### Test Customer Access:
```
https://kaneconfig.netlify.app?shop=testing-kn.myshopify.com&customer=true
```

#### Test Product-Specific Access:
```
https://kaneconfig.netlify.app?shop=testing-kn.myshopify.com&productId=123&customer=true
```

## 🔄 How It Works

### For Admin Users:
- **OAuth flow** → Admin API → Full access to products, inventory, metafields
- **Used in**: Shopify admin panel, admin routes

### For Customers:
- **No authentication** → Storefront API → Public access to products, inventory
- **Used in**: Embedded product pages, direct links, customer-facing embeds

### Automatic Detection:
The app automatically detects context:

```typescript
// Customer context detected by:
const isCustomerContext = 
  urlParams.get('customer') === 'true' ||  // Explicit customer flag
  !!urlParams.get('productId');           // Product ID in URL

// API selection:
if (isCustomerContext && shopDomain) {
  // Use Storefront API
  const colorways = await storefrontAPI.getProducts(shopDomain);
} else if (isConnected) {
  // Use Admin API  
  const colorways = await adminAPI.getProducts();
}
```

## 📊 API Comparison

| Feature | Admin API | Storefront API |
|---------|-----------|----------------|
| **Authentication** | OAuth required | Public access |
| **Users** | Admin only | Everyone |
| **Products** | All products | Published products only |
| **Inventory** | Admin inventory | Public inventory |
| **Metafields** | All metafields | Public metafields only |
| **Rate Limits** | Higher limits | Standard limits |

## 🧪 Testing Scenarios

### 1. Admin User (Current Working)
- **URL**: `/shopify-admin`
- **API**: Admin API via OAuth
- **Expected**: Full colorways and inventory

### 2. Customer Embed (Now Fixed)
```liquid
<iframe src="https://kaneconfig.netlify.app?shop={{ shop.domain }}&productId={{ product.id }}&customer=true">
```
- **API**: Storefront API
- **Expected**: Product-specific colorways and inventory

### 3. Direct Customer Link (Now Fixed)
- **URL**: `https://kaneconfig.netlify.app?shop=testing-kn.myshopify.com&customer=true`
- **API**: Storefront API  
- **Expected**: All published colorways and inventory

## 🔍 Debugging

### Check API Usage:
Open browser console and look for:
```
Customer context detected, using Storefront API
Loading colorways from Storefront API for: testing-kn.myshopify.com
Loaded X colorways from Storefront API
```

### Common Issues:

#### 1. "Storefront API not configured"
- **Cause**: Missing `SHOPIFY_STOREFRONT_ACCESS_TOKEN` environment variable
- **Fix**: Add the token to Netlify environment variables and redeploy

#### 2. "No colorways found"
- **Cause**: Products not published or metafields not public
- **Fix**: Ensure products are published and metafields are accessible via Storefront API

#### 3. "Failed to load inventory"
- **Cause**: Storefront API permissions or product not found
- **Fix**: Check product ID format and Storefront API scopes

## 🚀 Deployment Checklist

- [ ] Storefront API scopes enabled in Shopify app
- [ ] Storefront access token generated
- [ ] `SHOPIFY_STOREFRONT_ACCESS_TOKEN` added to Netlify
- [ ] Site redeployed after environment variable addition
- [ ] Customer embed tested on product page
- [ ] Direct customer link tested
- [ ] Admin functionality still working

## 📝 Next Steps

1. **Test the customer embed** on your Shopify product pages
2. **Verify colorways load** for customers without admin access
3. **Check inventory accuracy** in customer-facing views
4. **Monitor API usage** in Shopify Partner Dashboard

Your customers should now be able to access dynamic colorways and inventory without requiring admin authentication! 🎉
