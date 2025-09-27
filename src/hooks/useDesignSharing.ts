import { useState, useCallback } from 'react';
import { supabase, SavedDesign } from '@/lib/supabase';

// Generate a random share token
const generateShareToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export interface DesignData {
  colorwayId: string;
  logoUrl?: string;
  logoColor1: string;
  logoColor2: string;
  logoColor3: string;
  logoPosition: [number, number, number];
  logoRotation: [number, number, number];
  logoScale: number;
  circleLogoUrl?: string;
  customColors: {
    upperBaseColor?: string;
    soleBaseColor?: string;
    laceColor?: string;
  };
  splatterConfig: {
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
  gradientConfig: {
    upperHasGradient: boolean;
    soleHasGradient: boolean;
    upperGradientColor1: string;
    upperGradientColor2: string;
    soleGradientColor1: string;
    soleGradientColor2: string;
  };
  textureConfig: {
    upperTexture?: string | null;
    soleTexture?: string | null;
  };
}

export const useDesignSharing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveDesign = useCallback(async (
    name: string,
    designData: DesignData,
    description: string = '',
    isPublic: boolean = true
  ): Promise<{ shareToken: string; design: SavedDesign } | null> => {
    console.log('saveDesign called with:', { name, designData, description, isPublic });
    
    setIsLoading(true);
    setError(null);

    try {
      // Check if Supabase is properly configured
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseAnonKey) {
        throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_ANON_KEY in your environment variables.');
      }
      
      console.log('Supabase client configured, attempting to save...');
      const shareToken = generateShareToken();

      console.log('Inserting into saved_designs table...');
      
      const { data, error: supabaseError } = await supabase
        .from('saved_designs')
        .insert({
          share_token: shareToken,
          name,
          description,
          is_public: isPublic,
          colorway_id: designData.colorwayId,
          logo_url: designData.logoUrl,
          logo_color1: designData.logoColor1,
          logo_color2: designData.logoColor2,
          logo_color3: designData.logoColor3,
          logo_position: designData.logoPosition,
          logo_rotation: designData.logoRotation,
          logo_scale: designData.logoScale,
          circle_logo_url: designData.circleLogoUrl,
          custom_upper_base_color: designData.customColors.upperBaseColor,
          custom_sole_base_color: designData.customColors.soleBaseColor,
          custom_lace_color: designData.customColors.laceColor,
          design_config: {
            splatterConfig: designData.splatterConfig,
            gradientConfig: designData.gradientConfig,
            textureConfig: designData.textureConfig,
          },
          created_by: 'anonymous'
        })
        .select()
        .single();

      console.log('Supabase response:', { data, supabaseError });

      if (supabaseError) {
        console.error('Supabase error details:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        });
        setError(`Failed to save design: ${supabaseError.message}`);
        return null;
      }

      return { shareToken, design: data as SavedDesign };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error saving design:', err);
      setError(`Failed to save design: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDesign = useCallback(async (shareToken: string): Promise<SavedDesign | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('saved_designs')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_public', true)
        .single();

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        setError(`Failed to load design: ${supabaseError.message}`);
        return null;
      }

      if (!data) {
        setError('Design not found or not public');
        return null;
      }

      // Increment view count
      await supabase
        .from('saved_designs')
        .update({
          view_count: (data.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return data as SavedDesign;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error loading design:', err);
      setError(`Failed to load design: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    saveDesign,
    loadDesign,
    isLoading,
    error,
    clearError: () => setError(null)
  };
};
