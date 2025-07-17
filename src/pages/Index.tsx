import React, { useState, useRef } from 'react';
import { ShoeViewer } from '@/components/ShoeViewer';
import { ShareButton } from '@/components/ShareButton';

const Index = () => {
  const [isDarkBackground, setIsDarkBackground] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Main Viewer Section - Full Height */}
      <main className="h-screen relative">
        {/* Product Branding - Top Left */}
        <div className="absolute top-10 left-10 z-30 flex items-center gap-4">
          <img
            src="/mainkanelogo.png"
            alt="KANE Logo"
            className={`h-10 w-auto transition-all duration-300 ${isDarkBackground ? 'invert' : ''}`}
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

        {/* Share Button - Top Right */}
        <div className="absolute top-8 right-8 z-30">
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
          />
        </div>
      </main>
    </div>
  );
};

export default Index;


