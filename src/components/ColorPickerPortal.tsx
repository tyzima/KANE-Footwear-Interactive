import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';

interface ColorOption {
  name: string;
  value: string;
  darkenedValue: string; // The actual value used on the model
}

interface ColorPickerPortalProps {
  currentColor: string;
  onColorSelect: (color: string) => void;
  title: string;
  isDarkMode?: boolean;
  children: React.ReactNode;
}

// Expanded color library with darkened variants
const EXPANDED_COLOR_LIBRARY: ColorOption[] = [
  // Reds
  { name: 'Crimson', value: '#C01030', darkenedValue: '#4A0510' },
  { name: 'Cardinal Red', value: '#D81E3A', darkenedValue: '#5A0A15' },
  { name: 'Burgundy', value: '#8F0020', darkenedValue: '#2A0008' },
  { name: 'Cherry Red', value: '#E32636', darkenedValue: '#5A0A10' },
  { name: 'Fire Red', value: '#FF4500', darkenedValue: '#661A00' },
  { name: 'Rose Red', value: '#FF69B4', darkenedValue: '#662A45' },
  
  // Oranges
  { name: 'Orange', value: '#FF7700', darkenedValue: '#662F00' },
  { name: 'Coral', value: '#FF6040', darkenedValue: '#662515' },
  { name: 'Tangerine', value: '#FF9500', darkenedValue: '#663A00' },
  { name: 'Peach', value: '#FFCC99', darkenedValue: '#665230' },
  { name: 'Amber', value: '#FFBF00', darkenedValue: '#664C00' },
  
  // Yellows
  { name: 'Gold', value: '#FFD700', darkenedValue: '#665500' },
  { name: 'Yellow', value: '#FFDD00', darkenedValue: '#665A00' },
  { name: 'Lemon', value: '#FFF700', darkenedValue: '#666200' },
  { name: 'Canary', value: '#FFFF99', darkenedValue: '#666630' },
  { name: 'Mustard', value: '#FFDB58', darkenedValue: '#665823' },
  
  // Greens
  { name: 'Kelly Green', value: '#2CBB17', darkenedValue: '#0F4A08' },
  { name: 'Forest Green', value: '#004F21', darkenedValue: '#001A0A' },
  { name: 'Mint', value: '#70FFB0', darkenedValue: '#2A6645' },
  { name: 'Olive', value: '#6B8000', darkenedValue: '#2A3300' },
  { name: 'Lime', value: '#32CD32', darkenedValue: '#145214' },
  { name: 'Emerald', value: '#50C878', darkenedValue: '#1F4F2F' },
  { name: 'Sage', value: '#9CAF88', darkenedValue: '#3F452B' },
  { name: 'Jade', value: '#00A86B', darkenedValue: '#00432A' },
  
  // Blues
  { name: 'Turquoise', value: '#00E0D0', darkenedValue: '#005952' },
  { name: 'Teal', value: '#008B8B', darkenedValue: '#003737' },
  { name: 'Sky Blue', value: '#50BAFF', darkenedValue: '#1F4A66' },
  { name: 'Royal Blue', value: '#2048FF', darkenedValue: '#0A1A66' },
  { name: 'Navy Blue', value: '#001F5C', darkenedValue: '#000A24' },
  { name: 'Cobalt', value: '#0047AB', darkenedValue: '#001A42' },
  { name: 'Steel Blue', value: '#4682B4', darkenedValue: '#1A3345' },
  { name: 'Powder Blue', value: '#B0E0E6', darkenedValue: '#455A5C' },
  { name: 'Azure', value: '#007FFF', darkenedValue: '#003266' },
  
  // Purples
  { name: 'Purple', value: '#5D1EAF', darkenedValue: '#240A42' },
  { name: 'Lavender', value: '#D8A2FF', darkenedValue: '#554066' },
  { name: 'Violet', value: '#8A2BE2', darkenedValue: '#35114A' },
  { name: 'Plum', value: '#DDA0DD', darkenedValue: '#574057' },
  { name: 'Indigo', value: '#4B0082', darkenedValue: '#1A002A' },
  { name: 'Magenta', value: '#FF00FF', darkenedValue: '#660066' },
  
  // Pinks
  { name: 'Pink', value: '#FF3399', darkenedValue: '#66143A' },
  { name: 'Hot Pink', value: '#FF69B4', darkenedValue: '#662A45' },
  { name: 'Rose', value: '#FF007F', darkenedValue: '#660028' },
  { name: 'Salmon', value: '#FA8072', darkenedValue: '#63332E' },
  
  // Neutrals
  { name: 'White', value: '#FFFFFF', darkenedValue: '#B3B3B3' },
  { name: 'Silver', value: '#C8C8C8', darkenedValue: '#666666' },
  { name: 'Slate Gray', value: '#607080', darkenedValue: '#262A33' },
  { name: 'Charcoal', value: '#36454F', darkenedValue: '#151A1F' },
  { name: 'Maroon', value: '#900000', darkenedValue: '#2A0000' },
  { name: 'Black', value: '#000000', darkenedValue: '#000000' },
  { name: 'Ivory', value: '#FFFFF0', darkenedValue: '#B3B3A6' },
  { name: 'Cream', value: '#F5F5DC', darkenedValue: '#66664A' },
  { name: 'Beige', value: '#F5F5DC', darkenedValue: '#66664A' },
  { name: 'Taupe', value: '#D2B48C', darkenedValue: '#554A38' },
];

export const ColorPickerPortal: React.FC<ColorPickerPortalProps> = ({
  currentColor,
  onColorSelect,
  title,
  isDarkMode = false,
  children
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(currentColor);
  const [hoveredColorName, setHoveredColorName] = useState<string>('');

  const handleColorSelect = (color: ColorOption) => {
    setSelectedColor(color.darkenedValue);
    onColorSelect(color.darkenedValue);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className={`w-80 p-4 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}`}
        align="start"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h4>
            <AnimatePresence>
              {hoveredColorName && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`text-xs font-medium ${
                    isDarkMode ? 'text-white/90' : 'text-gray-700'
                  }`}
                >
                  {hoveredColorName}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <div className="grid grid-cols-8 gap-2 max-h-64 p-4 overflow-y-auto">
            {EXPANDED_COLOR_LIBRARY.map((color) => (
              <motion.div
                key={color.value}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex justify-center"
                onMouseEnter={() => setHoveredColorName(color.name)}
                onMouseLeave={() => setHoveredColorName('')}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className={`w-8 h-8 p-0 border-2 rounded-full transition-all duration-200 hover:scale-110 ${
                    selectedColor === color.darkenedValue 
                      ? 'border-primary ring-2 ring-primary/30 scale-110' 
                      : isDarkMode 
                        ? 'border-white/30 hover:border-white/50' 
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorSelect(color)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
