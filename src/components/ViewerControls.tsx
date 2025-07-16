import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { HotspotControls } from './HotspotControls';
import { CompactColorPicker } from './ColorPicker';

interface ViewerControlsProps {
  autoRotate: boolean;
  onAutoRotateChange: (value: boolean) => void;
  zoom: number;
  onZoomChange: (value: number) => void;
  onReset: () => void;
  onHotspotSelect: (hotspot: string) => void;
  activeHotspot: string | null;
  disabled?: boolean;
  bottomColor: string;
  topColor: string;
  onBottomColorChange: (color: string) => void;
  onTopColorChange: (color: string) => void;
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
  bottomColor,
  topColor,
  onBottomColorChange,
  onTopColorChange
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
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-border shadow-elegant p-4 space-y-4">
      {/* Main Controls Row */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Section - Hotspot Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground hidden lg:inline">
            Customize:
          </span>
          <HotspotControls
            onHotspotSelect={onHotspotSelect}
            activeHotspot={activeHotspot}
            disabled={disabled}
          />
        </div>

        {/* Center Section - View Controls */}
        <div className="flex items-center gap-3 px-4 py-2 bg-secondary rounded-lg">
          {/* Auto Rotate */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAutoRotateChange(!autoRotate)}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title={autoRotate ? "Pause rotation" : "Start rotation"}
          >
            {autoRotate ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={disabled || zoom <= 0.3}
              className="h-8 w-8 p-0"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>

            <div className="w-20">
              <Slider
                value={[zoom]}
                onValueChange={(value) => onZoomChange(value[0])}
                min={0.3}
                max={2}
                step={0.05}
                disabled={disabled}
                className="w-full"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={disabled || zoom >= 2}
              className="h-8 w-8 p-0"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </div>

          {/* Reset */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Section - Brand */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-sm font-bold text-primary">KANE</span>
          <span className="text-xs text-muted-foreground">Revive Collection</span>
        </div>
      </div>

      {/* Color Customization Row */}
      <div className="pt-2 border-t border-border">
        <CompactColorPicker
          topColor={topColor}
          bottomColor={bottomColor}
          onTopColorChange={onTopColorChange}
          onBottomColorChange={onBottomColorChange}
        />
      </div>
    </div>
  );
};