import React, { useState, useRef, useEffect } from 'react';
import { ShoeViewer } from '@/components/ShoeViewer';
import { ShareButton } from '@/components/ShareButton';
import { BuyButton } from '@/components/BuyButton';
import FeatureIconsBar from '@/components/feature-icons-bar';
import { useTheme } from '@/hooks/use-theme';
import { useSharedDesignLoader, convertSavedDesignToDesignData } from '@/hooks/useSharedDesignLoader';
import { DesignData } from '@/hooks/useDesignSharing';
import { toast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

const Index = () => {
  const { isDark } = useTheme();
  const [backgroundType, setBackgroundType] = useState<'light' | 'dark' | 'turf'>('light');
  
  // Shared design loading callback (memoized to prevent infinite re-renders)
  const onDesignLoaded = useCallback((design: any) => {
    console.log('Loading shared design:', design);
    console.log('Design splatter_config:', design.splatter_config);
    console.log('Design gradient_config:', design.gradient_config);
    console.log('Design texture_config:', design.texture_config);
    
    // Apply the loaded design to the color configuration
    if (design) {
      // Update color configuration from saved design
      setColorConfiguration(prevConfig => ({
        ...prevConfig,
        upper: {
          ...prevConfig.upper,
          baseColor: design.custom_upper_base_color || prevConfig.upper.baseColor,
          hasSplatter: design.splatter_config?.upperHasSplatter || false,
          splatterColor: design.splatter_config?.upperSplatterColor || '#FFFFFF',
          hasGradient: design.gradient_config?.upperHasGradient || false,
          gradientColor1: design.gradient_config?.upperGradientColor1 || '#4a8c2b',
          gradientColor2: design.gradient_config?.upperGradientColor2 || '#c25d1e',
          texture: design.texture_config?.upperTexture || null,
          paintDensity: design.splatter_config?.upperPaintDensity || 50,
        },
        sole: {
          ...prevConfig.sole,
          baseColor: design.custom_sole_base_color || prevConfig.sole.baseColor,
          hasSplatter: design.splatter_config?.soleHasSplatter || false,
          splatterColor: design.splatter_config?.soleSplatterColor || '#FFFFFF',
          hasGradient: design.gradient_config?.soleHasGradient || false,
          gradientColor1: design.gradient_config?.soleGradientColor1 || '#4a8c2b',
          gradientColor2: design.gradient_config?.soleGradientColor2 || '#c25d1e',
          texture: design.texture_config?.soleTexture || null,
          paintDensity: design.splatter_config?.solePaintDensity || 50,
        },
        laces: {
          ...prevConfig.laces,
          color: design.custom_lace_color || prevConfig.laces.color,
        },
        logos: {
          ...prevConfig.logos,
          color1: design.logo_color1 || '#2048FF',
          color2: design.logo_color2 || '#000000',
          color3: design.logo_color3 || '#C01030',
          logoUrl: design.logo_url || null,
          circleLogoUrl: design.circle_logo_url || null,
        }
      }));

      // Show success message
      toast({
        title: "Design loaded!",
        description: `Loaded "${design.name}" design.`,
      });
    }
  }, []);

  const { design: sharedDesign, isLoading: isLoadingSharedDesign, error: sharedDesignError, hasSharedDesign } = useSharedDesignLoader(
    onDesignLoaded
  );

  // Set initial background type based on system dark mode preference
  useEffect(() => {
    if (isDark) {
      setBackgroundType('dark');
    } else {
      setBackgroundType('light');
    }
  }, [isDark]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorConfiguration, setColorConfiguration] = useState<{
    upper: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string;
      hasGradient: boolean;
      gradientColor1: string;
      gradientColor2: string;
      texture: string | null;
      paintDensity: number;
    };
    sole: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string;
      hasGradient: boolean;
      gradientColor1: string;
      gradientColor2: string;
      texture: string | null;
      paintDensity: number;
    };
    laces: {
      color: string;
    };
    logo: {
      color: string;
      url: string | null;
    };
  } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  // Helper to determine if current background should use dark mode styling
  const isDarkMode = backgroundType === 'dark' || backgroundType === 'turf';

  // Function to get current design state for sharing
  const getCurrentDesignState = (): DesignData => {
    // Capture the current design state from colorConfiguration
    return {
      colorwayId: 'custom-design', // Use custom since we're capturing current state
      logoColor1: colorConfiguration?.logos?.color1 || '#2048FF',
      logoColor2: colorConfiguration?.logos?.color2 || '#000000', 
      logoColor3: colorConfiguration?.logos?.color3 || '#C01030',
      logoPosition: [0.8, 0.2, 0.5],
      logoRotation: [0, -0.3, 0],
      logoScale: 1.0,
      circleLogoUrl: colorConfiguration?.logos?.circleLogoUrl || null,
      customColors: {
        upperBaseColor: colorConfiguration?.upper?.baseColor,
        soleBaseColor: colorConfiguration?.sole?.baseColor,
        laceColor: colorConfiguration?.laces?.color,
      },
      splatterConfig: {
        upperHasSplatter: colorConfiguration?.upper?.hasSplatter || false,
        soleHasSplatter: colorConfiguration?.sole?.hasSplatter || false,
        upperSplatterColor: colorConfiguration?.upper?.splatterColor || '#FFFFFF',
        soleSplatterColor: colorConfiguration?.sole?.splatterColor || '#FFFFFF',
        upperUseDualSplatter: false,
        soleUseDualSplatter: false,
        upperPaintDensity: colorConfiguration?.upper?.paintDensity || 50,
        solePaintDensity: colorConfiguration?.sole?.paintDensity || 50,
      },
      gradientConfig: {
        upperHasGradient: colorConfiguration?.upper?.hasGradient || false,
        soleHasGradient: colorConfiguration?.sole?.hasGradient || false,
        upperGradientColor1: colorConfiguration?.upper?.gradientColor1 || '#4a8c2b',
        upperGradientColor2: colorConfiguration?.upper?.gradientColor2 || '#c25d1e',
        soleGradientColor1: colorConfiguration?.sole?.gradientColor1 || '#4a8c2b',
        soleGradientColor2: colorConfiguration?.sole?.gradientColor2 || '#c25d1e',
      },
      textureConfig: {
        upperTexture: colorConfiguration?.upper?.texture,
        soleTexture: colorConfiguration?.sole?.texture,
      },
    };
  };

  const features = [
    {
      text: 'Sustainable',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      )
    },
    {
      text: 'Washable',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="rotate-180" width="16" height="16" viewBox="0 0 16 16" fill="gray">
          <path d="M8 2a5.5 5.5 0 0 0-5.5 5.5c0 5 5.5 8 5.5 8s5.5-3 5.5-8A5.5 5.5 0 0 0 8 2z"/>
        </svg>
      )
    },
    {
      text: 'Quick drying',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="20" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6c5 0 9-4 18 0"/>
        <path d="M3 12c5 0 8-3 14 0"/>
        <path d="M3 18c4 0 7-2 12 0"/>
      </svg>
      )
    },
    {
      text: 'Ultra durable',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      )
    },
  ];

  return (
    <div className="min-h-screen max-h-screen bg-gradient-hero">
      {/* Main Viewer Section - Full Height */}
      <main className="h-screen max-h-screen overflow-y-hidden relative">
        {/* Product Branding - Top Left */}
        <div className="absolute top-10 ml-10 md:ml-20 z-30 flex flex-col sm:flex-col items-start sm:items-center gap-2 sm:gap-4">
  <img
    src="/mainkanelogo.png"
    alt="KANE Logo"
    className={`h-6 md:h-8 w-auto  md:-ml-20 transition-all duration-300 ${isDarkMode ? 'invert' : ''}`}
  />
  <div className="max-w-[280px]">
    <div className="flex md:ml-0 items-center gap-3 sm:gap-3">
      <h1 className={`text-2xl mt-2 font-normal transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>Revive</h1>
      <span className={`px-2 py-[2px] md:py-1 mt-2 md:mt-0 ml-0 sm:ml-0 tracking-wider text-[8px] sm:text-[9px] font-medium rounded-full transition-colors duration-300 ${isDarkMode
        ? 'bg-transparent border border-white/20 text-white/90'
        : 'bg-accent/20 text-accent'
        }`}>
        CUSTOM
      </span>
      <button
        onClick={() => setShowInfo(true)}
        className={` md:hidden w-6 h-6 mt-1.5 rounded-full text-sm font-normal transition-colors duration-300 ${isDarkMode ? 'border border-white/10 text-white' : 'bg-gray-200 text-gray-800'}`}
      >
        +
      </button>
    </div>
    <div className="hidden md:block mt-4 ">
      <p className={`text-sm transition-colors duration-300 ${isDarkMode ? 'text-white/80' : 'text-foreground/70'}`}>
        A transformative, sustainably designed injection molded shoe for active recovery.
      </p>
      <div className={`flex flex-wrap gap-3 mt-2 transition-colors duration-300`}>
     
</div>

      <p className={`text-lg font-bold mt-2 bg-slate-400/10  border border-slate-500/10 w-12 h-12 flex items-center justify-center pr-3 rounded-lg px-2 py-1 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
        <span className={`text-xs relative top-[-2px] mr-.5 ${isDarkMode ? 'text-white/80' : 'text-foreground/70'}`}>$</span>75
      </p>
  
    </div>
    <FeatureIconsBar isDarkMode={isDarkMode}/>
  </div>
</div>

        {/* Buy and Share Buttons - Top Right */}
        <div className="absolute top-8 right-8 z-30 flex flex-col gap-3">
          <BuyButton
            canvasRef={canvasRef}
            isDarkMode={isDarkMode}
            getColorConfiguration={() => colorConfiguration}
          />
          <ShareButton
            canvasRef={canvasRef}
            isDarkMode={isDarkMode}
            getCurrentDesign={getCurrentDesignState}
          />
        </div>

        {/* Full Height 3D Viewer */}
        <div className="h-full relative">
          <ShoeViewer
            className="h-full"
            backgroundType={backgroundType}
            onBackgroundTypeChange={setBackgroundType}
            canvasRef={canvasRef}
            onColorConfigurationChange={setColorConfiguration}
            colorConfiguration={colorConfiguration}
          />
        </div>

        {/* Info Popup for Mobile */}
        {showInfo && (
  // Modal Overlay: uses a slightly darker overlay for better contrast.
  // Added a fade-in transition for a smoother appearance.
  <div
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 transition-opacity duration-300"
    onClick={() => setShowInfo(false)}
  >
    {/* Modal Card: 
      - Increased padding (p-8) and corner rounding (rounded-2xl).
      - Added a pronounced shadow (shadow-2xl) to lift it off the background.
      - Implemented a subtle scale-in animation.
      - Uses a flex column layout with spacing (space-y-4) for clean vertical rhythm.
    */}
    <div
      className={`max-w-md w-full m-4 p-8 rounded-2xl shadow-2xl flex flex-col space-y-4
                  transform transition-all duration-300 scale-100
                  ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Larger, bolder title for emphasis. */}
      <h2 className="text-3xl font-bold tracking-tight">
        Revive Recovery Footwear
      </h2>

      {/* Description: Uses a softer, secondary text color for readability. */}
      <p className={`text-base ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
        A transformative, sustainably designed injection molded shoe for active recovery. 
        <br />  <br /> For the athlete, by the athlete.
      </p>

      {/* Features: Increased gap for better separation and a lighter text color. */}
      <div className={`flex flex-col gap-x-6 gap-y-3 pt-2 text-sm ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
        {features.map((feature, index) => (
          <div key={index} className="flex  gap-2">
            {feature.icon}
            <span>{feature.text}</span>
          </div>
        ))}
      </div>

      {/* Price: Made larger and bolder to stand out as a key piece of information. */}
      <p className="text-3xl font-semibold pt-2">
        $75
      </p>

      {/* Button: 
        - High-contrast design that inverts for light/dark mode.
        - Added hover states for better interactivity.
        - Increased font weight and padding for a more substantial feel.
      */}
      <button
        onClick={() => setShowInfo(false)}
        className={`w-1/2 py-3 mt-4 rounded-lg font-semibold transition-colors duration-200 
                    ${isDarkMode
                      ? 'bg-white text-black hover:bg-neutral-200'
                      : 'bg-black text-white hover:bg-neutral-800'
                    }`}
      >
        Got it.
      </button>
    </div>
  </div>
)}
      </main>
    </div>
  );
};

export default Index;