# Order Requests Setup

This document explains how to set up the order requests functionality in your Supabase database.

## Database Setup

1. **Run the SQL Schema**
   ```sql
   -- Execute the contents of order-requests-schema.sql in your Supabase SQL editor
   ```

2. **Table Structure**
   The `order_requests` table includes:
   - `id`: UUID primary key
   - `order_type`: Either 'buy_now' or 'order_request'
   - `status`: Order status (pending, processing, fulfilled, cancelled)
   - `customer_info`: JSONB with customer contact details
   - `product_info`: JSONB with product and size information
   - `design_config`: JSONB with complete design configuration
   - `metadata`: JSONB with additional context (screenshot, user agent, etc.)
   - Timestamps for tracking order lifecycle

## Features

### Buy Now Flow
- Customer selects sizes and proceeds directly to checkout
- For Shopify customers: redirects to cart/add URL
- For non-Shopify: falls back to webhook submission

### Order Request Flow
- Customer can request design even if sizes are out of stock
- Requires contact information collection
- Saves to Supabase for manual processing
- Customer receives confirmation that request was submitted

## Usage

The BuyButton component now has 4 steps:
1. **Sizes**: Select quantities for each size
2. **Order Type**: Choose between "Buy Now" or "Order Request"
3. **Contact**: Only shown for "Order Request" - collect customer details
4. **Review**: Final confirmation before submission

## Database Queries

### View all order requests
```sql
SELECT * FROM order_requests ORDER BY created_at DESC;
```

### View pending order requests
```sql
SELECT * FROM order_requests WHERE status = 'pending' ORDER BY created_at DESC;
```

### Update order status
```sql
UPDATE order_requests 
SET status = 'processing', processed_at = NOW() 
WHERE id = 'your-order-id';
```

### Get order with customer details
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
WHERE id = 'your-order-id';
```

## Environment Variables

Make sure your Supabase configuration is properly set up in your environment:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Security

The table includes Row Level Security (RLS) policies that can be enabled as needed. Uncomment the policy examples in the schema file to restrict access based on your requirements.
