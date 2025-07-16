import React, { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

interface ColorCustomizerProps {
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

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  topColor,
  bottomColor,
  onTopColorChange,
  onBottomColorChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<'upper' | 'sole' | null>(null);

  const ColorSection = ({ 
    title, 
    color, 
    onColorChange, 
    isActive 
  }: { 
    title: string;
    color: string;
    onColorChange: (color: string) => void;
    isActive: boolean;
  }) => (
    <div className={`transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-102'}`}>
      <div 
        className={`p-4 rounded-lg cursor-pointer transition-all duration-300 ${
          isActive 
            ? 'bg-primary/10 border-2 border-primary shadow-lg' 
            : 'bg-white/80 border border-border hover:border-primary/50 hover:shadow-md'
        }`}
        onClick={() => setActiveSection(isActive ? null : (title.toLowerCase() as 'upper' | 'sole'))}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold text-lg ${isActive ? 'text-primary' : 'text-foreground'}`}>
            {title}
          </h3>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-300 ${
              isActive ? 'rotate-180 text-primary' : 'text-muted-foreground'
            }`}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full border-3 border-white shadow-lg"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-muted-foreground">
            {NATIONAL_PARK_COLORS.find(c => c.value === color)?.name || 'Custom'}
          </span>
        </div>
        
        {isActive && (
          <div className="mt-4 grid grid-cols-6 gap-2 animate-fade-in">
            {NATIONAL_PARK_COLORS.map((colorOption) => (
              <Button
                key={colorOption.value}
                variant="outline"
                size="sm"
                className={`w-8 h-8 p-0 border-2 rounded-full transition-all hover:scale-110 ${
                  color === colorOption.value 
                    ? 'border-primary ring-2 ring-primary/20 scale-110' 
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: colorOption.value }}
                onClick={(e) => {
                  e.stopPropagation();
                  onColorChange(colorOption.value);
                }}
                title={colorOption.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="absolute top-4 right-4 z-20">
      <div className={`transition-all duration-500 ease-out ${
        isExpanded ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-95'
      }`}>
        {/* Toggle Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`mb-3 transition-all duration-300 shadow-lg hover:shadow-xl ${
            isExpanded ? 'bg-primary text-primary-foreground' : 'bg-white/90 backdrop-blur-sm'
          }`}
        >
          <Palette className="w-4 h-4 mr-2" />
          Customize Colors
          <ChevronDown 
            className={`w-4 h-4 ml-2 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </Button>

        {/* Color Customizer Panel */}
        <div className={`transition-all duration-500 ease-out overflow-hidden ${
          isExpanded 
            ? 'max-h-[500px] opacity-100 translate-y-0' 
            : 'max-h-0 opacity-0 -translate-y-4'
        }`}>
          <div className="w-64 space-y-3 bg-white/95 backdrop-blur-sm rounded-xl border border-border shadow-xl p-4">
            <ColorSection
              title="Upper"
              color={topColor}
              onColorChange={onTopColorChange}
              isActive={activeSection === 'upper'}
            />
            
            <ColorSection
              title="Sole"
              color={bottomColor}
              onColorChange={onBottomColorChange}
              isActive={activeSection === 'sole'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};