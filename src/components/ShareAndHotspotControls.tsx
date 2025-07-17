import React from 'react';
import { ShareButton } from './ShareButton';
import { HotspotControls } from './HotspotControls';

interface ShareAndHotspotControlsProps {
  // ShareButton props
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isDarkMode?: boolean;
  
  // HotspotControls props
  onHotspotSelect: (hotspot: string) => void;
  activeHotspot: string | null;
  disabled?: boolean;
}

export const ShareAndHotspotControls: React.FC<ShareAndHotspotControlsProps> = ({
  canvasRef,
  isDarkMode = false,
  onHotspotSelect,
  activeHotspot,
  disabled = false
}) => {
  return (
    <div className="flex flex-col items-end gap-3">
      {/* Share Button */}
      <ShareButton 
        canvasRef={canvasRef}
        isDarkMode={isDarkMode}
      />
      
      {/* Hotspot Controls - Vertically Stacked */}
      <div className="flex flex-col gap-2">
        <HotspotControls
          onHotspotSelect={onHotspotSelect}
          activeHotspot={activeHotspot}
          disabled={disabled}
          onCameraMove={onCameraMove}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};