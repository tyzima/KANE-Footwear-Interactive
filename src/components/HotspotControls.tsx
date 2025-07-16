import React, { useState } from 'react';
import { Eye, Layers, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotspotControlsProps {
  onHotspotSelect: (hotspot: string) => void;
  activeHotspot: string | null;
  disabled?: boolean;
}


const hotspots = [
  { id: 'laces', label: 'Laces', description: 'Change lace style' },
];

export const HotspotControls: React.FC<HotspotControlsProps> = ({
  onHotspotSelect,
  activeHotspot,
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-4">
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
    </div>
  );
};