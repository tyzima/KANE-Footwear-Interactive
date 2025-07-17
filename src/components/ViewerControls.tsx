import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause, RotateCw, Sun, Moon } from 'lucide-react';
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
  isDarkBackground?: boolean;
  onBackgroundToggle?: (isDark: boolean) => void;
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
  isDarkBackground = false,
  onBackgroundToggle
}) => {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.1, 2);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.1, 0.3);
    onZoomChange(newZoom);
  };

  return (
    <div className={`backdrop-blur-sm rounded-[20px] shadow-elegant p-4 space-y-3 transition-all duration-300 w-20 ${isDarkBackground ? 'bg-black/95 border border-white/20' : 'bg-white/95 border border-border'}`}>
      {/* Hotspot Controls */}
      <div className="flex flex-col items-center gap-2">
        <span className={`text-xs font-medium text-center transition-all duration-300 ${isDarkBackground ? 'text-white/60' : 'text-muted-foreground'}`}>
          View
        </span>
        <HotspotControls
          onHotspotSelect={onHotspotSelect}
          activeHotspot={activeHotspot}
          disabled={disabled}
          onCameraMove={onCameraMove}
          isDarkMode={isDarkBackground}
        />
      </div>

      {/* Divider */}
      <div className={`h-px w-full transition-all duration-300 ${isDarkBackground ? 'bg-white/20' : 'bg-border'}`} />

      {/* View Controls - Vertical Layout */}
      <div className="flex flex-col items-center gap-2">
        {/* Auto Rotate */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAutoRotateChange(!autoRotate)}
          disabled={disabled}
          className={`h-8 w-full p-0 transition-all duration-300 ${isDarkBackground
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
          className={`h-8 w-full p-0 transition-all duration-300 ${isDarkBackground
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
          className={`h-8 w-full p-0 transition-all duration-300 ${isDarkBackground
            ? 'hover:bg-white/10 text-white/80 hover:text-white disabled:text-white/30'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:text-gray-300'
            }`}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>

        {/* Zoom Percentage */}
        <div className={`text-xs text-center py-1 transition-all duration-300 ${isDarkBackground ? 'text-white/60' : 'text-muted-foreground'}`}>
          {Math.round(zoom * 100)}%
        </div>

        {/* Background Toggle */}
        {onBackgroundToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBackgroundToggle(!isDarkBackground)}
            disabled={disabled}
            className={`h-8 w-full p-0 transition-all duration-300 ${isDarkBackground
              ? 'hover:bg-white/10 text-white/80 hover:text-white'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            title={isDarkBackground ? "Switch to light background" : "Switch to dark background"}
          >
            {isDarkBackground ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled}
          className={`h-8 w-full p-0 transition-all duration-300 ${isDarkBackground
            ? 'hover:bg-white/10 text-white/80 hover:text-white disabled:text-white/30'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 disabled:text-gray-300'
            }`}
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

