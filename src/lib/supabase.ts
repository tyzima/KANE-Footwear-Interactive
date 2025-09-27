import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ofocvxnnkwegfrdmxsaj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn('Supabase anon key not found. Please add VITE_SUPABASE_ANON_KEY to your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '');

// Types for our database
export interface SavedDesign {
  id: string;
  share_token: string;
  name: string;
  description: string;
  is_public: boolean;
  colorway_id: string;
  logo_url?: string;
  logo_color1: string;
  logo_color2: string;
  logo_color3: string;
  logo_position: [number, number, number];
  logo_rotation: [number, number, number];
  logo_scale: number;
  circle_logo_url?: string;
  custom_upper_base_color?: string;
  custom_sole_base_color?: string;
  custom_lace_color?: string;
  design_config: {
    splatterConfig?: {
      upperHasSplatter: boolean;
      soleHasSplatter: boolean;
      upperSplatterColor: string;
      soleSplatterColor: string;
      upperSplatterColor2?: string;
      soleSplatterColor2?: string;
      upperSplatterBaseColor?: string;
      soleSplatterBaseColor?: string;
      upperUseDualSplatter: boolean;
      soleUseDualSplatter: boolean;
      upperPaintDensity: number;
      solePaintDensity: number;
    };
    gradientConfig?: {
      upperHasGradient: boolean;
      soleHasGradient: boolean;
      upperGradientColor1: string;
      upperGradientColor2: string;
      soleGradientColor1: string;
      soleGradientColor2: string;
    };
    textureConfig?: {
      upperTexture?: string | null;
      soleTexture?: string | null;
    };
  };
  created_by: string;
  view_count: number;
  last_viewed_at?: string;
  created_at: string;
}
