# Admin Panel Setup Guide

This guide explains how to set up the enhanced Shopify admin panel with Supabase integration for orders and saved designs.

## Database Setup

### 1. Order Requests Table
Run the SQL schema for order requests:
```sql
-- Execute the contents of order-requests-schema.sql in your Supabase SQL editor
```

### 2. Saved Designs Table
Run the SQL schema for saved designs:
```sql
-- Execute the contents of saved-designs-schema.sql in your Supabase SQL editor
```

## Features Overview

The admin panel now includes 7 tabs:

### 1. Overview
- Dashboard with key metrics
- Quick setup guide
- Product and variant counts

### 2. Products
- View all Shopify products
- Pagination support
- Product details and metafields

### 3. Colorways
- Edit colorway metafields for products
- Live 3D preview of color changes
- Real-time color configuration

### 4. Orders (NEW)
- View all order requests from customers
- Update order status (pending → processing → fulfilled)
- Delete orders
- View customer details and design previews
- Filter by order type (buy_now vs order_request)

### 5. Designs (NEW)
- View saved customer designs
- Design preview thumbnails
- Color configuration summaries
- Public/private design management

### 6. API Tokens
- Manage Storefront API tokens
- Create customer access tokens
- Setup instructions

### 7. Settings
- Connection management
- External links

## Order Management

### Order Status Flow
1. **Pending** - New order request submitted
2. **Processing** - Order is being prepared
3. **Fulfilled** - Order completed and shipped
4. **Cancelled** - Order cancelled

### Order Information Displayed
- Customer contact details
- Product information
- Size quantities
- Total price
- Order type (buy now vs order request)
- Customer notes
- Design preview screenshot
- Timestamps

## Design Management

### Design Information
- Design name and description
- Product association
- Color configuration
- Screenshot preview
- Public/private status
- Creation date

### Design Features
- Visual color swatches
- Design preview thumbnails
- Product context
- Metadata tracking

## Environment Variables

Ensure these are set in your environment:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Shopify Configuration
VITE_SHOPIFY_API_KEY=your_shopify_api_key
VITE_SHOPIFY_API_SECRET=your_shopify_api_secret
VITE_SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders
```

## Usage

### Accessing the Admin Panel
1. Navigate to `/admin` in your application
2. Connect to your Shopify store
3. Use the tabs to navigate between different sections

### Managing Orders
1. Go to the "Orders" tab
2. View all pending order requests
3. Click "Process" to move to processing status
4. Click "Fulfill" when order is complete
5. Use "Delete" to remove orders if needed

### Viewing Saved Designs
1. Go to the "Designs" tab
2. Browse all saved customer designs
3. View design details and color configurations
4. See which designs are public vs private

## Database Queries

### View Recent Orders
```sql
SELECT 
  id,
  order_type,
  status,
  customer_info->>'email' as email,
  customer_info->>'firstName' as first_name,
  customer_info->>'lastName' as last_name,
  product_info->>'totalPairs' as total_pairs,
  product_info->>'totalPrice' as total_price,
  created_at
FROM order_requests 
ORDER BY created_at DESC 
LIMIT 20;
```

### View Order by Status
```sql
SELECT * FROM order_requests 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### View Public Designs
```sql
SELECT * FROM saved_designs 
WHERE is_public = true 
ORDER BY created_at DESC;
```

### Update Order Status
```sql
UPDATE order_requests 
SET status = 'processing', processed_at = NOW() 
WHERE id = 'your-order-id';
```

## Security Considerations

- Row Level Security (RLS) policies are included in the schemas
- Uncomment and modify policies as needed for your security requirements
- Consider implementing user authentication for admin access
- Review and adjust data access permissions

## Troubleshooting

### Common Issues

1. **Orders not loading**
   - Check Supabase connection
   - Verify table exists and has data
   - Check browser console for errors

2. **Designs not showing**
   - Ensure saved_designs table exists
   - Check if designs have been saved
   - Verify metadata structure

3. **Status updates failing**
   - Check Supabase permissions
   - Verify order ID exists
   - Check network connectivity

### Debug Mode
Enable debug logging by checking browser console for detailed error messages and API responses.

## Next Steps

1. Set up the database tables
2. Test order submission flow
3. Test design saving functionality
4. Configure RLS policies as needed
5. Set up monitoring and alerts for new orders
6. Consider adding email notifications for new orders
