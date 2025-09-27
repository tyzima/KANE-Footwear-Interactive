-- KANE Footwear Interactive Shoes Database Schema
-- This schema supports saving and sharing custom shoe designs

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Colorways table (synced from Shopify products)
CREATE TABLE IF NOT EXISTS colorways (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  shopify_product_id TEXT NOT NULL,
  shopify_variant_id TEXT NOT NULL,
  inventory_quantity INTEGER DEFAULT 0,
  
  -- Upper color configuration
  upper_base_color TEXT,
  upper_has_splatter BOOLEAN DEFAULT FALSE,
  upper_splatter_color TEXT,
  upper_splatter_base_color TEXT,
  upper_splatter_color2 TEXT,
  upper_use_dual_splatter BOOLEAN DEFAULT FALSE,
  upper_paint_density DECIMAL DEFAULT 0.5,
  
  -- Sole color configuration
  sole_base_color TEXT,
  sole_has_splatter BOOLEAN DEFAULT FALSE,
  sole_splatter_color TEXT,
  sole_splatter_base_color TEXT,
  sole_splatter_color2 TEXT,
  sole_use_dual_splatter BOOLEAN DEFAULT FALSE,
  sole_paint_density DECIMAL DEFAULT 0.5,
  
  -- Lace configuration
  lace_color TEXT,
  
  -- Advanced features
  upper_has_gradient BOOLEAN DEFAULT FALSE,
  upper_gradient_color1 TEXT,
  upper_gradient_color2 TEXT,
  sole_has_gradient BOOLEAN DEFAULT FALSE,
  sole_gradient_color1 TEXT,
  sole_gradient_color2 TEXT,
  
  upper_texture TEXT,
  sole_texture TEXT,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Size to variant mapping table
CREATE TABLE IF NOT EXISTS size_variants (
  id SERIAL PRIMARY KEY,
  colorway_id TEXT REFERENCES colorways(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  shopify_variant_id TEXT NOT NULL,
  inventory_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved designs table (PUBLIC - anyone with link can view)
CREATE TABLE IF NOT EXISTS saved_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE, -- Making all designs public by default
  
  -- Design configuration
  colorway_id TEXT REFERENCES colorways(id),
  
  -- Logo configuration
  logo_url TEXT,
  logo_color1 TEXT DEFAULT '#2048FF', -- Blue parts
  logo_color2 TEXT DEFAULT '#000000', -- Black parts  
  logo_color3 TEXT DEFAULT '#C01030', -- Red parts
  logo_position JSONB DEFAULT '[0, 0, 0]'::jsonb,
  logo_rotation JSONB DEFAULT '[0, 0, 0]'::jsonb,
  logo_scale DECIMAL DEFAULT 1.0,
  circle_logo_url TEXT,
  
  -- Custom colors (if different from colorway defaults)
  custom_upper_base_color TEXT,
  custom_sole_base_color TEXT,
  custom_lace_color TEXT,
  
  -- Splatter configuration
  splatter_config JSONB DEFAULT '{
    "upperHasSplatter": false,
    "soleHasSplatter": false,
    "upperSplatterColor": "#FFFFFF",
    "soleSplatterColor": "#FFFFFF",
    "upperSplatterColor2": null,
    "soleSplatterColor2": null,
    "upperUseDualSplatter": false,
    "soleUseDualSplatter": false,
    "upperPaintDensity": 0.5,
    "solePaintDensity": 0.5
  }'::jsonb,
  
  -- Gradient configuration
  gradient_config JSONB DEFAULT '{
    "upperHasGradient": false,
    "upperGradientColor1": "#4a8c2b",
    "upperGradientColor2": "#c25d1e",
    "soleHasGradient": false,
    "soleGradientColor1": "#4a8c2b",
    "soleGradientColor2": "#c25d1e"
  }'::jsonb,
  
  -- Texture configuration
  texture_config JSONB DEFAULT '{
    "upperTexture": null,
    "soleTexture": null
  }'::jsonb,
  
  -- User info (optional)
  created_by TEXT DEFAULT 'anonymous',
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order configurations table
CREATE TABLE IF NOT EXISTS order_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  design_id UUID REFERENCES saved_designs(id) ON DELETE SET NULL,
  
  -- Customer info (stored as JSON for flexibility)
  customer_info JSONB NOT NULL,
  
  -- Order details
  size_quantities JSONB NOT NULL, -- {"M3": 1, "M4": 2, etc.}
  total_pairs INTEGER NOT NULL,
  total_price DECIMAL NOT NULL,
  price_per_pair DECIMAL NOT NULL DEFAULT 80.00,
  
  -- Design snapshot
  model_screenshot TEXT, -- Base64 encoded image
  color_configuration JSONB, -- Complete color state at time of order
  
  -- Shopify integration
  shopify_draft_order_id TEXT,
  shopify_order_id TEXT,
  shopify_customer_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_colorways_active ON colorways(is_active);
CREATE INDEX IF NOT EXISTS idx_colorways_shopify_product ON colorways(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_size_variants_colorway ON size_variants(colorway_id);
CREATE INDEX IF NOT EXISTS idx_saved_designs_share_token ON saved_designs(share_token);
CREATE INDEX IF NOT EXISTS idx_saved_designs_public ON saved_designs(is_public);
CREATE INDEX IF NOT EXISTS idx_saved_designs_created_at ON saved_designs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_configurations_status ON order_configurations(status);
CREATE INDEX IF NOT EXISTS idx_order_configurations_expires ON order_configurations(expires_at);

-- Enable Row Level Security (RLS) but make saved_designs publicly readable
ALTER TABLE colorways ENABLE ROW LEVEL SECURITY;
ALTER TABLE size_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_configurations ENABLE ROW LEVEL SECURITY;

-- Public read access for colorways (anyone can view available colorways)
CREATE POLICY "Colorways are publicly readable" ON colorways
  FOR SELECT USING (is_active = true);

-- Public read access for size variants
CREATE POLICY "Size variants are publicly readable" ON size_variants
  FOR SELECT USING (true);

-- Public read access for saved designs (anyone with link can view)
CREATE POLICY "Public designs are readable by anyone" ON saved_designs
  FOR SELECT USING (is_public = true);

-- Allow anyone to create saved designs (for sharing)
CREATE POLICY "Anyone can create saved designs" ON saved_designs
  FOR INSERT WITH CHECK (true);

-- Allow viewing own designs and updating view counts
CREATE POLICY "Allow updating view counts on public designs" ON saved_designs
  FOR UPDATE USING (is_public = true)
  WITH CHECK (is_public = true);

-- Order configurations - only allow creating new orders
CREATE POLICY "Anyone can create order configurations" ON order_configurations
  FOR INSERT WITH CHECK (true);

-- Allow reading order configurations for a limited time
CREATE POLICY "Order configurations are readable until expired" ON order_configurations
  FOR SELECT USING (expires_at > NOW());

-- Insert some sample colorways based on your current data
INSERT INTO colorways (
  id, name, description, shopify_product_id, shopify_variant_id,
  upper_base_color, upper_has_splatter, upper_splatter_color, upper_splatter_base_color, upper_splatter_color2, upper_use_dual_splatter,
  sole_base_color, sole_has_splatter, sole_splatter_color, sole_splatter_base_color, sole_splatter_color2, sole_use_dual_splatter,
  lace_color, is_active
) VALUES 
  (
    'classic-forest', 'Classic Forest', 'Timeless forest green with natural tones', 
    'shopify_product_1', 'shopify_variant_1',
    '#2d5016', false, null, null, null, false,
    '#8b4513', false, null, null, null, false,
    '#FFFFFF', true
  ),
  (
    'forest-splatter', 'Forest Splatter', 'Forest green with white paint splatter',
    'shopify_product_1', 'shopify_variant_2', 
    '#2d5016', true, '#f8f8ff', '#060c03', '#0d1806', false,
    '#8b4513', false, null, null, null, false,
    '#FFFFFF', true
  ),
  (
    'crimson-classic', 'Crimson Classic', 'Bold crimson with clean white sole',
    'shopify_product_2', 'shopify_variant_3',
    '#C01030', false, null, null, null, false,
    '#FFFFFF', false, null, null, null, false,
    '#C01030', true
  ),
  (
    'crimson-splatter', 'Crimson Splatter', 'Crimson with white paint splatter effect',
    'shopify_product_2', 'shopify_variant_4',
    '#C01030', true, '#f8f8ff', '#1c0207', '#39040e', false,
    '#FFFFFF', false, null, null, null, false,
    '#C01030', true
  ),
  (
    'dual-splatter-test', 'Dual Splatter Test', 'White upper with red and blue dual splatter',
    'shopify_product_3', 'shopify_variant_5',
    '#FFFFFF', true, '#FF0000', '#F0F0F0', '#0000FF', true,
    '#FFFFFF', false, null, null, null, false,
    '#000000', true
  )
ON CONFLICT (id) DO NOTHING;

-- Insert sample size variants for the colorways
INSERT INTO size_variants (colorway_id, size, shopify_variant_id, inventory_quantity) VALUES
  ('classic-forest', 'M3', 'variant_classic_forest_m3', 10),
  ('classic-forest', 'M4', 'variant_classic_forest_m4', 15),
  ('classic-forest', 'M5', 'variant_classic_forest_m5', 20),
  ('classic-forest', 'M6', 'variant_classic_forest_m6', 25),
  ('classic-forest', 'M7', 'variant_classic_forest_m7', 30),
  ('classic-forest', 'M8', 'variant_classic_forest_m8', 25),
  ('classic-forest', 'M9', 'variant_classic_forest_m9', 20),
  ('classic-forest', 'M10', 'variant_classic_forest_m10', 15),
  ('classic-forest', 'M11', 'variant_classic_forest_m11', 10),
  ('forest-splatter', 'M3', 'variant_forest_splatter_m3', 8),
  ('forest-splatter', 'M4', 'variant_forest_splatter_m4', 12),
  ('forest-splatter', 'M5', 'variant_forest_splatter_m5', 18),
  ('forest-splatter', 'M6', 'variant_forest_splatter_m6', 22),
  ('forest-splatter', 'M7', 'variant_forest_splatter_m7', 28),
  ('forest-splatter', 'M8', 'variant_forest_splatter_m8', 22),
  ('forest-splatter', 'M9', 'variant_forest_splatter_m9', 18),
  ('forest-splatter', 'M10', 'variant_forest_splatter_m10', 12),
  ('forest-splatter', 'M11', 'variant_forest_splatter_m11', 8)
ON CONFLICT DO NOTHING;
