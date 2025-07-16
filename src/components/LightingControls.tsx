import React, { useState } from 'react';
import { Settings, Sun, Moon, Lightbulb, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';

export type LightingPreset = 'photorealistic';

interface LightingControlsProps {
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  shadowIntensity: number;
  onShadowIntensityChange: (intensity: number) => void;
}



export const LightingControls: React.FC<LightingControlsProps> = ({
  intensity,
  onIntensityChange,
  shadowIntensity,
  onShadowIntensityChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-20">
      {/* Toggle Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`transition-all duration-300 shadow-lg hover:shadow-xl mb-3 ${
          isOpen ? 'bg-primary text-primary-foreground' : 'bg-white/90 backdrop-blur-sm'
        }`}
      >
        <Camera className="w-4 h-4 mr-2" />
        Lighting
      </Button>

      {/* Lighting Controls Panel */}
      <div className={`transition-all duration-500 ease-out overflow-hidden ${
        isOpen 
          ? 'max-h-[300px] opacity-100 translate-y-0' 
          : 'max-h-0 opacity-0 -translate-y-4'
      }`}>
        <div className="w-80 bg-white/95 backdrop-blur-sm rounded-xl border border-border shadow-xl p-4 space-y-4">
          
          {/* Current Setup Display */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
            <Camera className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Photorealistic Studio</p>
              <p className="text-xs text-muted-foreground">Professional product photography lighting</p>
            </div>
          </div>

          {/* Intensity Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Light Intensity</label>
              <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                {intensity.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={(value) => onIntensityChange(value[0])}
              min={0.1}
              max={3.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Dim</span>
              <span>Bright</span>
            </div>
          </div>

          {/* Shadow Intensity Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Shadow Intensity</label>
              <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                {shadowIntensity.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[shadowIntensity]}
              onValueChange={(value) => onShadowIntensityChange(value[0])}
              min={0.0}
              max={1.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Soft</span>
              <span>Hard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};