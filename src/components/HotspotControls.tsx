import React from 'react';
import { Eye, Layers, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotspotControlsProps {
  onHotspotSelect: (hotspot: string) => void;
  activeHotspot: string | null;
  disabled?: boolean;
}

const hotspots = [
  { id: 'upper', label: 'Upper', icon: Layers, description: 'Customize the shoe upper' },
  { id: 'sole', label: 'Sole', icon: Settings, description: 'Modify sole design' },
  { id: 'laces', label: 'Laces', icon: Eye, description: 'Change lace style' },
  { id: 'colors', label: 'Colors', icon: Palette, description: 'Adjust colorway' }
];

export const HotspotControls: React.FC<HotspotControlsProps> = ({
  onHotspotSelect,
  activeHotspot,
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-2">
      {hotspots.map((hotspot) => {
        const Icon = hotspot.icon;
        const isActive = activeHotspot === hotspot.id;
        
        return (
          <Button
            key={hotspot.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => onHotspotSelect(hotspot.id)}
            disabled={disabled}
            className={`
              flex items-center gap-2 transition-all duration-200
              ${isActive 
                ? 'bg-primary text-primary-foreground shadow-md' 
                : 'hover:bg-secondary hover:shadow-sm'
              }
            `}
            title={hotspot.description}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{hotspot.label}</span>
          </Button>
        );
      })}
    </div>
  );
};