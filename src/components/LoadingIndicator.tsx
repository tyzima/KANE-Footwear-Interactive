import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-viewer-bg/80 backdrop-blur-sm z-10">
      <div className="text-center">
        {/* Main Loading Animation */}
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-loading-primary/20 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-loading-primary rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-loading-secondary rounded-full animate-spin animate-pulse"></div>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground animate-pulse">
            Loading 3D Model
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Preparing your interactive shoe viewer...
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-loading-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-loading-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-loading-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-3 bg-card/50 rounded-lg border border-border/30 max-w-sm">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> Use mouse/touch to rotate, scroll to zoom, and click on different parts of the shoe for interaction.
          </p>
        </div>
      </div>
    </div>
  );
};