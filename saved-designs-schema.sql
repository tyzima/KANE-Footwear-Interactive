-- Saved Designs Table
-- This table stores saved shoe designs that can be shared or reused
CREATE TABLE saved_designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Design metadata
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by VARCHAR(255), -- User identifier (email, user_id, etc.)
  
  -- Product information
  product_info JSONB NOT NULL,
  -- Structure: {
  --   "productId": "string",
  --   "productTitle": "string",
  --   "colorwayId": "string",
  --   "colorwayName": "string"
  -- }
  
  -- Design configuration (same structure as order_requests)
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
  --   "shopDomain": "string",
  --   "isCustomerContext": boolean,
  --   "tags": ["string"], // Optional tags for organization
  --   "shareUrl": "string" // Optional shareable URL
  -- }
);

-- Create indexes for better query performance
CREATE INDEX idx_saved_designs_created_at ON saved_designs(created_at);
CREATE INDEX idx_saved_designs_is_public ON saved_designs(is_public);
CREATE INDEX idx_saved_designs_created_by ON saved_designs(created_by);
CREATE INDEX idx_saved_designs_product_id ON saved_designs ((product_info->>'productId'));

-- Create GIN indexes for JSONB columns for better JSON query performance
CREATE INDEX idx_saved_designs_product_info_gin ON saved_designs USING GIN (product_info);
CREATE INDEX idx_saved_designs_design_config_gin ON saved_designs USING GIN (design_config);
CREATE INDEX idx_saved_designs_metadata_gin ON saved_designs USING GIN (metadata);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_designs_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_designs_updated_at 
    BEFORE UPDATE ON saved_designs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_saved_designs_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE saved_designs ENABLE ROW LEVEL SECURITY;

-- Example policy (uncomment and modify as needed):
-- CREATE POLICY "Allow authenticated users to insert their own designs" ON saved_designs
--     FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- CREATE POLICY "Allow public read access to public designs" ON saved_designs
--     FOR SELECT USING (is_public = true);

-- CREATE POLICY "Allow users to view their own designs" ON saved_designs
--     FOR SELECT USING (created_by = auth.email());
