import React from 'react';
import { motion } from 'framer-motion';

interface ColorwaySwatchProps {
  colorway: {
    id: string;
    name: string;
    description: string;
    upper: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string | null;
      splatterColor2: string | null;
      splatterBaseColor: string | null;
      useDualSplatter: boolean;
    };
    sole: {
      baseColor: string;
      hasSplatter: boolean;
      splatterColor: string | null;
      splatterColor2: string | null;
      splatterBaseColor: string | null;
      useDualSplatter: boolean;
    };
    laces: {
      color: string;
    };
  };
  isSelected: boolean;
  onClick: () => void;
  isDarkMode?: boolean;
}

export const ColorwaySwatch: React.FC<ColorwaySwatchProps> = ({
  colorway,
  isSelected,
  onClick,
  isDarkMode = false
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative p-2 rounded-lg border-2 transition-all duration-300 group flex-shrink-0
        ${isSelected 
          ? 'border-primary ring-2 ring-primary/20 scale-105' 
          : isDarkMode 
            ? 'border-white/20 hover:border-white/40' 
            : 'border-gray-200 hover:border-gray-300'
        }
        ${isDarkMode ? 'bg-black/20 hover:bg-black/30' : 'bg-white hover:bg-gray-50'}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Color Preview - Vertical Stacked Rectangles */}
      <div className="flex flex-col gap-1">
        {/* Upper Color */}
        <div className="relative">
          <div
            className="w-6 h-4 rounded-sm border border-white shadow-sm"
            style={{ backgroundColor: colorway.upper.baseColor }}
          />
          {colorway.upper.hasSplatter && colorway.upper.splatterColor && (
            <div className="absolute inset-0 rounded-sm overflow-hidden">
              <svg
                width="24"
                height="16"
                viewBox="0 0 24 16"
                fill="none"
                className="opacity-70"
              >
                <circle cx="3" cy="3" r="0.8" fill={colorway.upper.splatterColor} />
                <circle cx="8" cy="2" r="0.6" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="15" cy="4" r="1" fill={colorway.upper.splatterColor} />
                <circle cx="21" cy="6" r="0.7" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="4" cy="8" r="0.8" fill={colorway.upper.splatterColor} />
                <circle cx="12" cy="10" r="1.2" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="18" cy="12" r="0.5" fill={colorway.upper.splatterColor} />
                <circle cx="2" cy="14" r="0.9" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="9" cy="13" r="0.7" fill={colorway.upper.splatterColor} />
                <circle cx="16" cy="15" r="1.1" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="22" cy="11" r="0.4" fill={colorway.upper.splatterColor} />
                <circle cx="6" cy="5" r="0.6" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="10" cy="7" r="0.9" fill={colorway.upper.splatterColor} />
                <circle cx="19" cy="9" r="0.7" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="1" cy="11" r="0.5" fill={colorway.upper.splatterColor} />
                <circle cx="14" cy="1" r="0.8" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="20" cy="3" r="0.6" fill={colorway.upper.splatterColor} />
                <circle cx="7" cy="15" r="0.7" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="13" cy="6" r="0.4" fill={colorway.upper.splatterColor} />
                <circle cx="17" cy="8" r="1.1" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="5" cy="12" r="0.6" fill={colorway.upper.splatterColor} />
                <circle cx="11" cy="4" r="0.8" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="23" cy="14" r="0.5" fill={colorway.upper.splatterColor} />
              </svg>
            </div>
          )}
        </div>

        {/* Sole Color */}
        <div className="relative">
          <div
            className="w-6 h-4 rounded-sm border border-white shadow-sm"
            style={{ backgroundColor: colorway.sole.baseColor }}
          />
          {colorway.sole.hasSplatter && colorway.sole.splatterColor && (
            <div className="absolute inset-0 rounded-sm overflow-hidden">
              <svg
                width="24"
                height="16"
                viewBox="0 0 24 16"
                fill="none"
                className="opacity-70"
              >
                <circle cx="3" cy="3" r="0.8" fill={colorway.sole.splatterColor} />
                <circle cx="8" cy="2" r="0.6" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="15" cy="4" r="1" fill={colorway.sole.splatterColor} />
                <circle cx="21" cy="6" r="0.7" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="4" cy="8" r="0.8" fill={colorway.sole.splatterColor} />
                <circle cx="12" cy="10" r="1.2" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="18" cy="12" r="0.5" fill={colorway.sole.splatterColor} />
                <circle cx="2" cy="14" r="0.9" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="9" cy="13" r="0.7" fill={colorway.sole.splatterColor} />
                <circle cx="16" cy="15" r="1.1" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="22" cy="11" r="0.4" fill={colorway.sole.splatterColor} />
                <circle cx="6" cy="5" r="0.6" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="10" cy="7" r="0.9" fill={colorway.sole.splatterColor} />
                <circle cx="19" cy="9" r="0.7" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="1" cy="11" r="0.5" fill={colorway.sole.splatterColor} />
                <circle cx="14" cy="1" r="0.8" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="20" cy="3" r="0.6" fill={colorway.sole.splatterColor} />
                <circle cx="7" cy="15" r="0.7" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="13" cy="6" r="0.4" fill={colorway.sole.splatterColor} />
                <circle cx="17" cy="8" r="1.1" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="5" cy="12" r="0.6" fill={colorway.sole.splatterColor} />
                <circle cx="11" cy="4" r="0.8" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="23" cy="14" r="0.5" fill={colorway.sole.splatterColor} />
              </svg>
            </div>
          )}
        </div>

        {/* Laces Color */}
        <div
          className="w-6 h-4 rounded-sm border border-white shadow-sm"
          style={{ backgroundColor: colorway.laces.color }}
        />
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
};

