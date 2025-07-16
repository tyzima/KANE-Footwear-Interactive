import React from 'react';
import { ShoeViewer } from '@/components/ShoeViewer';
import { Github, Zap, MousePointer, RotateCw } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-viewer-bg to-background">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                3D Shoe Viewer
              </h1>
              <p className="text-muted-foreground mt-1">
                Interactive 3D shoe experience powered by Three.js
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-primary" />
                  <span>Click & Drag</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4 text-primary" />
                  <span>Auto Rotate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>WebGL Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewer Section */}
      <main className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* Large 3D Viewer */}
          <div className="h-[80vh] mb-6">
            <ShoeViewer className="h-full shadow-glow border border-border/30" />
          </div>

          {/* Info Cards Below - Horizontal Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Features Card */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Features
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <strong className="text-foreground">Interactive 3D Model</strong>
                    <p className="text-muted-foreground">Click and drag to rotate, scroll to zoom</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                  <div>
                    <strong className="text-foreground">Part Interaction</strong>
                    <p className="text-muted-foreground">Click on different shoe parts for detailed view</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary-glow rounded-full mt-2"></div>
                  <div>
                    <strong className="text-foreground">Auto Rotation</strong>
                    <p className="text-muted-foreground">Automatic rotation with pause/play controls</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2"></div>
                  <div>
                    <strong className="text-foreground">Optimized Loading</strong>
                    <p className="text-muted-foreground">DRACO compression for faster loading</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Technical Specs
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Renderer:</span>
                  <span className="text-foreground">WebGL 2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Framework:</span>
                  <span className="text-foreground">React Three Fiber</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="text-foreground">GLB/GLTF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compression:</span>
                  <span className="text-foreground">DRACO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shadows:</span>
                  <span className="text-foreground">Real-time</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anti-aliasing:</span>
                  <span className="text-foreground">Enabled</span>
                </div>
              </div>
            </div>

            {/* Controls Help */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-foreground">
                Controls
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong className="text-foreground">Mouse:</strong>
                  <p className="text-muted-foreground">Left click + drag to rotate</p>
                </div>
                <div>
                  <strong className="text-foreground">Scroll:</strong>
                  <p className="text-muted-foreground">Scroll wheel to zoom in/out</p>
                </div>
                <div>
                  <strong className="text-foreground">Touch:</strong>
                  <p className="text-muted-foreground">Single finger drag to rotate, pinch to zoom</p>
                </div>
                <div>
                  <strong className="text-foreground">Controls:</strong>
                  <p className="text-muted-foreground">Use bottom controls for zoom and auto-rotation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
