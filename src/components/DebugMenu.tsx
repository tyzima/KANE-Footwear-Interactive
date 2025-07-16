import React, { useState, useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Euler } from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  Camera, 
  MapPin, 
  Copy, 
  Trash2, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Save,
  Download,
  Upload
} from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  rotation: [number, number, number];
  zoom: number;
  timestamp: number;
}

interface CameraInfo {
  position: [number, number, number];
  target: [number, number, number];
  rotation: [number, number, number];
  zoom: number;
}

interface DebugMenuProps {
  onHotspotAdd?: (hotspot: Hotspot) => void;
  onCameraPositionSet?: (position: [number, number, number], target: [number, number, number]) => void;
  visible?: boolean;
  onToggleVisibility?: () => void;
  cameraInfo?: CameraInfo;
  onCameraReset?: () => void;
  onGoToHotspot?: (hotspot: Hotspot) => void;
}

// Component that runs inside Canvas to collect camera data
export const DebugDataCollector: React.FC<{
  onCameraUpdate: (info: CameraInfo) => void;
}> = ({ onCameraUpdate }) => {
  const { camera, controls } = useThree();
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 10 === 0) { // Update every 10 frames
      const pos = camera.position;
      const rot = camera.rotation;
      
      const position: [number, number, number] = [
        Math.round(pos.x * 1000) / 1000,
        Math.round(pos.y * 1000) / 1000,
        Math.round(pos.z * 1000) / 1000
      ];
      
      const rotation: [number, number, number] = [
        Math.round(rot.x * 1000) / 1000,
        Math.round(rot.y * 1000) / 1000,
        Math.round(rot.z * 1000) / 1000
      ];

      let target: [number, number, number] = [0, 0, 0];
      if (controls && 'target' in controls) {
        const controlsTarget = (controls as any).target;
        target = [
          Math.round(controlsTarget.x * 1000) / 1000,
          Math.round(controlsTarget.y * 1000) / 1000,
          Math.round(controlsTarget.z * 1000) / 1000
        ];
      }

      let zoom = 1;
      if (camera.type === 'PerspectiveCamera') {
        zoom = Math.round((camera as any).zoom * 1000) / 1000;
      }

      onCameraUpdate({ position, target, rotation, zoom });
    }
  });

  return null;
};

// Predefined hotspots that match the ones in HotspotControls
const predefinedHotspots: Hotspot[] = [
  {
    id: 'side',
    name: 'Side View',
    position: [-3.195, 0.46, -0.145],
    target: [0, 0, 0],
    rotation: [-1.876, -1.421, -1.879],
    zoom: 1,
    timestamp: Date.now()
  },
  {
    id: 'top',
    name: 'Top View',
    position: [0.028, 2.798, 1.615],
    target: [0, 0, 0],
    rotation: [-1.047, 0.009, 0.015],
    zoom: 1,
    timestamp: Date.now()
  },
  {
    id: 'quarter',
    name: 'Quarter View',
    position: [2.451, 1.663, 1.291],
    target: [0, 0, 0],
    rotation: [-0.911, 0.861, 0.774],
    zoom: 1,
    timestamp: Date.now()
  },
  {
    id: 'back',
    name: 'Back View',
    position: [0.025, 0.46, -3.198],
    target: [0, 0, 0],
    rotation: [-2.999, 0.008, 3.141],
    zoom: 1,
    timestamp: Date.now()
  }
];

export const DebugMenu: React.FC<DebugMenuProps> = ({
  onHotspotAdd,
  onCameraPositionSet,
  visible = false,
  onToggleVisibility,
  cameraInfo = { position: [0, 0, 0], target: [0, 0, 0], rotation: [0, 0, 0], zoom: 1 },
  onCameraReset,
  onGoToHotspot
}) => {
  const [hotspots, setHotspots] = useState<Hotspot[]>(predefinedHotspots);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [hotspotName, setHotspotName] = useState('');

  const { position: currentPosition, target: currentTarget, rotation: currentRotation, zoom: currentZoom } = cameraInfo;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const addHotspot = () => {
    if (!hotspotName.trim()) return;

    const newHotspot: Hotspot = {
      id: `hotspot_${Date.now()}`,
      name: hotspotName.trim(),
      position: [...currentPosition],
      target: [...currentTarget],
      rotation: [...currentRotation],
      zoom: currentZoom,
      timestamp: Date.now()
    };

    setHotspots(prev => [...prev, newHotspot]);
    onHotspotAdd?.(newHotspot);
    setHotspotName('');
  };

  const removeHotspot = (id: string) => {
    setHotspots(prev => prev.filter(h => h.id !== id));
    if (selectedHotspot === id) {
      setSelectedHotspot(null);
    }
  };

  const goToHotspot = (hotspot: Hotspot) => {
    onGoToHotspot?.(hotspot);
    onCameraPositionSet?.(hotspot.position, hotspot.target);
    setSelectedHotspot(hotspot.id);
  };

  const exportHotspots = () => {
    const data = {
      hotspots,
      exportDate: new Date().toISOString(),
      cameraInfo: {
        currentPosition,
        currentTarget,
        currentRotation,
        currentZoom
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shoe-hotspots-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importHotspots = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.hotspots && Array.isArray(data.hotspots)) {
          setHotspots(data.hotspots);
        }
      } catch (error) {
        console.error('Failed to import hotspots:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const generateCameraCode = () => {
    return `// Camera Configuration
camera={{
  position: [${currentPosition.join(', ')}],
  target: [${currentTarget.join(', ')}],
  fov: 45,
  zoom: ${currentZoom}
}}

// OrbitControls Configuration
<OrbitControls
  target={[${currentTarget.join(', ')}]}
  // ... other props
/>`;
  };

  if (!visible) {
    return (
      <Button
        onClick={onToggleVisibility}
        className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white"
        size="sm"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-[90vh] overflow-y-auto">
      <Card className="bg-background/95 backdrop-blur-sm border-2 border-red-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bug className="h-5 w-5 text-red-600" />
              Debug Menu
            </CardTitle>
            <Button
              onClick={onToggleVisibility}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Camera Info */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Camera Position
            </h3>
            
            <div className="text-xs space-y-1 font-mono bg-muted p-2 rounded">
              <div className="flex justify-between">
                <span>Position:</span>
                <span>[{currentPosition.join(', ')}]</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`[${currentPosition.join(', ')}]`)}
                  className="h-4 w-4 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex justify-between">
                <span>Target:</span>
                <span>[{currentTarget.join(', ')}]</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`[${currentTarget.join(', ')}]`)}
                  className="h-4 w-4 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex justify-between">
                <span>Rotation:</span>
                <span>[{currentRotation.join(', ')}]</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`[${currentRotation.join(', ')}]`)}
                  className="h-4 w-4 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex justify-between">
                <span>Zoom:</span>
                <span>{currentZoom}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(currentZoom.toString())}
                  className="h-4 w-4 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(generateCameraCode())}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Camera Code
            </Button>
          </div>

          <Separator />

          {/* Add Hotspot */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Add Hotspot
            </h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Hotspot name..."
                value={hotspotName}
                onChange={(e) => setHotspotName(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border rounded"
                onKeyPress={(e) => e.key === 'Enter' && addHotspot()}
              />
              <Button
                size="sm"
                onClick={addHotspot}
                disabled={!hotspotName.trim()}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Hotspots List */}
          {hotspots.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Saved Hotspots ({hotspots.length})</h3>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportHotspots}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <label className="cursor-pointer">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4" />
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importHotspots}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {hotspots.map((hotspot) => (
                  <div
                    key={hotspot.id}
                    className={`p-2 border rounded text-sm ${
                      selectedHotspot === hotspot.id 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{hotspot.name}</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => goToHotspot(hotspot)}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeHotspot(hotspot.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground font-mono">
                      <div>Pos: [{hotspot.position.map(n => n.toFixed(2)).join(', ')}]</div>
                      <div>Target: [{hotspot.target.map(n => n.toFixed(2)).join(', ')}]</div>
                      <div>Zoom: {hotspot.zoom.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="font-semibold">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onCameraReset}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  // Add current position as "Default View"
                  const defaultHotspot: Hotspot = {
                    id: 'default_view',
                    name: 'Default View',
                    position: [...currentPosition],
                    target: [...currentTarget],
                    rotation: [...currentRotation],
                    zoom: currentZoom,
                    timestamp: Date.now()
                  };
                  setHotspots(prev => [defaultHotspot, ...prev.filter(h => h.id !== 'default_view')]);
                }}
              >
                <Save className="h-4 w-4 mr-1" />
                Save Default
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <p className="font-medium mb-1">Instructions:</p>
            <ul className="space-y-1">
              <li>• Move camera to desired position</li>
              <li>• Name and save as hotspot</li>
              <li>• Use "Copy Camera Code" for initial setup</li>
              <li>• Export/import hotspots for backup</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};