import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Play, Pause, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ViewerControlsProps {
  autoRotate: boolean;
  onAutoRotateChange: (value: boolean) => void;
  zoom: number;
  onZoomChange: (value: number) => void;
  onReset: () => void;
  disabled?: boolean;
}

export const ViewerControls: React.FC<ViewerControlsProps> = ({
  autoRotate,
  onAutoRotateChange,
  zoom,
  onZoomChange,
  onReset,
  disabled = false
}) => {
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.2, 3);
    onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.2, 0.5);
    onZoomChange(newZoom);
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-control-bg/90 backdrop-blur-md rounded-lg border border-border shadow-control p-3">
      <div className="flex items-center gap-3">
        {/* Auto Rotate Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAutoRotateChange(!autoRotate)}
          disabled={disabled}
          className="text-foreground hover:bg-control-hover hover:text-primary transition-colors"
        >
          {autoRotate ? (
            <Pause className="h-4 w-4" />
          ) : (
            <RotateCw className="h-4 w-4" />
          )}
        </Button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={disabled || zoom <= 0.5}
            className="text-foreground hover:bg-control-hover hover:text-primary transition-colors"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <div className="w-20 px-2">
            <Slider
              value={[zoom]}
              onValueChange={(value) => onZoomChange(value[0])}
              min={0.5}
              max={3}
              step={0.1}
              disabled={disabled}
              className="w-full"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={disabled || zoom >= 3}
            className="text-foreground hover:bg-control-hover hover:text-primary transition-colors"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Reset Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={disabled}
          className="text-foreground hover:bg-control-hover hover:text-primary transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom Indicator */}
      <div className="text-center mt-2">
        <span className="text-xs text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
};