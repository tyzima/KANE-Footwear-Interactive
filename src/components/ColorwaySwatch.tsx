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
        relative p-4 rounded-xl border-2 transition-all duration-300 group flex-shrink-0
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
      {/* Color Preview - Horizontal Layout */}
      <div className="flex items-center gap-2">
        {/* Upper Color */}
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: colorway.upper.baseColor }}
          />
          {colorway.upper.hasSplatter && colorway.upper.splatterColor && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="opacity-70"
              >
                <circle cx="4" cy="4" r="1.2" fill={colorway.upper.splatterColor} />
                <circle cx="10" cy="3" r="0.8" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="20" cy="5" r="1.5" fill={colorway.upper.splatterColor} />
                <circle cx="28" cy="8" r="0.9" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="6" cy="11" r="1.1" fill={colorway.upper.splatterColor} />
                <circle cx="16" cy="13" r="1.8" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="24" cy="16" r="0.7" fill={colorway.upper.splatterColor} />
                <circle cx="3" cy="20" r="1.3" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="12" cy="22" r="1" fill={colorway.upper.splatterColor} />
                <circle cx="21" cy="25" r="1.4" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="29" cy="28" r="0.6" fill={colorway.upper.splatterColor} />
                <circle cx="8" cy="29" r="1.6" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="17" cy="27" r="0.8" fill={colorway.upper.splatterColor} />
                <circle cx="26" cy="24" r="1.2" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="2" cy="7" r="0.9" fill={colorway.upper.splatterColor} />
                <circle cx="14" cy="6" r="1.3" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="25" cy="12" r="0.7" fill={colorway.upper.splatterColor} />
                <circle cx="7" cy="18" r="1.5" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="18" cy="19" r="1.1" fill={colorway.upper.splatterColor} />
                <circle cx="30" cy="20" r="0.8" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="1" cy="15" r="1.4" fill={colorway.upper.splatterColor} />
                <circle cx="11" cy="14" r="0.6" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="22" cy="9" r="1.7" fill={colorway.upper.splatterColor} />
                <circle cx="5" cy="25" r="0.9" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="15" cy="30" r="1.2" fill={colorway.upper.splatterColor} />
                <circle cx="27" cy="17" r="0.8" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="9" cy="1" r="1.1" fill={colorway.upper.splatterColor} />
                <circle cx="19" cy="2" r="0.7" fill={colorway.upper.useDualSplatter && colorway.upper.splatterColor2 ? colorway.upper.splatterColor2 : colorway.upper.splatterColor} />
                <circle cx="31" cy="15" r="1.3" fill={colorway.upper.splatterColor} />
              </svg>
            </div>
          )}
        </div>

        {/* Sole Color */}
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: colorway.sole.baseColor }}
          />
          {colorway.sole.hasSplatter && colorway.sole.splatterColor && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="opacity-70"
              >
                <circle cx="4" cy="4" r="1.2" fill={colorway.sole.splatterColor} />
                <circle cx="10" cy="3" r="0.8" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="20" cy="5" r="1.5" fill={colorway.sole.splatterColor} />
                <circle cx="28" cy="8" r="0.9" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="6" cy="11" r="1.1" fill={colorway.sole.splatterColor} />
                <circle cx="16" cy="13" r="1.8" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="24" cy="16" r="0.7" fill={colorway.sole.splatterColor} />
                <circle cx="3" cy="20" r="1.3" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="12" cy="22" r="1" fill={colorway.sole.splatterColor} />
                <circle cx="21" cy="25" r="1.4" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="29" cy="28" r="0.6" fill={colorway.sole.splatterColor} />
                <circle cx="8" cy="29" r="1.6" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="17" cy="27" r="0.8" fill={colorway.sole.splatterColor} />
                <circle cx="26" cy="24" r="1.2" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="2" cy="7" r="0.9" fill={colorway.sole.splatterColor} />
                <circle cx="14" cy="6" r="1.3" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="25" cy="12" r="0.7" fill={colorway.sole.splatterColor} />
                <circle cx="7" cy="18" r="1.5" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="18" cy="19" r="1.1" fill={colorway.sole.splatterColor} />
                <circle cx="30" cy="20" r="0.8" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="1" cy="15" r="1.4" fill={colorway.sole.splatterColor} />
                <circle cx="11" cy="14" r="0.6" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="22" cy="9" r="1.7" fill={colorway.sole.splatterColor} />
                <circle cx="5" cy="25" r="0.9" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="15" cy="30" r="1.2" fill={colorway.sole.splatterColor} />
                <circle cx="27" cy="17" r="0.8" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="9" cy="1" r="1.1" fill={colorway.sole.splatterColor} />
                <circle cx="19" cy="2" r="0.7" fill={colorway.sole.useDualSplatter && colorway.sole.splatterColor2 ? colorway.sole.splatterColor2 : colorway.sole.splatterColor} />
                <circle cx="31" cy="15" r="1.3" fill={colorway.sole.splatterColor} />
              </svg>
            </div>
          )}
        </div>

        {/* Laces Color */}
        <div
          className="w-8 h-8 rounded-full border border-white shadow-sm"
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

