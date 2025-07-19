import React, { useState, useRef } from 'react';
import { ShoeViewer } from '@/components/ShoeViewer';
import { ShareButton } from '@/components/ShareButton';
import { BuyButton } from '@/components/BuyButton';

const Index = () => {
  const [backgroundType, setBackgroundType] = useState<'light' | 'dark' | 'turf'>('light');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorConfiguration, setColorConfiguration] = useState<any>(null);
  
  // Helper to determine if current background should use dark mode styling
  const isDarkMode = backgroundType === 'dark' || backgroundType === 'turf';

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Main Viewer Section - Full Height */}
      <main className="h-screen relative">
        {/* Product Branding - Top Left */}
        <div className="absolute top-10 ml-10 md:ml-20 z-30 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
  <img
    src="/mainkanelogo.png"
    alt="KANE Logo"
    className={`h-6 md:h-8 w-auto transition-all duration-300 ${isDarkMode ? 'invert' : ''}`}
  />
  <div>
    <div className="flex items-center gap-3 sm:gap-3">
      <h1 className={`text-2xl font-bold transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-foreground'}`}></h1>
      <span className={`px-2 py-[2px] md:py-1 mt-1 md:mt-0 ml-7 sm:ml-0 tracking-wider text-[10px] sm:text-xs font-medium rounded-full transition-colors duration-300 ${isDarkMode
        ? 'bg-transparent border border-white/20 text-white/90'
        : 'bg-accent/20 text-accent'
        }`}>
        CUSTOM
      </span>
    </div>
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
          />
        </div>
      </main>
    </div>
  );
};

export default Index;


