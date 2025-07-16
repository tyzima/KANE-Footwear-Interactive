import React, { useState } from 'react';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';

interface CompactColorPickerProps {
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

export const CompactColorPicker: React.FC<CompactColorPickerProps> = ({
  topColor,
  bottomColor,
  onTopColorChange,
  onBottomColorChange
}) => {
  const [activeSection, setActiveSection] = useState<'upper' | 'sole' | null>(null);

  const ColorSwatches = ({ selectedColor, onColorChange }: { selectedColor: string, onColorChange: (color: string) => void }) => (
    <div className="flex gap-1 mt-2">
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
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Upper</span>
          <div 
            className="w-8 h-8 rounded-full border-2 border-border cursor-pointer hover:border-primary/50 transition-colors"
            style={{ backgroundColor: topColor }}
            onClick={() => setActiveSection(activeSection === 'upper' ? null : 'upper')}
          />
        </div>
        
        <div className="text-muted-foreground">|</div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Sole</span>
          <div 
            className="w-8 h-8 rounded-full border-2 border-border cursor-pointer hover:border-primary/50 transition-colors"
            style={{ backgroundColor: bottomColor }}
            onClick={() => setActiveSection(activeSection === 'sole' ? null : 'sole')}
          />
        </div>
      </div>

      {activeSection === 'upper' && (
        <ColorSwatches selectedColor={topColor} onColorChange={onTopColorChange} />
      )}
      
      {activeSection === 'sole' && (
        <ColorSwatches selectedColor={bottomColor} onColorChange={onBottomColorChange} />
      )}
    </div>
  );
};