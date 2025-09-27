import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface LogoUploaderProps {
  onLogoChange: (logoDataUrl: string | null) => void;
  currentLogo?: string | null;
  className?: string;
  showCopyButton?: boolean;
  onCopyClick?: () => void;
  copyButtonDisabled?: boolean;
  copyButtonTooltip?: string;
  rotate?: boolean;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  onLogoChange,
  currentLogo = null,
  className = '',
  showCopyButton = false,
  onCopyClick = () => {},
  copyButtonDisabled = false,
  copyButtonTooltip = 'Copy from side logo',
  rotate = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please select a file smaller than 5MB.');
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onLogoChange(result);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      alert('Failed to read the image file. Please try again.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`h-[60px] !-mt-2 flex flex-col ${className}`}>
      {/* Minimal Header - Single Line */}
      <div className="flex items-center justify-end">
        {currentLogo && (
          <button
            onClick={handleRemoveLogo}
            className="text-muted-foreground -mt-4 mb-1 hover:text-destructive transition-colors"
            title="Remove logo"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Compact Upload Area - Takes remaining space */}
      <div
        className={`
          flex-1 relative border-2 border-dashed rounded-lg transition-all cursor-pointer flex items-center justify-center
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {currentLogo ? (
          // Horizontal layout for preview
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={currentLogo}
                alt="Logo preview"
                className={`w-full h-full object-contain ${rotate ? '-rotate-90 scale-y-[-1]' : ''}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Logo uploaded</p>
              <p className="text-xs text-muted-foreground">Click to change</p>
            </div>
          </div>
        ) : (
          // Centered buttons when no logo is uploaded
          <div className="flex items-center justify-center gap-2 px-2">
            {showCopyButton && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyClick();
                      }}
                      disabled={copyButtonDisabled}
                      className="h-8 px-3 text-xs transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      Copy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copyButtonTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUploadClick();
              }}
              disabled={isProcessing}
              className="h-8 px-3 text-xs transition-all duration-300 disabled:opacity-40"
            >
              {isProcessing ? 'Processing...' : 'Upload new'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};