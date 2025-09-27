# KANE Footwear Supabase Setup Guide

## Quick Setup

1. **Go to your Supabase dashboard:**
   https://supabase.com/dashboard/project/ofocvxnnkwegfrdmxsaj/editor

2. **Copy and paste the SQL from `supabase-schema.sql` into the SQL editor**

3. **Click "Run" to execute the schema**

## Manual Setup (Alternative)

If the full schema doesn't work, run these tables one by one:

### 1. Enable UUID Extension
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. Saved Designs Table (Main table for sharing)
```sql
CREATE TABLE saved_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_token TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Design configuration
  colorway_id TEXT,
  
  -- Logo configuration
  logo_url TEXT,
  logo_color1 TEXT DEFAULT '#2048FF',
  logo_color2 TEXT DEFAULT '#000000',
  logo_color3 TEXT DEFAULT '#C01030',
  logo_position JSONB DEFAULT '[0, 0, 0]'::jsonb,
  logo_rotation JSONB DEFAULT '[0, 0, 0]'::jsonb,
  logo_scale DECIMAL DEFAULT 1.0,
  circle_logo_url TEXT,
  
  -- Custom colors
  custom_upper_base_color TEXT,
  custom_sole_base_color TEXT,
  custom_lace_color TEXT,
  
  -- Configuration stored as JSON
  splatter_config JSONB DEFAULT '{}'::jsonb,
  gradient_config JSONB DEFAULT '{}'::jsonb,
  texture_config JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_by TEXT DEFAULT 'anonymous',
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Enable Public Access
```sql
-- Enable RLS
ALTER TABLE saved_designs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read public designs
CREATE POLICY "Public designs are readable" ON saved_designs
  FOR SELECT USING (is_public = true);

-- Allow anyone to create designs
CREATE POLICY "Anyone can create designs" ON saved_designs
  FOR INSERT WITH CHECK (true);

-- Allow updating view counts
CREATE POLICY "Allow view count updates" ON saved_designs
  FOR UPDATE USING (is_public = true);
```

### 4. Create Index
```sql
CREATE INDEX idx_saved_designs_share_token ON saved_designs(share_token);
```

## Test the Setup

After running the schema, test it by inserting a sample design:

```sql
INSERT INTO saved_designs (
  share_token, 
  name, 
  description,
  colorway_id,
  splatter_config
) VALUES (
  'test123',
  'Test Design',
  'A test design for sharing',
  'classic-forest',
  '{"upperHasSplatter": true, "soleHasSplatter": false}'::jsonb
);
```

Then query it:
```sql
SELECT * FROM saved_designs WHERE share_token = 'test123';
```

## Environment Variables

Add these to your `.env.local`:

```env
VITE_SUPABASE_URL=https://ofocvxnnkwegfrdmxsaj.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get your anon key from: https://supabase.com/dashboard/project/ofocvxnnkwegfrdmxsaj/settings/api

## Next Steps

1. ✅ Set up database tables
2. 🔄 Update ShareButton to save designs
3. 🔄 Add URL parameter detection
4. 🔄 Create design loading functionality
5. 🔄 Test sharing workflow
