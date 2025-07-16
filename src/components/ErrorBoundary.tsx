import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Viewer Error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-background">
          <div className="text-center p-8 max-w-md">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              WebGL Error
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Your browser or device doesn't support WebGL, which is required for 3D rendering.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
              
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Troubleshooting tips:</p>
                <ul className="text-left space-y-1">
                  <li>• Update your browser to the latest version</li>
                  <li>• Enable hardware acceleration</li>
                  <li>• Try a different browser (Chrome, Firefox, Safari)</li>
                  <li>• Check if WebGL is enabled at <a href="https://get.webgl.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">get.webgl.org</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}