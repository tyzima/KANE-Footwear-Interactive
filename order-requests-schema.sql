-- Order Requests Table
-- This table stores order requests when customers choose "Order Request" instead of "Buy Now"
CREATE TABLE order_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Order details
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('buy_now', 'order_request')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'fulfilled', 'cancelled')),
  
  -- Customer information
  customer_info JSONB NOT NULL,
  -- Structure: {
  --   "firstName": "string",
  --   "lastName": "string", 
  --   "email": "string",
  --   "phone": "string",
  --   "address": {
  --     "line1": "string",
  --     "line2": "string",
  --     "city": "string",
  --     "state": "string",
  --     "zip": "string",
  --     "country": "string"
  --   },
  --   "notes": "string"
  -- }
  
  -- Product and design information
  product_info JSONB NOT NULL,
  -- Structure: {
  --   "productId": "string",
  --   "productTitle": "string",
  --   "colorwayId": "string",
  --   "colorwayName": "string",
  --   "sizeQuantities": {"M8": 2, "M9": 1},
  --   "totalPairs": 3,
  --   "pricePerPair": 80,
  --   "totalPrice": 240
  -- }
  
  -- Design configuration
  design_config JSONB NOT NULL,
  -- Structure: {
  --   "upper": {
  --     "baseColor": "string",
  --     "hasSplatter": boolean,
  --     "splatterColor": "string",
  --     "splatterColor2": "string",
  --     "splatterBaseColor": "string",
  --     "useDualSplatter": boolean,
  --     "hasGradient": boolean,
  --     "gradientColor1": "string",
  --     "gradientColor2": "string",
  --     "texture": "string",
  --     "paintDensity": number
  --   },
  --   "sole": { ... same structure as upper ... },
  --   "laces": {
  --     "color": "string"
  --   },
  --   "logo": {
  --     "color": "string",
  --     "url": "string",
  --     "color1": "string",
  --     "color2": "string", 
  --     "color3": "string",
  --     "logoUrl": "string",
  --     "circleLogoUrl": "string"
  --   }
  -- }
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  -- Structure: {
  --   "screenshot": "base64_image_data",
  --   "userAgent": "string",
  --   "ipAddress": "string",
  --   "referrer": "string",
  --   "shopDomain": "string",
  --   "isCustomerContext": boolean
  -- }
  
  -- Timestamps for tracking
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_order_requests_status ON order_requests(status);
CREATE INDEX idx_order_requests_created_at ON order_requests(created_at);
CREATE INDEX idx_order_requests_customer_email ON order_requests ((customer_info->>'email'));
CREATE INDEX idx_order_requests_product_id ON order_requests ((product_info->>'productId'));

-- Create GIN indexes for JSONB columns for better JSON query performance
CREATE INDEX idx_order_requests_customer_info_gin ON order_requests USING GIN (customer_info);
CREATE INDEX idx_order_requests_product_info_gin ON order_requests USING GIN (product_info);
CREATE INDEX idx_order_requests_design_config_gin ON order_requests USING GIN (design_config);
CREATE INDEX idx_order_requests_metadata_gin ON order_requests USING GIN (metadata);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_order_requests_updated_at 
    BEFORE UPDATE ON order_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE order_requests ENABLE ROW LEVEL SECURITY;

-- Example policy (uncomment and modify as needed):
-- CREATE POLICY "Allow authenticated users to insert their own orders" ON order_requests
--     FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Allow authenticated users to view their own orders" ON order_requests
--     FOR SELECT USING (auth.uid() IS NOT NULL);
