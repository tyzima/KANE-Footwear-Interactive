import { useCallback } from 'react';

// Helper function to darken white/light materials to prevent overexposure
export const useColorProcessor = () => {
    const darkenLightMaterials = useCallback((color: string): string => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate brightness (0-255)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // If brightness is above 200 (very light), apply minimal darkening
        if (brightness > 200) {
            const darkenFactor = 0.95; // Darken by only 5% to keep whites bright
            const newR = Math.floor(r * darkenFactor);
            const newG = Math.floor(g * darkenFactor);
            const newB = Math.floor(b * darkenFactor);
            
            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        
        return color;
    }, []);

    return {
        darkenLightMaterials
    };
};
