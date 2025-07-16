import React, { useState } from 'react';
import { Palette, Droplets, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

interface ColorCustomizerProps {
  topColor: string;
  bottomColor: string;
  onTopColorChange: (color: string) => void;
  onBottomColorChange: (color: string) => void;
  upperHasSplatter: boolean;
  soleHasSplatter: boolean;
  upperSplatterColor: string;
  soleSplatterColor: string;
  upperPaintDensity: number;
  solePaintDensity: number;
  onUpperSplatterToggle: (enabled: boolean) => void;
  onSoleSplatterToggle: (enabled: boolean) => void;
  onUpperSplatterColorChange: (color: string) => void;
  onSoleSplatterColorChange: (color: string) => void;
  onUpperPaintDensityChange: (density: number) => void;
  onSolePaintDensityChange: (density: number) => void;
  activeTab?: 'upper' | 'sole';
  onTabChange?: (tab: 'upper' | 'sole') => void;
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
  onBottomColorChange,
  upperHasSplatter,
  soleHasSplatter,
  upperSplatterColor,
  soleSplatterColor,
  upperPaintDensity,
  solePaintDensity,
  onUpperSplatterToggle,
  onSoleSplatterToggle,
  onUpperSplatterColorChange,
  onSoleSplatterColorChange,
  onUpperPaintDensityChange,
  onSolePaintDensityChange,
  activeTab: externalActiveTab,
  onTabChange
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [internalActiveTab, setInternalActiveTab] = useState<'upper' | 'sole'>('upper');
  
  // Use external activeTab if provided, otherwise use internal state
  const activeTab = externalActiveTab || internalActiveTab;
  const handleTabChange = (tab: 'upper' | 'sole') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const getCurrentColor = () => activeTab === 'upper' ? topColor : bottomColor;
  const getCurrentColorChanger = () => activeTab === 'upper' ? onTopColorChange : onBottomColorChange;
  const getCurrentSplatter = () => activeTab === 'upper' ? upperHasSplatter : soleHasSplatter;
  const getCurrentSplatterColor = () => activeTab === 'upper' ? upperSplatterColor : soleSplatterColor;
  const getCurrentSplatterToggle = () => activeTab === 'upper' ? onUpperSplatterToggle : onSoleSplatterToggle;
  const getCurrentSplatterColorChanger = () => activeTab === 'upper' ? onUpperSplatterColorChange : onSoleSplatterColorChange;
  const getCurrentPaintDensity = () => activeTab === 'upper' ? upperPaintDensity : solePaintDensity;
  const getCurrentPaintDensityChanger = () => activeTab === 'upper' ? onUpperPaintDensityChange : onSolePaintDensityChange;

  return (
    <div className="absolute top-4 right-4 z-20">
      {/* Color Customizer Panel with Collapsible Feature */}
      <div className={`transition-all duration-500 ease-in-out ${
        isOpen ? 'max-h-[450px] opacity-100 translate-y-0' : 'max-h-16 opacity-100 translate-y-0'
      }`}>
        <div className="w-80 bg-white/95 backdrop-blur-sm rounded-xl border border-border shadow-xl overflow-hidden">
          {/* Header with Collapse Button */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 p-4 pb-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Color Customizer</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="h-6 w-6 p-0 hover:bg-secondary/50 transition-colors"
              >
                {isOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            </div>
            
            {/* Tab Header - Only show when open */}
            {isOpen && (
              <div className="flex rounded-lg bg-secondary/50 p-1 relative">
                {/* Animated Tab Indicator */}
                <div 
                  className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-md shadow-sm transition-transform duration-300 ease-out ${
                    activeTab === 'upper' ? 'translate-x-0' : 'translate-x-full'
                  }`}
                />
                
                {/* Tab Buttons */}
                <button
                  onClick={() => handleTabChange('upper')}
                  className={`relative z-10 flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === 'upper' 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Upper
                </button>
                <button
                  onClick={() => handleTabChange('sole')}
                  className={`relative z-10 flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === 'sole' 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sole
                </button>
              </div>
            )}
          </div>

          {/* Tab Content - Collapsible with smooth animation */}
          <div className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-4 space-y-4">
            {/* Current Color Preview */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-secondary/30 rounded-lg">
              <div 
                className="w-10 h-10 rounded-full border-2 border-white shadow-md relative overflow-hidden"
                style={{ backgroundColor: getCurrentColor() }}
              >
                {/* Show splatter preview */}
                {getCurrentSplatter() && (
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40">
                    {/* Ultra dense small splatter dots for preview - different sizes for upper vs sole */}
                    {Array.from({ length: activeTab === 'upper' ? 35 : 25 }, (_, i) => (
                      <circle 
                        key={i}
                        cx={2 + (i % 7) * 5.5 + Math.random() * 3} 
                        cy={2 + Math.floor(i / 7) * 5.5 + Math.random() * 3} 
                        r={activeTab === 'upper' ? 0.15 + Math.random() * 0.25 : 0.3 + Math.random() * 0.4} 
                        fill={getCurrentSplatterColor()} 
                        opacity={0.8 + Math.random() * 0.2} 
                      />
                    ))}
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-sm capitalize">{activeTab} Color</p>
                <p className="text-xs text-muted-foreground">
                  {NATIONAL_PARK_COLORS.find(c => c.value === getCurrentColor())?.name || 'Custom'}
                </p>
              </div>
            </div>

            {/* Splatter Option for Both Upper and Sole */}
            <div className="p-3 bg-secondary/20 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Paint Splatter</label>
                <Button
                  variant={getCurrentSplatter() ? "default" : "outline"}
                  size="sm"
                  onClick={() => getCurrentSplatterToggle()(!getCurrentSplatter())}
                  className="h-6 px-3 text-xs"
                >
                  {getCurrentSplatter() ? 'ON' : 'OFF'}
                </Button>
              </div>
              
              {getCurrentSplatter() && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Splatter Color:</p>
                  <div className="flex gap-1 flex-wrap">
                    {NATIONAL_PARK_COLORS.slice(0, 8).map((color) => (
                      <Button
                        key={color.value}
                        variant="outline"
                        size="sm"
                        className={`w-5 h-5 p-0 border rounded-full transition-all hover:scale-110 ${
                          getCurrentSplatterColor() === color.value 
                            ? 'border-primary ring-1 ring-primary/20 scale-110' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => getCurrentSplatterColorChanger()(color.value)}
                        title={`Splatter: ${color.name}`}
                      />
                    ))}
                  </div>
                  
                  {/* Paint Density Control - Compact */}
                  <div className="pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-muted-foreground" />
                        <label className="text-xs font-medium">Amount</label>
                      </div>
                      <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded text-[10px]">
                        {getCurrentPaintDensity()}%
                      </span>
                    </div>
                    <Slider
                      value={[getCurrentPaintDensity()]}
                      onValueChange={(value) => getCurrentPaintDensityChanger()(value[0])}
                      min={10}
                      max={200}
                      step={10}
                      className="w-full h-1"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span>Light</span>
                      <span>Heavy</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Color Grid with Animation - Compact */}
            <div className="grid grid-cols-6 gap-1.5 animate-fade-in">
              {NATIONAL_PARK_COLORS.map((colorOption, index) => (
                <Button
                  key={colorOption.value}
                  variant="outline"
                  size="sm"
                  className={`w-8 h-8 p-0 border-2 rounded-full transition-all hover:scale-110 ${
                    getCurrentColor() === colorOption.value 
                      ? 'border-primary ring-2 ring-primary/20 scale-110' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ 
                    backgroundColor: colorOption.value,
                    animationDelay: `${index * 50}ms`
                  }}
                  onClick={() => getCurrentColorChanger()(colorOption.value)}
                  title={colorOption.name}
                />
              ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};