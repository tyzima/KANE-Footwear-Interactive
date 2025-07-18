import React from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Hotspot {
  id: string;
  label: string;
  description: string;
  position?: [number, number, number];
  target?: [number, number, number];
  zoom?: number;
}

interface HotspotControlsProps {
  onHotspotSelect: (hotspot: string) => void;
  activeHotspot: string | null;
  disabled?: boolean;
  customHotspots?: Hotspot[];
  onCameraMove?: (position: [number, number, number], target: [number, number, number], zoom?: number) => void;
  isDarkMode?: boolean;
}

// Predefined hotspots for common shoe viewing angles
const defaultHotspots: Hotspot[] = [
  {
    id: 'side',
    label: 'Side',
    description: 'View shoe from the side',
    position: [-3.195, 0.46, -0.145],
    target: [0, 0, 0],
    zoom: 1
  },
  {
    id: 'top',
    label: 'Top',
    description: 'View shoe from above',
    position: [0.028, 2.798, 1.615],
    target: [0, 0, 0],
    zoom: 1
  },
  {
    id: 'quarter',
    label: 'Quarter',
    description: 'Three-quarter view of the shoe',
    position: [2.451, 1.663, 1.291],
    target: [0, 0, 0],
    zoom: 1
  },
  {
    id: 'back',
    label: 'Back',
    description: 'View shoe from behind',
    position: [0.025, 0.46, -3.198],
    target: [0, 0, 0],
    zoom: 1
  },
];

// Helper function to get the appropriate SVG icon for each hotspot
const getHotspotIcon = (hotspotId: string) => {
  const iconMap: Record<string, string> = {
    side: '/sideicon.svg',
    top: '/topicon.svg',
    quarter: '/quartericon.svg',
    back: '/backicon.svg'
  };
  return iconMap[hotspotId];
};

export const HotspotControls: React.FC<HotspotControlsProps> = ({
  onHotspotSelect,
  activeHotspot,
  disabled = false,
  customHotspots = [],
  onCameraMove,
  isDarkMode = false
}) => {
  // Combine default hotspots with custom ones
  const allHotspots = [...defaultHotspots, ...customHotspots];

  const handleHotspotClick = (hotspot: Hotspot) => {
    onHotspotSelect(hotspot.id);

    // If camera movement is supported and hotspot has position data, move camera
    if (onCameraMove && hotspot.position && hotspot.target) {
      onCameraMove(hotspot.position, hotspot.target, hotspot.zoom);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Hotspot Controls */}
      {allHotspots.map((hotspot) => {
        const isActive = activeHotspot === hotspot.id;
        const isCustom = !defaultHotspots.find(h => h.id === hotspot.id);
        const iconSrc = getHotspotIcon(hotspot.id);

        return (
          <Button
            key={hotspot.id}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handleHotspotClick(hotspot)}
            disabled={disabled}
            className={`
              w-16 h-16 p-1 aspect-square
              transition-all duration-300
              ${isActive
                ? 'bg-white text-primary-foreground shadow-md'
                : isDarkMode
                  ? 'border-white/30 bg-transparent text-white/80 hover:bg-white/90 hover:text-white hover:shadow-sm'
                  : 'border-border text-gray-600 hover:bg-secondary hover:shadow-sm'
              }
              ${isCustom ? 'border-dashed' : ''}
              ${disabled && isDarkMode ? 'disabled:text-white/30 disabled:border-white/10' : ''}
            `}
            title={hotspot.description}
          >
            {iconSrc ? (
              <img
                src={iconSrc}
                alt={hotspot.label}
                className="w-full h-full object-contain"
                style={{ filter: 'none' }}
              />
            ) : (
              <>
                {isCustom && <MapPin className="h-6 w-6" />}
                {!isCustom && <span className="text-sm">{hotspot.label}</span>}
              </>
            )}
          </Button>
        );
      })}
    </div>
  );
};



