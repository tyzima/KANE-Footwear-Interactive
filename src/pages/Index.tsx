import React, { useState, useRef } from 'react';
import { ShoeViewer } from '@/components/ShoeViewer';
import { ShareButton } from '@/components/ShareButton';
import { BuyButton } from '@/components/BuyButton';

const Index = () => {
  const [isDarkBackground, setIsDarkBackground] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorConfiguration, setColorConfiguration] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Main Viewer Section - Full Height */}
      <main className="h-screen relative">
        {/* Product Branding - Top Left */}
        <div className="absolute top-10 left-10 z-30 flex items-center gap-4">
          <img
            src="/mainkanelogo.png"
            alt="KANE Logo"
            className={`h-8 w-auto transition-all duration-300 ${isDarkBackground ? 'invert' : ''}`}
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl font-bold transition-colors duration-300 ${isDarkBackground ? 'text-white' : 'text-foreground'}`}></h1>
              <span className={`px-2 py-1 ml-2 text-xs font-medium rounded-full transition-colors duration-300 ${isDarkBackground
                ? 'bg-white/20 text-white/90'
                : 'bg-accent/20 text-accent'
                }`}>
                TEAM Revive
              </span>
            </div>
          </div>
        </div>

        {/* Buy and Share Buttons - Top Right */}
        <div className="absolute top-8 right-8 z-30 flex flex-col gap-3">
          <BuyButton
            canvasRef={canvasRef}
            isDarkMode={isDarkBackground}
            getColorConfiguration={() => colorConfiguration}
          />
          <ShareButton
            canvasRef={canvasRef}
            isDarkMode={isDarkBackground}
          />
        </div>

        {/* Full Height 3D Viewer */}
        <div className="h-full relative">
          <ShoeViewer
            className="h-full"
            isDarkBackground={isDarkBackground}
            onDarkBackgroundChange={setIsDarkBackground}
            canvasRef={canvasRef}
            onColorConfigurationChange={setColorConfiguration}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;


