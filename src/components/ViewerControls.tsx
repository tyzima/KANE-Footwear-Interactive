import React, { useState, useEffect } from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause, RotateCw, Sun, Moon, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { HotspotControls } from './HotspotControls';

interface ViewerControlsProps {
  autoRotate: boolean;
  onAutoRotateChange: (value: boolean) => void;
  zoom: number;
  onZoomChange: (value: number) => void;
  onReset: () => void;
  onHotspotSelect: (hotspot: string) => void;
  activeHotspot: string | null;
  disabled?: boolean;
  onCameraMove?: (position: [number, number, number], target: [number, number, number], zoom?: number) => void;
  backgroundType?: 'light' | 'dark';
  onBackgroundToggle?: (type: 'light' | 'dark') => void;
}

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  autoRotate,
  onAutoRotateChange,
  zoom,
  onZoomChange,
  onReset,
  onHotspotSelect,
  activeHotspot,
  disabled = false,
  onCameraMove,
  backgroundType = 'light',
  onBackgroundToggle
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 2);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, 0.3);
    onZoomChange(newZoom);
  };

  // Helper to determine if current background should use dark mode styling
  const isDarkMode = backgroundType === 'dark';

  // Function to cycle through background types
  const handleBackgroundToggle = () => {
    if (!onBackgroundToggle) return;
    
    const nextType = backgroundType === 'light' ? 'dark' : 'light';
    onBackgroundToggle(nextType);
  };

  // Get appropriate icon and title for current background
  const getBackgroundIcon = () => {
    switch (backgroundType) {
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'light':
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getBackgroundTitle = () => {
    switch (backgroundType) {
      case 'light':
        return "Switch to dark background";
      case 'dark':
        return "Switch to light background";
      default:
        return "Switch background";
    }
  };

  return (
    <>
      {isMobile && !isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={`fixed top-32 w-9 h-9 md:w-auto border border-white/20 right-8 rounded-full shadow-elegant backdrop-blur-sm p-3 transition-all duration-300 ease-in-out ${isDarkMode ? 'bg-black/40 text-white/80 hover:bg-black/50 hover:text-white' : 'bg-white/5 text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          title="Open controls"
          disabled={disabled}
        >
          <Camera className="h-5 w-5" />
        </Button>
      )}
      <div 
        className={`backdrop-blur-sm rounded-[20px] shadow-elegant p-4 pt-2 space-y-3 transition-all duration-300 ease-in-out w-20 
          ${isDarkMode ? 'bg-black/40  ' : 'bg-white/5 '} 
          ${isMobile ? 'fixed top-1/2 right-4 -translate-y-1/2 z-50' : ''} 
          ${isMobile ? (isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none') : ''}`}
      >
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className={`absolute top-[-10px]  border-2 border-white/20 right-[-10px] h-6 w-6 rounded-full p-0 transition-all duration-300 ${isDarkMode ? 'bg-black/40 text-white/60 hover:bg-black/50 hover:text-white' : 'bg-white/95 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            title="Close controls"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Hotspot Controls */}
        <div className="flex flex-col items-center gap-2">
        
          <HotspotControls
            onHotspotSelect={onHotspotSelect}
            activeHotspot={activeHotspot}
            disabled={disabled}
            onCameraMove={onCameraMove}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Divider */}
        <div className={`h-px w-full transition-all duration-300 ${isDarkMode ? 'bg-white/20' : 'bg-border'}`} />

        {/* View Controls - Vertical Layout */}
        <div className="flex flex-col items-center gap-2">
          {/* Auto Rotate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAutoRotateChange(!autoRotate)}
            disabled={disabled}
            className={`h-8 w-full p-0 transition-all duration-300 ${isDarkMode
              ? 'hover:bg-white/10 text-white/80 hover:text-white'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            title={autoRotate ? "Pause rotation" : "Start rotation"}
          >
            {autoRotate ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Zoom Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={disabled || zoom <= 0.3}
            className={`h-8 w-full p-0 transition-all duration-300 ${isDarkMode
              ? 'hover:bg-white/10 text-white/80 hover:text-white disabled:text-white/30'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:text-gray-300'
              }`}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          {/* Zoom In */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={disabled || zoom >= 2}
            className={`h-8 w-full p-0 transition-all duration-300 ${isDarkMode
              ? 'hover:bg-white/10 text-white/80 hover:text-white disabled:text-white/30'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:text-gray-300'
              }`}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Zoom Percentage */}
          <div className={`text-xs text-center py-1 transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
            {Math.round(zoom * 100)}%
          </div>

          {/* Background Toggle */}
          {onBackgroundToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackgroundToggle}
              disabled={disabled}
              className={`h-8 w-full p-0 transition-all duration-300 ${isDarkMode
                ? 'hover:bg-white/10 text-white/80 hover:text-white'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              title={getBackgroundTitle()}
            >
              {getBackgroundIcon()}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};