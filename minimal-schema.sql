-- Minimal KANE Footwear Database Schema for Sharing
-- Run this in Supabase Dashboard: https://supabase.com/dashboard/project/ofocvxnnkwegfrdmxsaj/editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Main table for saved designs (PUBLIC ACCESS)
CREATE TABLE IF NOT EXISTS saved_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Design configuration
  colorway_id TEXT NOT NULL,
  
  -- Logo configuration  
  logo_url TEXT,
  logo_color1 TEXT DEFAULT '#2048FF',
  logo_color2 TEXT DEFAULT '#000000', 
  logo_color3 TEXT DEFAULT '#C01030',
  logo_position JSONB DEFAULT '[0, 0, 0]'::jsonb,
  logo_rotation JSONB DEFAULT '[0, 0, 0]'::jsonb,
  logo_scale DECIMAL DEFAULT 1.0,
  circle_logo_url TEXT,
  
  -- Custom colors (if different from colorway)
  custom_upper_base_color TEXT,
  custom_sole_base_color TEXT,
  custom_lace_color TEXT,
  
  -- All design configuration as JSON (flexible)
  design_config JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_by TEXT DEFAULT 'anonymous',
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE saved_designs ENABLE ROW LEVEL SECURITY;

-- Public policies (anyone can read/create/update)
CREATE POLICY "Anyone can read public designs" ON saved_designs
  FOR SELECT USING (is_public = true);

CREATE POLICY "Anyone can create designs" ON saved_designs  
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update public designs" ON saved_designs
  FOR UPDATE USING (is_public = true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_saved_designs_share_token ON saved_designs(share_token);
CREATE INDEX IF NOT EXISTS idx_saved_designs_created_at ON saved_designs(created_at DESC);

-- Insert a test design
INSERT INTO saved_designs (
  share_token,
  name, 
  description,
  colorway_id,
  design_config
) VALUES (
  'demo123',
  'Demo Design',
  'A sample shared design',
  'classic-forest',
  '{
    "splatterConfig": {
      "upperHasSplatter": true,
      "soleHasSplatter": false,
      "upperSplatterColor": "#FFFFFF",
      "soleSplatterColor": "#FFFFFF"
    },
    "gradientConfig": {
      "upperHasGradient": false,
      "soleHasGradient": false
    },
    "textureConfig": {
      "upperTexture": null,
      "soleTexture": null  
    }
  }'::jsonb
) ON CONFLICT (share_token) DO NOTHING;
