import React from 'react';
import { ShoeViewer } from '@/components/ShoeViewer';
import { Sparkles, Users, Palette, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Main Viewer Section - Full Height */}
      <main className="h-screen relative">
        {/* Product Branding - Top Left */}
        <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
          <img 
            src="/Kane_Footer_Logo.avif" 
            alt="KANE Logo" 
            className="h-8 w-auto"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">KANE</h1>
              <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded-full">
                Revive Collection
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Custom Team Shoes
            </p>
          </div>
        </div>

        {/* Full Height 3D Viewer */}
        <div className="h-full relative">
          <ShoeViewer className="h-full" />
        </div>
      </main>
    </div>
  );
};

export default Index;
