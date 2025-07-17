import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface LogoUploaderProps {
  onLogoChange: (logoDataUrl: string | null) => void;
  currentLogo?: string | null;
  className?: string;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  onLogoChange,
  currentLogo = null,
  className = ''
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
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2 flex-shrink-0">
          <Upload className="w-4 h-4" />
          Logo:
        </label>
        <div className="flex-1 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {currentLogo ? 'Logo uploaded' : 'No logo selected'}
          </span>
          {currentLogo && (
            <button
              onClick={handleRemoveLogo}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove logo"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 transition-all cursor-pointer
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
          // Preview current logo
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src={currentLogo}
                alt="Logo preview"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Logo uploaded</p>
              <p className="text-xs text-muted-foreground">Click to change or drag new image</p>
            </div>
          </div>
        ) : (
          // Upload prompt
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-muted rounded-lg flex items-center justify-center">
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <ImageIcon size={18} className="text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {isProcessing ? 'Processing...' : 'Upload Logo'}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag & drop or click to select
            </p>

          </div>
        )}
      </div>

      {/* Position Controls */}

    </div>
  );
};