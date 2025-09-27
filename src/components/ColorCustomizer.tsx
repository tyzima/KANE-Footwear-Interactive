import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { Palette, Droplets, ChevronDown, ChevronUp, School, Upload, Paintbrush, ChevronLeft, ChevronRight, MessageCircle, X, Send, Bot, Settings, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { LogoUploader } from './LogoUploader';
import { SchoolSelector } from './SchoolSelector';
import { ColorwaySwatch } from './ColorwaySwatch';
import { ColorPickerPortal } from './ColorPickerPortal';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useColorways } from '@/hooks/useColorways';
import { detectShopDomain } from '@/utils/shopDetection';

interface Colorway {
  id: string;
  name: string;
  description: string;
  upper: {
    baseColor: string;
    hasSplatter: boolean;
    splatterColor: string | null;
    splatterColor2: string | null;
    splatterBaseColor: string | null;
    useDualSplatter: boolean;
  };
  sole: {
    baseColor: string;
    hasSplatter: boolean;
    splatterColor: string | null;
    splatterColor2: string | null;
    splatterBaseColor: string | null;
    useDualSplatter: boolean;
  };
  laces: {
    color: string;
  };
}

interface ColorCustomizerProps {
  // Current colorway state
  selectedColorwayId: string;
  onColorwayChange: (colorway: Colorway) => void;
  
  // Legacy props for backward compatibility (will be managed internally)
  topColor: string;
  bottomColor: string;
  onTopColorChange: (color: string) => void;
  onBottomColorChange: (color: string) => void;
  upperHasSplatter: boolean;
  soleHasSplatter: boolean;
  upperSplatterColor: string;
  soleSplatterColor: string;
  upperSplatterColor2?: string | null;
  soleSplatterColor2?: string | null;
  upperSplatterBaseColor?: string | null;
  soleSplatterBaseColor?: string | null;
  upperUseDualSplatter?: boolean;
  soleUseDualSplatter?: boolean;
  upperPaintDensity: number;
  solePaintDensity: number;
  onUpperSplatterToggle: (enabled: boolean) => void;
  onSoleSplatterToggle: (enabled: boolean) => void;
  onUpperSplatterColorChange: (color: string) => void;
  onSoleSplatterColorChange: (color: string) => void;
  onUpperSplatterColor2Change?: (color: string) => void;
  onSoleSplatterColor2Change?: (color: string) => void;
  onUpperUseDualSplatterChange?: (enabled: boolean) => void;
  onSoleUseDualSplatterChange?: (enabled: boolean) => void;
  onUpperPaintDensityChange: (density: number) => void;
  onSolePaintDensityChange: (density: number) => void;
  activeTab?: 'colorways' | 'logos';
  onTabChange?: (tab: 'colorways' | 'logos') => void;
  // Lace colors (single color for both left and right)
  laceColor?: string;
  onLaceColorChange?: (color: string) => void;
  // Logo colors - now supporting 3 separate colors
  logoColor1?: string; // Blue parts
  logoColor2?: string; // Black parts  
  logoColor3?: string; // Red parts
  onLogoColor1Change?: (color: string) => void;
  onLogoColor2Change?: (color: string) => void;
  onLogoColor3Change?: (color: string) => void;
  upperHasGradient?: boolean;
  soleHasGradient?: boolean;
  upperGradientColor1?: string;
  upperGradientColor2?: string;
  soleGradientColor1?: string;
  soleGradientColor2?: string;
  onUpperGradientToggle?: (enabled: boolean) => void;
  onSoleGradientToggle?: (enabled: boolean) => void;
  onUpperGradientColor1Change?: (color: string) => void;
  onUpperGradientColor2Change?: (color: string) => void;
  onSoleGradientColor1Change?: (color: string) => void;
  onSoleGradientColor2Change?: (color: string) => void;
  upperTexture?: string | null;
  soleTexture?: string | null;
  onUpperTextureChange?: (texture: string | null) => void;
  onSoleTextureChange?: (texture: string | null) => void;
  // Logo props
  logoUrl?: string | null;
  onLogoChange?: (logoUrl: string | null) => void;
  // Circle logo props (for SVG texture)
  circleLogoUrl?: string | null;
  onCircleLogoChange?: (logoUrl: string | null) => void;
  // Dark mode
  isDarkMode?: boolean;
  // Height callback for AIChat positioning
  onHeightChange?: (height: number) => void;
}

const NATIONAL_PARK_COLORS = [
  // Reds
  { name: 'Crimson', value: '#C01030' },
  { name: 'Cardinal Red', value: '#D81E3A' },
  { name: 'Burgundy', value: '#8F0020' },
  // Oranges
  { name: 'Orange', value: '#FF7700' },
  { name: 'Coral', value: '#FF6040' },
  // Yellows
  { name: 'Gold', value: '#FFD700' },
  { name: 'Yellow', value: '#FFDD00' },
  // Greens
  { name: 'Kelly Green', value: '#2CBB17' },
  { name: 'Forest Green', value: '#004F21' },
  { name: 'Mint', value: '#70FFB0' },
  { name: 'Olive', value: '#6B8000' },
  // Blues
  { name: 'Turquoise', value: '#00E0D0' },
  { name: 'Teal', value: '#008B8B' },
  { name: 'Sky Blue', value: '#50BAFF' },
  { name: 'Royal Blue', value: '#2048FF' },
  { name: 'Navy Blue', value: '#001F5C' },
  // Purples
  { name: 'Purple', value: '#5D1EAF' },
  { name: 'Lavender', value: '#D8A2FF' },
  { name: 'Pink', value: '#FF3399' },
  // Neutrals
  { name: 'White', value: '#FFFFFF' },
  { name: 'Silver', value: '#C8C8C8' },
  { name: 'Slate Gray', value: '#607080' },
  { name: 'Maroon', value: '#900000' },
  { name: 'Black', value: '#000000' },
];

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  selectedColorwayId,
  onColorwayChange,
  topColor,
  bottomColor,
  onTopColorChange,
  onBottomColorChange,
  upperHasSplatter,
  soleHasSplatter,
  upperSplatterColor,
  soleSplatterColor,
  upperSplatterColor2 = null,
  soleSplatterColor2 = null,
  upperSplatterBaseColor = null,
  soleSplatterBaseColor = null,
  upperUseDualSplatter = false,
  soleUseDualSplatter = false,
  upperPaintDensity,
  solePaintDensity,
  onUpperSplatterToggle,
  onSoleSplatterToggle,
  onUpperSplatterColorChange,
  onSoleSplatterColorChange,
  onUpperSplatterColor2Change = () => {},
  onSoleSplatterColor2Change = () => {},
  onUpperUseDualSplatterChange = () => {},
  onSoleUseDualSplatterChange = () => {},
  onUpperPaintDensityChange,
  onSolePaintDensityChange,
  activeTab: externalActiveTab,
  onTabChange,
  upperHasGradient = false,
  soleHasGradient = false,
  upperGradientColor1 = '#4a8c2b',
  upperGradientColor2 = '#c25d1e',
  soleGradientColor1 = '#4a8c2b',
  soleGradientColor2 = '#c25d1e',
  onUpperGradientToggle = () => { },
  onSoleGradientToggle = () => { },
  onUpperGradientColor1Change = () => { },
  onUpperGradientColor2Change = () => { },
  onSoleGradientColor1Change = () => { },
  onSoleGradientColor2Change = () => { },
  upperTexture = null,
  soleTexture = null,
  onUpperTextureChange = () => { },
  onSoleTextureChange = () => { },
  // Lace colors with defaults (single color for both left and right)
  laceColor = '#FFFFFF',
  onLaceColorChange = () => { },
  // Logo colors with defaults
  logoColor1 = '#2048FF', // Blue parts (Royal Blue)
  logoColor2 = '#000000', // Black parts
  logoColor3 = '#C01030', // Red parts (Crimson)
  onLogoColor1Change = () => { },
  onLogoColor2Change = () => { },
  onLogoColor3Change = () => { },
  // Logo props with defaults
  logoUrl = null,
  onLogoChange = () => { },
  // Circle logo props with defaults
  circleLogoUrl = null,
  onCircleLogoChange = () => { },
  // Dark mode with default
  isDarkMode = false,
  // Height callback for AIChat positioning
  onHeightChange = () => { }
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState<'colorways' | 'logos'>('colorways');
  const [schools, setSchools] = useState<unknown[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<unknown>(null);
  // AI Chat integration
  const [isAIChatActive, setIsAIChatActive] = useState(false);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; isUser: boolean; timestamp: Date }[]>([]);
  const [aiResponseVisible, setAiResponseVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCopyingLogo, setIsCopyingLogo] = useState(false);
  
  // State to track original colors for UI display
  const [originalLogoColor1, setOriginalLogoColor1] = useState(logoColor1);
  const [originalLogoColor2, setOriginalLogoColor2] = useState(logoColor2);
  const [originalLogoColor3, setOriginalLogoColor3] = useState(logoColor3);
  
  // Get dynamic colorways from Shopify
  const shopDomain = useMemo(() => detectShopDomain(), []);
  const { colorways, isLoading: colorwaysLoading, isUsingDynamicData } = useColorways(shopDomain);
  const selectedColorway = colorways.find(c => c.id === selectedColorwayId) || colorways[0];

  // Helper function to find original color from darkened value
  const findOriginalColor = (darkenedValue: string): string => {
    // Import the color library from ColorPickerPortal
    const EXPANDED_COLOR_LIBRARY = [
      // Reds
      { name: 'Crimson', value: '#C01030', darkenedValue: '#4A0510' },
      { name: 'Cardinal Red', value: '#D81E3A', darkenedValue: '#5A0A15' },
      { name: 'Burgundy', value: '#8F0020', darkenedValue: '#2A0008' },
      { name: 'Cherry Red', value: '#E32636', darkenedValue: '#5A0A10' },
      { name: 'Fire Red', value: '#FF4500', darkenedValue: '#661A00' },
      { name: 'Rose Red', value: '#FF69B4', darkenedValue: '#662A45' },
      
      // Oranges
      { name: 'Orange', value: '#FF7700', darkenedValue: '#662F00' },
      { name: 'Coral', value: '#FF6040', darkenedValue: '#662515' },
      { name: 'Tangerine', value: '#FF9500', darkenedValue: '#663A00' },
      { name: 'Peach', value: '#FFCC99', darkenedValue: '#665230' },
      { name: 'Amber', value: '#FFBF00', darkenedValue: '#664C00' },
      
      // Yellows
      { name: 'Gold', value: '#FFD700', darkenedValue: '#665500' },
      { name: 'Yellow', value: '#FFDD00', darkenedValue: '#665A00' },
      { name: 'Lemon', value: '#FFF700', darkenedValue: '#666200' },
      { name: 'Canary', value: '#FFFF99', darkenedValue: '#666630' },
      { name: 'Mustard', value: '#FFDB58', darkenedValue: '#665823' },
      
      // Greens
      { name: 'Kelly Green', value: '#2CBB17', darkenedValue: '#0F4A08' },
      { name: 'Forest Green', value: '#004F21', darkenedValue: '#001A0A' },
      { name: 'Mint', value: '#70FFB0', darkenedValue: '#2A6645' },
      { name: 'Olive', value: '#6B8000', darkenedValue: '#2A3300' },
      { name: 'Lime', value: '#32CD32', darkenedValue: '#145214' },
      { name: 'Emerald', value: '#50C878', darkenedValue: '#1F4F2F' },
      { name: 'Sage', value: '#9CAF88', darkenedValue: '#3F452B' },
      { name: 'Jade', value: '#00A86B', darkenedValue: '#00432A' },
      
      // Blues
      { name: 'Turquoise', value: '#00E0D0', darkenedValue: '#005952' },
      { name: 'Teal', value: '#008B8B', darkenedValue: '#003737' },
      { name: 'Sky Blue', value: '#50BAFF', darkenedValue: '#1F4A66' },
      { name: 'Royal Blue', value: '#2048FF', darkenedValue: '#0A1A66' },
      { name: 'Navy Blue', value: '#001F5C', darkenedValue: '#000A24' },
      { name: 'Cobalt', value: '#0047AB', darkenedValue: '#001A42' },
      { name: 'Steel Blue', value: '#4682B4', darkenedValue: '#1A3345' },
      { name: 'Powder Blue', value: '#B0E0E6', darkenedValue: '#455A5C' },
      { name: 'Azure', value: '#007FFF', darkenedValue: '#003266' },
      
      // Purples
      { name: 'Purple', value: '#5D1EAF', darkenedValue: '#240A42' },
      { name: 'Lavender', value: '#D8A2FF', darkenedValue: '#554066' },
      { name: 'Violet', value: '#8A2BE2', darkenedValue: '#35114A' },
      { name: 'Plum', value: '#DDA0DD', darkenedValue: '#574057' },
      { name: 'Indigo', value: '#4B0082', darkenedValue: '#1A002A' },
      { name: 'Magenta', value: '#FF00FF', darkenedValue: '#660066' },
      
      // Pinks
      { name: 'Pink', value: '#FF3399', darkenedValue: '#66143A' },
      { name: 'Hot Pink', value: '#FF69B4', darkenedValue: '#662A45' },
      { name: 'Rose', value: '#FF007F', darkenedValue: '#660028' },
      { name: 'Salmon', value: '#FA8072', darkenedValue: '#63332E' },
      
      // Neutrals
      { name: 'White', value: '#FFFFFF', darkenedValue: '#B3B3B3' },
      { name: 'Silver', value: '#C8C8C8', darkenedValue: '#666666' },
      { name: 'Slate Gray', value: '#607080', darkenedValue: '#262A33' },
      { name: 'Charcoal', value: '#36454F', darkenedValue: '#151A1F' },
      { name: 'Maroon', value: '#900000', darkenedValue: '#2A0000' },
      { name: 'Black', value: '#000000', darkenedValue: '#000000' },
      { name: 'Ivory', value: '#FFFFF0', darkenedValue: '#B3B3A6' },
      { name: 'Cream', value: '#F5F5DC', darkenedValue: '#66664A' },
      { name: 'Beige', value: '#F5F5DC', darkenedValue: '#66664A' },
      { name: 'Taupe', value: '#D2B48C', darkenedValue: '#554A38' },
    ];
    
    const color = EXPANDED_COLOR_LIBRARY.find(c => c.darkenedValue === darkenedValue);
    return color ? color.value : darkenedValue; // Fallback to darkened value if not found
  };

  // Enhanced color change handlers that update both original and model colors
  const handleLogoColor1Change = (darkenedColor: string) => {
    const originalColor = findOriginalColor(darkenedColor);
    setOriginalLogoColor1(originalColor);
    onLogoColor1Change(darkenedColor); // Pass darkened color to model
  };

  const handleLogoColor2Change = (darkenedColor: string) => {
    const originalColor = findOriginalColor(darkenedColor);
    setOriginalLogoColor2(originalColor);
    onLogoColor2Change(darkenedColor); // Pass darkened color to model
  };

  const handleLogoColor3Change = (darkenedColor: string) => {
    const originalColor = findOriginalColor(darkenedColor);
    setOriginalLogoColor3(originalColor);
    onLogoColor3Change(darkenedColor); // Pass darkened color to model
  };

  // Handle colorway selection
  const handleColorwaySelect = (colorway: Colorway) => {
    onColorwayChange(colorway);
    
    // Update legacy props for backward compatibility
    onTopColorChange(colorway.upper.baseColor);
    onBottomColorChange(colorway.sole.baseColor);
    onLaceColorChange(colorway.laces.color);
    onUpperSplatterToggle(colorway.upper.hasSplatter);
    onSoleSplatterToggle(colorway.sole.hasSplatter);
    
    if (colorway.upper.splatterColor) {
      onUpperSplatterColorChange(colorway.upper.splatterColor);
    }
    if (colorway.sole.splatterColor) {
      onSoleSplatterColorChange(colorway.sole.splatterColor);
    }
    
    // Clear any existing textures when changing colorways
    onUpperTextureChange(null);
    onSoleTextureChange(null);
  };

  const handleCopyLogo = async () => {
    if (!logoUrl || isCopyingLogo) return;

    setIsCopyingLogo(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = logoUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      canvas.width = img.height;
      canvas.height = img.width;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.scale(-1, 1);
      
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const transformedDataUrl = canvas.toDataURL('image/png');
      onCircleLogoChange(transformedDataUrl);

    } catch (error) {
      console.error("Failed to transform and copy logo:", error);
      onCircleLogoChange(logoUrl); 
    } finally {
      setIsCopyingLogo(false);
    }
  };


  const activeTab = externalActiveTab || internalActiveTab;
  const handleTabChange = (tab: 'colorways' | 'logos') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  // Track height changes using ResizeObserver
  const customizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customizerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        onHeightChange(height);
      }
    });

    resizeObserver.observe(customizerRef.current);

    // Initial height measurement with a small delay to ensure DOM is ready
    setTimeout(() => {
      if (customizerRef.current) {
        const initialHeight = customizerRef.current.offsetHeight;
        onHeightChange(initialHeight);
      }
    }, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onHeightChange]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4">
      <div ref={customizerRef} className="space-y-3">
        {/* Main Control Card */}
         <div className={`backdrop-blur-sm max-w-6xl mx-auto rounded-[20px] transition-all duration-300 ${isDarkMode ? 'bg-black/5' : 'bg-white/5'} w-full md:w-4/5`}>
           {/* Header with Title, Selected Badge, and Tab Bar */}
           <div className="flex items-center justify-between p-4 pb-2">
             {/* Title */}
             <h3 className={`text-xl font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
               {activeTab === 'colorways' ? 'Choose Your Colorway' : 'Logo Customization'}
             </h3>
             
             {/* Selected Colorway Badge - Desktop Only */}
             {activeTab === 'colorways' && selectedColorwayId && (
               <div className="hidden md:flex justify-center">
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   transition={{ duration: 0.3 }}
                   className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                     isDarkMode 
                       ? 'bg-white/10 text-white/90 border border-white/20' 
                       : 'bg-slate-400/10 text-foreground border border-slate-400/20'
                   }`}
                 >
                   <div className="flex items-center gap-1.5">
                     {/* Mini color preview */}
                     <div className="flex gap-1">
                       <div
                         className="w-3 h-3 rounded-full border border-white/50"
                         style={{ backgroundColor: colorways.find(c => c.id === selectedColorwayId)?.upper.baseColor }}
                       />
                       <div
                         className="w-3 h-3 rounded-full border border-white/50"
                         style={{ backgroundColor: colorways.find(c => c.id === selectedColorwayId)?.sole.baseColor }}
                       />
                       <div
                         className="w-3 h-3 rounded-full border border-white/50"
                         style={{ backgroundColor: colorways.find(c => c.id === selectedColorwayId)?.laces.color }}
                       />
                     </div>
                     <span>
                       {colorways.find(c => c.id === selectedColorwayId)?.name}
                     </span>
                   </div>
                 </motion.div>
               </div>
             )}
             
             {/* Tab Bar */}
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ duration: 0.2 }}
               className={`relative inline-flex rounded-2xl p-1 transition-all duration-300 ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}
             >
               {/* Custom sliding background */}
               <motion.div
                 className={`absolute top-1 bottom-1 rounded-xl shadow-sm ${isDarkMode ? 'bg-white/20' : 'bg-white'}`}
                 animate={{
                   left: activeTab === 'colorways' ? '4px' : 'calc(50% + 2px)',
                 }}
                 transition={{
                   type: "spring",
                   stiffness: 400,
                   damping: 25
                 }}
                 style={{
                   width: 'calc(50% - 6px)',
                   height: 'calc(100% - 8px)',
                   top: '4px'
                 }}
               />
               
               {/* Custom tab buttons */}
               <button 
                 onClick={() => handleTabChange('colorways')} 
                 className={`relative uppercase font-blender font-bold px-6 py-2 text-xs rounded-xl transition-all duration-300 ${
                   activeTab === 'colorways' 
                     ? (isDarkMode ? 'text-white' : 'text-primary') 
                     : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')
                 }`}
               >
                 Colors
               </button>
               <button 
                 onClick={() => handleTabChange('logos')} 
                 className={`relative uppercase font-blender font-bold px-6 py-2 text-xs rounded-xl transition-all duration-300 ${
                   activeTab === 'logos' 
                     ? (isDarkMode ? 'text-white' : 'text-primary') 
                     : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')
                 }`}
               >
                 Logos
               </button>
             </motion.div>
           </div>

           {/* Tab Content Container with Fixed Height */}
           <div className="relative min-h-[120px]">
             {/* Colorways Tab Content */}
             <AnimatePresence mode="wait">
               {activeTab === 'colorways' && (
                 <motion.div
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                   transition={{ duration: 0.2, ease: "easeInOut" }}
                   className="absolute inset-0 p-4 pt-2"
                 >
                <div className="text-center mb-3">
                  {/* Mobile Selected Colorway Badge */}
                  {selectedColorwayId && (
                    <div className="flex md:hidden justify-center mb-2">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                          isDarkMode 
                            ? 'bg-white/10 text-white/90 border border-white/20' 
                            : 'bg-foreground/10 text-foreground border border-foreground/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {/* Mini color preview */}
                          <div className="flex gap-1">
                            <div
                              className="w-3 h-3 rounded-full border border-white/50"
                              style={{ backgroundColor: colorways.find(c => c.id === selectedColorwayId)?.upper.baseColor }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-white/50"
                              style={{ backgroundColor: colorways.find(c => c.id === selectedColorwayId)?.sole.baseColor }}
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-white/50"
                              style={{ backgroundColor: colorways.find(c => c.id === selectedColorwayId)?.laces.color }}
                            />
                          </div>
                          <span>
                            {colorways.find(c => c.id === selectedColorwayId)?.name}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Data Source Indicator */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {colorwaysLoading && (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
                    )}
                    <span className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`}>
                      {isUsingDynamicData ? `${colorways.length} Shopify Colorways` : `${colorways.length} Default Colorways`}
                    </span>
                  </div>
                  {isUsingDynamicData && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                      Live
                    </span>
                  )}
                </div>

                {/* Colorway Horizontal Scroll */}
                <div className="relative pt-0">
                  <div className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide bg-slate-500/10 rounded-xl">
                    {colorwaysLoading ? (
                      // Loading skeleton
                      Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className={`${idx === 0 ? "pl-2" : ""} flex-shrink-0`}>
                          <div className={`w-16 h-16 rounded-lg animate-pulse ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                        </div>
                      ))
                    ) : (
                      colorways.map((colorway, idx) => (
                        <div key={colorway.id} className={idx === 0 ? "pl-2" : ""}>
                          <ColorwaySwatch
                            colorway={colorway}
                            isSelected={selectedColorwayId === colorway.id}
                            onClick={() => handleColorwaySelect(colorway)}
                            isDarkMode={isDarkMode}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
                 </motion.div>
               )}
             </AnimatePresence>

             {/* Logos Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'logos' && (
              <motion.div
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   transition={{ duration: 0.2, ease: "easeInOut" }}
                   className="absolute inset-0 p-4 pt-2"
                 >

                {/* Logo Layout - 2 columns on mobile, 3 on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Side Logo Upload */}
                  <div className={`p-3 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-black/20 border-white/20' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="space-y-2">
                      <h4 className={`text-xs mb-3 font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                        Side Logo
                      </h4>
                      <LogoUploader
                        onLogoChange={onLogoChange}
                        currentLogo={logoUrl}
                      />
                    </div>
                  </div>

                  {/* Back Logo Upload */}
                  <div className={`p-3 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-black/20 border-white/20' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="space-y-2">
                      <h4 className={`text-xs mb-3  font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                        Back Logo
                      </h4>
                      <LogoUploader
                        onLogoChange={onCircleLogoChange}
                        currentLogo={circleLogoUrl}
                        showCopyButton={true}
                        onCopyClick={handleCopyLogo}
                        copyButtonDisabled={!logoUrl || logoUrl === circleLogoUrl}
                        rotate={true}
                        copyButtonTooltip="Copy from side logo"
                      />
                    </div>
                  </div>

                  {/* Logo Colors - All in one card on desktop */}
                  <div className={`p-3 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-black/20 border-white/20' : 'bg-gray-50 border-gray-200'} col-span-2 lg:col-span-1`}>
                    <div className="space-y-3">
                      <h4 className={`text-xs font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                        Logo Colors
                      </h4>
                      
                      {/* Desktop: All colors in one row */}
                      <div className="hidden lg:grid grid-cols-3 gap-2">
                        {/* Center */}
                        <ColorPickerPortal
                          currentColor={logoColor1}
                          onColorSelect={handleLogoColor1Change}
                          title="Select Center Color"
                          isDarkMode={isDarkMode}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full h-12 border rounded-lg transition-all duration-300 hover:scale-105 ${isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-gray-300 hover:border-gray-400'}`}
                            style={{ backgroundColor: originalLogoColor1 }}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: originalLogoColor1 }} />
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                Center
                              </span>
                            </div>
                          </Button>
                        </ColorPickerPortal>

                        {/* Inner */}
                        <ColorPickerPortal
                          currentColor={logoColor2}
                          onColorSelect={handleLogoColor2Change}
                          title="Select Inner Ring Color"
                          isDarkMode={isDarkMode}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full h-12 border rounded-lg transition-all duration-300 hover:scale-105 ${isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-gray-300 hover:border-gray-400'}`}
                            style={{ backgroundColor: originalLogoColor2 }}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: originalLogoColor2 }} />
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                Inner
                              </span>
                            </div>
                          </Button>
                        </ColorPickerPortal>

                        {/* Outer */}
                        <ColorPickerPortal
                          currentColor={logoColor3}
                          onColorSelect={handleLogoColor3Change}
                          title="Select Outer Ring Color"
                          isDarkMode={isDarkMode}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full h-12 border rounded-lg transition-all duration-300 hover:scale-105 ${isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-gray-300 hover:border-gray-400'}`}
                            style={{ backgroundColor: originalLogoColor3 }}
                          >
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: originalLogoColor3 }} />
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                Outer
                              </span>
                            </div>
                          </Button>
                        </ColorPickerPortal>
                      </div>

                      {/* Mobile: Stacked layout */}
                      <div className="lg:hidden space-y-2">
                        {/* Center */}
                        <ColorPickerPortal
                          currentColor={logoColor1}
                          onColorSelect={handleLogoColor1Change}
                          title="Select Center Color"
                          isDarkMode={isDarkMode}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full h-8 border rounded-lg transition-all duration-300 hover:scale-105 ${isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-gray-300 hover:border-gray-400'}`}
                            style={{ backgroundColor: originalLogoColor1 }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: originalLogoColor1 }} />
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                Center
                              </span>
                            </div>
                          </Button>
                        </ColorPickerPortal>

                        {/* Inner */}
                        <ColorPickerPortal
                          currentColor={logoColor2}
                          onColorSelect={handleLogoColor2Change}
                          title="Select Inner Ring Color"
                          isDarkMode={isDarkMode}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full h-8 border rounded-lg transition-all duration-300 hover:scale-105 ${isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-gray-300 hover:border-gray-400'}`}
                            style={{ backgroundColor: originalLogoColor2 }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: originalLogoColor2 }} />
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                Inner
                              </span>
                            </div>
                          </Button>
                        </ColorPickerPortal>

                        {/* Outer */}
                        <ColorPickerPortal
                          currentColor={logoColor3}
                          onColorSelect={handleLogoColor3Change}
                          title="Select Outer Ring Color"
                          isDarkMode={isDarkMode}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full h-8 border rounded-lg transition-all duration-300 hover:scale-105 ${isDarkMode ? 'border-white/30 hover:border-white/50' : 'border-gray-300 hover:border-gray-400'}`}
                            style={{ backgroundColor: originalLogoColor3 }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: originalLogoColor3 }} />
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                                Outer
                              </span>
                            </div>
                          </Button>
                        </ColorPickerPortal>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
                    </AnimatePresence>
                  </div>
        </div>
      </div>
    </div>
  );
};
