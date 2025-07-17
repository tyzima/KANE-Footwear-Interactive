import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Droplets, ChevronDown, ChevronUp, School, Upload, Paintbrush, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { LogoUploader } from './LogoUploader';
import { SchoolSelector } from './SchoolSelector';

interface ColorCustomizerProps {
  topColor: string;
  bottomColor: string;
  onTopColorChange: (color: string) => void;
  onBottomColorChange: (color: string) => void;
  upperHasSplatter: boolean;
  soleHasSplatter: boolean;
  upperSplatterColor: string;
  soleSplatterColor: string;
  upperPaintDensity: number;
  solePaintDensity: number;
  onUpperSplatterToggle: (enabled: boolean) => void;
  onSoleSplatterToggle: (enabled: boolean) => void;
  onUpperSplatterColorChange: (color: string) => void;
  onSoleSplatterColorChange: (color: string) => void;
  onUpperPaintDensityChange: (density: number) => void;
  onSolePaintDensityChange: (density: number) => void;
  activeTab?: 'upper' | 'sole';
  onTabChange?: (tab: 'upper' | 'sole') => void;
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
  // Dark mode
  isDarkMode?: boolean;
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

const STEPS = [
  { id: 'colors', title: 'Choose Colors', icon: Paintbrush, description: 'Pick your base colors' },
  { id: 'effects', title: 'Add Effects', icon: Droplets, description: 'Paint splatter & textures' },
  { id: 'schools', title: 'School Spirit', icon: School, description: 'Apply school colors' },
  { id: 'logo', title: 'Add Logo', icon: Upload, description: 'Upload your logo' },
];

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  topColor,
  bottomColor,
  onTopColorChange,
  onBottomColorChange,
  upperHasSplatter,
  soleHasSplatter,
  upperSplatterColor,
  soleSplatterColor,
  upperPaintDensity,
  solePaintDensity,
  onUpperSplatterToggle,
  onSoleSplatterToggle,
  onUpperSplatterColorChange,
  onSoleSplatterColorChange,
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
  // Logo props with defaults
  logoUrl = null,
  onLogoChange = () => { },
  // Dark mode with default
  isDarkMode = false
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [internalActiveTab, setInternalActiveTab] = useState<'upper' | 'sole'>('upper');
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);

  const activeTab = externalActiveTab || internalActiveTab;
  const handleTabChange = (tab: 'upper' | 'sole') => {
    onTabChange ? onTabChange(tab) : setInternalActiveTab(tab);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const getCurrentColor = () => activeTab === 'upper' ? topColor : bottomColor;
  const getCurrentColorChanger = () => activeTab === 'upper' ? onTopColorChange : onBottomColorChange;
  const getCurrentSplatter = () => activeTab === 'upper' ? upperHasSplatter : soleHasSplatter;
  const getCurrentSplatterColor = () => activeTab === 'upper' ? upperSplatterColor : soleSplatterColor;
  const getCurrentSplatterToggle = () => activeTab === 'upper' ? onUpperSplatterToggle : onSoleSplatterToggle;
  const getCurrentSplatterColorChanger = () => activeTab === 'upper' ? onUpperSplatterColorChange : onSoleSplatterColorChange;
  const getCurrentPaintDensity = () => activeTab === 'upper' ? upperPaintDensity : solePaintDensity;
  const getCurrentPaintDensityChanger = () => activeTab === 'upper' ? onUpperPaintDensityChange : onSolePaintDensityChange;
  const getCurrentGradient = () => activeTab === 'upper' ? upperHasGradient : soleHasGradient;
  const getCurrentGradientToggle = () => activeTab === 'upper' ? onUpperGradientToggle : onSoleGradientToggle;
  const getCurrentGradientColor1 = () => activeTab === 'upper' ? upperGradientColor1 : soleGradientColor1;
  const getCurrentGradientColor2 = () => activeTab === 'upper' ? upperGradientColor2 : soleGradientColor2;
  const getCurrentGradientColor1Changer = () => activeTab === 'upper' ? onUpperGradientColor1Change : onSoleGradientColor1Change;
  const getCurrentGradientColor2Changer = () => activeTab === 'upper' ? onUpperGradientColor2Change : onSoleGradientColor2Change;

  const swapGradientColors = () => {
    const color1 = getCurrentGradientColor1();
    const color2 = getCurrentGradientColor2();
    getCurrentGradientColor1Changer()(color2);
    getCurrentGradientColor2Changer()(color1);
  };

  // Load school data
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const response = await fetch('/schools/filtered_schools_with_normalized_hex.json');
        const schoolData = await response.json();
        setSchools(schoolData);
      } catch (error) {
        console.error('Failed to load school data:', error);
      }
    };
    loadSchools();
  }, []);

  // Handle school selection and actions
  const handleSchoolSelect = (school: any) => {
    setSelectedSchool(school);
  };

  const handleApplySchoolColors = (school: any) => {
    if (school.Colors && school.Colors.length > 0) {
      // Apply first color to upper, second to sole (or first to both if only one color)
      const colors = school.Colors;
      onTopColorChange(colors[0].hex);
      onBottomColorChange(colors.length > 1 ? colors[1].hex : colors[0].hex);

      // Clear any existing textures when applying school colors
      onUpperTextureChange(null);
      onSoleTextureChange(null);
    }
  };

  const handleApplySchoolLogo = async (school: any) => {
    if (school.Logo) {
      console.log('Applying school logo:', school["School Name"], school.Logo);

      // Create a proxy function to handle CORS issues
      const loadImageWithProxy = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            // Set canvas size to maintain aspect ratio
            const size = 256;
            canvas.width = size;
            canvas.height = size;

            // Keep transparent background for die-cut effect
            ctx.clearRect(0, 0, size, size);

            // Calculate dimensions to maintain aspect ratio
            const aspectRatio = img.width / img.height;
            let drawWidth = size;
            let drawHeight = size;
            let offsetX = 0;
            let offsetY = 0;

            if (aspectRatio > 1) {
              drawHeight = size / aspectRatio;
              offsetY = (size - drawHeight) / 2;
            } else {
              drawWidth = size * aspectRatio;
              offsetX = (size - drawWidth) / 2;
            }

            // Draw the image centered
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          };

          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };

          // Try multiple approaches to load the image
          img.src = url;
        });
      };

      try {
        // First, try to load the image directly
        const dataUrl = await loadImageWithProxy(school.Logo);
        onLogoChange(dataUrl);
        console.log('School logo loaded and applied successfully');
      } catch (error) {
        console.log('Direct load failed, trying with CORS proxy...');

        try {
          // Try with a CORS proxy service
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(school.Logo)}`;
          const dataUrl = await loadImageWithProxy(proxyUrl);
          onLogoChange(dataUrl);
          console.log('School logo loaded via proxy and applied successfully');
        } catch (proxyError) {
          console.log('Proxy load failed, trying fetch approach...');

          try {
            // Try fetching as blob and creating object URL
            const response = await fetch(school.Logo, { mode: 'no-cors' });
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const dataUrl = await loadImageWithProxy(objectUrl);
            onLogoChange(dataUrl);
            URL.revokeObjectURL(objectUrl);
            console.log('School logo loaded via blob and applied successfully');
          } catch (blobError) {
            console.error('All loading methods failed, using original URL as fallback:', blobError);
            // Final fallback - just use the original URL
            onLogoChange(school.Logo);
          }
        }
      }
    }
  };

  const renderStepContent = () => {
    const currentStepData = STEPS[currentStep];

    switch (currentStepData.id) {
      case 'colors':
        return (
          <div className="space-y-4">
            <div className="text-center">
              
            </div>

          
          </div>
        );

      case 'effects':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className={`text-lg font-semibold mb-2 transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                Add Effects
              </h3>
              <p className={`text-sm transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                Make your shoe unique with paint splatter
              </p>
            </div>

            <div className={`p-4 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-black/20 border-white/20' : 'bg-secondary/20 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Droplets className={`w-5 h-5 transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`} />
                  <span className={`font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>Paint Splatter</span>
                </div>
                <Button
                  variant={getCurrentSplatter() ? "default" : "outline"}
                  size="sm"
                  onClick={() => getCurrentSplatterToggle()(!getCurrentSplatter())}
                  className={`transition-all duration-300 ${isDarkMode && !getCurrentSplatter()
                    ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white'
                    : ''
                    }`}
                >
                  {getCurrentSplatter() ? 'ON' : 'OFF'}
                </Button>
              </div>

              {getCurrentSplatter() && (
                <div className="space-y-4">
                  <div>
                    <p className={`text-sm mb-3 transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>Splatter Color:</p>
                    <div className="flex gap-2 flex-wrap">
                      {NATIONAL_PARK_COLORS.slice(0, 8).map(c => (
                        <Button
                          key={c.value}
                          variant="outline"
                          size="sm"
                          className={`w-10 h-10 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${getCurrentSplatterColor() === c.value ? 'border-primary ring-2 ring-primary/20' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                            }`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => getCurrentSplatterColorChanger()(c.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={`pt-3 border-t transition-all duration-300 ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>Intensity</span>
                      <span className={`text-sm font-mono px-2 py-1 rounded transition-all duration-300 ${isDarkMode ? 'bg-black/80 text-white/90' : 'bg-secondary text-foreground'}`}>
                        {getCurrentPaintDensity()}%
                      </span>
                    </div>
                    <Slider
                      value={[getCurrentPaintDensity()]}
                      onValueChange={v => getCurrentPaintDensityChanger()(v[0])}
                      min={100}
                      max={500}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'schools':
        return (
          <SchoolSelector
            schools={schools}
            selectedSchool={selectedSchool}
            onSchoolSelect={handleSchoolSelect}
            onApplyColors={handleApplySchoolColors}
            onApplyLogo={handleApplySchoolLogo}
            isDarkMode={isDarkMode}
          />
        );

      case 'logo':
        return (
          <div className="space-y-6">
            <div className="text-center">
           
            </div>

            <LogoUploader
              onLogoChange={onLogoChange}
              currentLogo={logoUrl}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4">
      <div className={`backdrop-blur-sm rounded-[20px] transition-all duration-300 ${isDarkMode ? 'bg-black/90 border border-white/20' : 'bg-white/95 border border-gray-200'}`}>

        {/* Main Control Bar */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-4">

            {/* Left: Title & Upper/Sole Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className={`text-lg font-bold transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                  Customize
                </h2>
              </div>

              <div className={`flex rounded-lg p-1 relative transition-all duration-300 ${isDarkMode ? 'bg-white/10' : 'bg-secondary/50'}`}>
                <div className={`absolute top-1 bottom-1 w-1/2 rounded-md shadow-sm transition-all duration-300 ease-out ${isDarkMode ? 'bg-white/20' : 'bg-white'} ${activeTab === 'upper' ? 'translate-x-0' : 'translate-x-full'}`} />
                <button onClick={() => handleTabChange('upper')} className={`relative z-10 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'upper' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Upper
                </button>
                <button onClick={() => handleTabChange('sole')} className={`relative z-10 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${activeTab === 'sole' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Sole
                </button>
              </div>
            </div>

            {/* Center: Color Palette */}
            <div className="flex-1 flex justify-center">
              {/* Desktop: Scrollable Color Palette with Arrows and Fade */}
              <div className="hidden md:flex items-center relative w-full max-w-md lg:max-w-lg xl:max-w-2xl 2xl:max-w-4xl">
                {/* Left Scroll Arrow */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex-shrink-0 h-8 w-8 p-0 rounded-full transition-all duration-300 z-20 ${isDarkMode
                    ? 'bg-black/80 hover:bg-black/90 text-white/80 hover:text-white border border-white/20'
                    : 'bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm'
                    }`}
                  onClick={() => {
                    const container = document.getElementById('color-palette-container');
                    if (container) {
                      container.scrollBy({ left: -200, behavior: 'smooth' });
                    }
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Color Palette Container with Fade Mask */}
                <div
                  className="relative flex-1 mx-2 overflow-hidden"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)'
                  }}
                >
                  {/* Scrollable Color Container */}
                  <div
                    id="color-palette-container"
                    className="flex items-center gap-2 overflow-x-auto py-2 px-4"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                  >
                    <style jsx>{`
                      #color-palette-container::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>
                    {NATIONAL_PARK_COLORS.map(c => (
                      <div key={c.value} className="relative group">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-10 h-10 p-0 border-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ${getCurrentColor() === c.value ? 'border-primary ring-2 ring-primary/20 scale-110' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                            }`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => getCurrentColorChanger()(c.value)}
                        />
                        {/* Custom Tooltip */}
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap ${isDarkMode ? 'bg-black/90 text-white border border-white/20' : 'bg-gray-900 text-white'
                          }`}>
                          {c.name}
                          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${isDarkMode ? 'border-t-black/90' : 'border-t-gray-900'
                            }`}></div>
                        </div>
                      </div>
                    ))}

                    {/* Custom Color Picker */}
                    <div className="relative group">
                      <input
                        type="color"
                        value={getCurrentColor()}
                        onChange={e => getCurrentColorChanger()(e.target.value)}
                        className={`
                          w-10 h-10 p-0 cursor-pointer border-2 border-white flex-shrink-0
                          rounded-full appearance-none overflow-hidden
                          [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                          [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-none
                          hover:scale-110 transition-all duration-300
                        `}
                      />
                      {/* Custom Color Tooltip */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap ${isDarkMode ? 'bg-black/90 text-white border border-white/20' : 'bg-gray-900 text-white'
                        }`}>
                        Custom Color
                        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${isDarkMode ? 'border-t-black/90' : 'border-t-gray-900'
                          }`}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Scroll Arrow */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-0 z-10 h-8 w-8 p-0 rounded-full transition-all duration-300 ${isDarkMode
                    ? 'bg-black/80 hover:bg-black/90 text-white/80 hover:text-white border border-white/20'
                    : 'bg-white/90 hover:bg-white text-gray-600 hover:text-gray-900 border border-gray-200 shadow-sm'
                    }`}
                  onClick={() => {
                    const container = document.getElementById('color-palette-container');
                    if (container) {
                      container.scrollBy({ left: 200, behavior: 'smooth' });
                    }
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Mobile: Grid Layout */}
              <div className="md:hidden w-full max-w-sm">
                <div className="grid grid-cols-8 gap-2">
                  {NATIONAL_PARK_COLORS.map(c => (
                    <div key={c.value} className="relative group">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-8 h-8 p-0 border-2 rounded-full transition-all duration-300 hover:scale-110 ${getCurrentColor() === c.value ? 'border-primary ring-2 ring-primary/20 scale-110' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                          }`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => getCurrentColorChanger()(c.value)}
                      />
                      {/* Custom Tooltip */}
                      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap ${isDarkMode ? 'bg-black/90 text-white border border-white/20' : 'bg-gray-900 text-white'
                        }`}>
                        {c.name}
                        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${isDarkMode ? 'border-t-black/90' : 'border-t-gray-900'
                          }`}></div>
                      </div>
                    </div>
                  ))}

                  {/* Custom Color Picker */}
                  <input
                    type="color"
                    value={getCurrentColor()}
                    onChange={e => getCurrentColorChanger()(e.target.value)}
                    title="Custom Color"
                    className={`
                      w-8 h-8 p-0 cursor-pointer border-2 border-white
                      rounded-full appearance-none overflow-hidden
                      [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                      [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-none
                      hover:scale-110 transition-all duration-300
                    `}
                  />
                </div>
              </div>
            </div>

            {/* Right: Effects & Actions */}
            <div className="flex items-center gap-3">

              {/* Paint Splatter Toggle */}
              <div className="flex items-center gap-2">
                <Droplets className={`w-4 h-4 transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`} />
                <Button
                  variant={getCurrentSplatter() ? "default" : "outline"}
                  size="sm"
                  onClick={() => getCurrentSplatterToggle()(!getCurrentSplatter())}
                  className={`h-8 px-3 transition-all duration-300 ${isDarkMode && !getCurrentSplatter()
                    ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white'
                    : ''
                    }`}
                >
                  {getCurrentSplatter() ? 'ON' : 'OFF'}
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(2)}
                  className={`h-8 px-3 flex items-center gap-1 transition-all duration-300 ${isDarkMode ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white' : ''
                    }`}
                >
                  <School className="w-4 h-4" />
                  <span className="hidden lg:inline">Schools</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(3)}
                  className={`h-8 px-3 flex items-center gap-1 transition-all duration-300 ${isDarkMode ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white' : ''
                    }`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden lg:inline">Logo</span>
                </Button>
              </div>

              {/* Expand/Collapse */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={`h-8 w-8 p-0 transition-all duration-300 ${isDarkMode
                  ? 'hover:bg-white/10 text-white/80 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                  }`}
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Splatter Controls - Inline when enabled */}
          {getCurrentSplatter() && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                    Splatter:
                  </span>
                  <div className="flex gap-1">
                    {NATIONAL_PARK_COLORS.slice(0, 6).map(c => (
                      <Button
                        key={c.value}
                        variant="outline"
                        size="sm"
                        className={`w-6 h-6 p-0 border rounded-full transition-all duration-300 hover:scale-110 ${getCurrentSplatterColor() === c.value ? 'border-primary ring-1 ring-primary/20' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                          }`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => getCurrentSplatterColorChanger()(c.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-muted-foreground'}`}>
                    Intensity:
                  </span>
                  <div className="w-24">
                    <Slider
                      value={[getCurrentPaintDensity()]}
                      onValueChange={v => getCurrentPaintDensityChanger()(v[0])}
                      min={100}
                      max={500}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  <span className={`text-sm font-mono px-2 py-1 rounded transition-all duration-300 ${isDarkMode ? 'bg-black/80 text-white/90' : 'bg-secondary text-foreground'}`}>
                    {getCurrentPaintDensity()}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expanded Content Area */}
        <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-64 opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-white/20">
            <div className="pt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};