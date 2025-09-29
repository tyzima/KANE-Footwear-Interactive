import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';

export type LightingPreset = 'photorealistic' | 'dark_optimized';

interface LightingControlsProps {
  intensity?: number; // Made optional for internal defaults
  onIntensityChange: (intensity: number) => void;
  shadowIntensity?: number; // Optional
  onShadowIntensityChange: (intensity: number) => void;
  isDarkMode?: boolean;
  onPresetChange?: (preset: LightingPreset) => void;
}

export const LightingControls: React.FC<LightingControlsProps> = ({
  intensity: propIntensity,
  onIntensityChange,
  shadowIntensity: propShadowIntensity,
  onShadowIntensityChange,
  isDarkMode = false,
  onPresetChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<LightingPreset>(isDarkMode ? 'dark_optimized' : 'photorealistic');
  // Internal state with mode-aware defaults
  const [localIntensity, setLocalIntensity] = useState(isDarkMode ? 2.0 : 1.8);
  const [localShadowIntensity, setLocalShadowIntensity] = useState(0.2);

  // Auto-switch preset when dark mode changes
  useEffect(() => {
    setPreset(isDarkMode ? 'dark_optimized' : 'photorealistic');
  }, [isDarkMode]);

  // Sync props to local state if provided, and adjust for preset/mode
  useEffect(() => {
    const defaultIntensity = isDarkMode ? 2.0 : 1.8;
    const defaultShadow = 0.2;
    setLocalIntensity(propIntensity ?? defaultIntensity);
    setLocalShadowIntensity(propShadowIntensity ?? defaultShadow);
  }, [propIntensity, propShadowIntensity, isDarkMode]);

  // When preset changes, apply values and notify parent
  useEffect(() => {
    if (preset === 'dark_optimized') {
      setLocalIntensity(2.2); // Brighter for black BG
      setLocalShadowIntensity(0.3); // Softer shadows
    } else {
      setLocalIntensity(1.8);
      setLocalShadowIntensity(0.2);
    }
    
    // Notify parent of preset change
    onPresetChange?.(preset);
  }, [preset, onPresetChange]);

  // Sync local to parent on change
  const handleIntensityChange = (value: number) => {
    setLocalIntensity(value);
    onIntensityChange(value);
  };

  const handleShadowIntensityChange = (value: number) => {
    setLocalShadowIntensity(value);
    onShadowIntensityChange(value);
  };

  return (
    <div className="absolute bottom-4 left-4 z-20">
      {/* Toggle Button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`transition-all duration-300 shadow-lg hover:shadow-xl mb-3 ${isOpen ? 'bg-primary text-primary-foreground' : (isDarkMode ? 'bg-black/40 backdrop-blur-sm border border-white/20' : 'bg-white/90 backdrop-blur-sm')
          }`}
      >
        <Camera className="w-4 h-4 mr-2" />
        Lighting
      </Button>

      {/* Lighting Controls Panel */}
      <div className={`transition-all duration-500 ease-out overflow-hidden ${isOpen
        ? 'max-h-[350px] opacity-100 translate-y-0' // Increased height for new select
        : 'max-h-0 opacity-0 -translate-y-4'
        }`}>
        <div className={`w-80 backdrop-blur-sm rounded-xl shadow-xl p-4 space-y-4 transition-all duration-300 ${isDarkMode ? 'bg-black/40 border border-white/20' : 'bg-white/95 border border-border'}`}>

          {/* Preset Selector */}
          <div className="space-y-2">
            <label className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>Lighting Preset</label>
            <Select value={preset} onValueChange={(value) => setPreset(value as LightingPreset)}>
              <SelectTrigger className={isDarkMode ? 'bg-black/80 border-white/20' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photorealistic">Photorealistic Studio</SelectItem>
                <SelectItem value="dark_optimized">Dark Optimized (for black BG)</SelectItem>
              </SelectContent>
            </Select>
            <p className={`text-xs transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
              {preset === 'dark_optimized' ? 'Brighter setup for dark backgrounds' : 'Professional product photography lighting'}
            </p>
          </div>

          {/* Intensity Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>Light Intensity</label>
              <span className={`text-xs font-mono px-2 py-1 rounded transition-all duration-300 ${isDarkMode ? 'bg-black/80 text-white/90' : 'bg-secondary text-foreground'}`}>
                {localIntensity.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[localIntensity]}
              onValueChange={(value) => handleIntensityChange(value[0])}
              min={0.1}
              max={3.0}
              step={0.1}
              className="w-full"
            />
            <div className={`flex justify-between text-xs transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
              <span>Dim</span>
              <span>Bright</span>
            </div>
          </div>

          {/* Shadow Intensity Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>Shadow Intensity</label>
              <span className={`text-xs font-mono px-2 py-1 rounded transition-all duration-300 ${isDarkMode ? 'bg-black/80 text-white/90' : 'bg-secondary text-foreground'}`}>
                {localShadowIntensity.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[localShadowIntensity]}
              onValueChange={(value) => handleShadowIntensityChange(value[0])}
              min={0.0}
              max={1.0}
              step={0.1}
              className="w-full"
            />
            <div className={`flex justify-between text-xs transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
              <span>Soft</span>
              <span>Hard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};