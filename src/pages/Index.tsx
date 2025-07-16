import React from 'react';
import { ShoeViewer } from '@/components/ShoeViewer';
import { Sparkles, Users, Palette, Zap } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="px-6 py-8 border-b border-border/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-foreground">KANE</h1>
                <span className="px-3 py-1 bg-accent/20 text-accent text-sm font-medium rounded-full">
                  Revive Collection
                </span>
              </div>
              <p className="text-muted-foreground text-lg">
                Design your custom team shoes with advanced 3D visualization
              </p>
            </div>
            
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                <span>Team Customization</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Palette className="h-4 w-4 text-accent" />
                <span>Color Designer</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" />
                <span>Real-time 3D</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewer Section */}
      <main className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Large 3D Viewer */}
          <div className="h-[75vh] mb-8 relative">
            <ShoeViewer className="h-full shadow-elegant border border-border/30 rounded-xl" />
          </div>

          {/* Feature Cards Below */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Customization Card */}
            <div className="bg-white/60 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Custom Colors</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Design unique colorways for your team with our advanced color picker and material options.
              </p>
            </div>

            {/* Team Features */}
            <div className="bg-white/60 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Team Branding</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Add logos, numbers, and custom text to create the perfect team identity.
              </p>
            </div>

            {/* Technology */}
            <div className="bg-white/60 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Real-time 3D</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                See your changes instantly with our advanced WebGL rendering engine.
              </p>
            </div>

            {/* Premium Materials */}
            <div className="bg-white/60 backdrop-blur-sm border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground">Premium Materials</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose from a range of premium materials and finishes for the ultimate performance.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-border p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready to Design Your Team's Signature Look?
              </h2>
              <p className="text-muted-foreground mb-6">
                Start customizing your Revive shoes and bring your team's vision to life with KANE's advanced design tools.
              </p>
              <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-md">
                Start Designing
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
