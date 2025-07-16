import React, { useState } from 'react';
import { Eye, Layers, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotspotControlsProps {
  onHotspotSelect: (hotspot: string) => void;
  activeHotspot: string | null;
  disabled?: boolean;
  topColor: string;
  bottomColor: string;
  onTopColorChange: (color: string) => void;
  onBottomColorChange: (color: string) => void;
}

// National Park inspired color palette
const NATIONAL_PARK_COLORS = [
  { name: 'Forest Green', value: '#2d5016' },
  { name: 'Redwood', value: '#8b4513' },
  { name: 'Canyon Orange', value: '#d2691e' },
  { name: 'Desert Sand', value: '#c19a6b' },
  { name: 'Stone Gray', value: '#708090' },
  { name: 'Sky Blue', value: '#4682b4' },
  { name: 'Sunset Purple', value: '#8b5a80' },
  { name: 'Pine Dark', value: '#1e3d2f' },
  { name: 'Earth Brown', value: '#8b4513' },
  { name: 'Glacier White', value: '#f8f8ff' },
  { name: 'Mountain Peak', value: '#4a4a4a' },
  { name: 'Meadow Green', value: '#7cba00' },
];

const hotspots = [
  { id: 'laces', label: 'Laces', description: 'Change lace style' },
];

export const HotspotControls: React.FC<HotspotControlsProps> = ({
  onHotspotSelect,
  activeHotspot,
  disabled = false,
  topColor,
  bottomColor,
  onTopColorChange,
  onBottomColorChange
}) => {
  const [activeColorSection, setActiveColorSection] = useState<'upper' | 'sole' | null>(null);

  const ColorSwatches = ({ selectedColor, onColorChange }: { selectedColor: string, onColorChange: (color: string) => void }) => (
    <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white/95 backdrop-blur-sm border border-border rounded-lg shadow-lg z-50">
      <div className="flex gap-1 flex-wrap">
        {NATIONAL_PARK_COLORS.map((color) => (
          <Button
            key={color.value}
            variant="outline"
            size="sm"
            className={`w-6 h-6 p-0 border rounded-full transition-all ${
              selectedColor === color.value 
                ? 'border-primary ring-2 ring-primary/20' 
                : 'border-border hover:border-primary/50'
            }`}
            style={{ backgroundColor: color.value }}
            onClick={() => onColorChange(color.value)}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-4 relative">
      {/* Hotspot Controls - simplified */}
      {hotspots.map((hotspot) => {
        const isActive = activeHotspot === hotspot.id;
        
        return (
          <Button
            key={hotspot.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onHotspotSelect(hotspot.id)}
            disabled={disabled}
            className={`
              transition-all duration-200
              ${isActive 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'hover:bg-secondary hover:shadow-sm'
              }
            `}
            title={hotspot.description}
          >
            {hotspot.label}
          </Button>
        );
      })}
      
      {/* Color Selection */}
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">|</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Upper</span>
          <div 
            className="w-6 h-6 rounded-full border-2 border-border cursor-pointer hover:border-primary/50 transition-colors"
            style={{ backgroundColor: topColor }}
            onClick={() => setActiveColorSection(activeColorSection === 'upper' ? null : 'upper')}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Sole</span>
          <div 
            className="w-6 h-6 rounded-full border-2 border-border cursor-pointer hover:border-primary/50 transition-colors"
            style={{ backgroundColor: bottomColor }}
            onClick={() => setActiveColorSection(activeColorSection === 'sole' ? null : 'sole')}
          />
        </div>
      </div>

      {/* Color Swatches Dropdown */}
      {activeColorSection === 'upper' && (
        <ColorSwatches selectedColor={topColor} onColorChange={onTopColorChange} />
      )}
      
      {activeColorSection === 'sole' && (
        <ColorSwatches selectedColor={bottomColor} onColorChange={onBottomColorChange} />
      )}
    </div>
  );
};