import React, { useRef, useState } from 'react';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';

interface ShareButtonProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isDarkMode?: boolean;
  onCaptureModel?: () => Promise<string>;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  canvasRef,
  isDarkMode = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInstagramPost = async () => {
    if (!canvasRef?.current) {
      toast({
        title: "Error",
        description: "Unable to capture the 3D model. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get the current canvas screenshot without any resizing (no flashing)
      const originalCanvas = canvasRef.current;
      const originalDataUrl = originalCanvas.toDataURL('image/png', 1.0);
      const originalWidth = originalCanvas.width;
      const originalHeight = originalCanvas.height;

      // Create the Instagram post canvas
      const socialCanvas = document.createElement('canvas');
      const ctx = socialCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to create canvas context');
      }

      const renderSize = 2160;
      socialCanvas.width = renderSize;
      socialCanvas.height = renderSize;

      // Load the original model image
      const modelImg = new Image();
      modelImg.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        modelImg.onload = resolve;
        modelImg.onerror = reject;
        modelImg.src = originalDataUrl;
      });

      // Detect background color from top-left pixel
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = modelImg.width;
      tempCanvas.height = modelImg.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(modelImg, 0, 0);
        const pixel = tempCtx.getImageData(0, 0, 1, 1).data;
        let bgColor = 'white';
        if (pixel[3] > 0) {
          bgColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        }
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, renderSize, renderSize);
      } else {
        // Fallback to white if context fails
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, renderSize, renderSize);
      }

      // Calculate drawing dimensions to maintain aspect ratio
      const bottomSpace = renderSize * 0.1;
      const modelAreaHeight = renderSize - bottomSpace;
      let scale = Math.min(renderSize / originalWidth, modelAreaHeight / originalHeight);
      scale *= 2.0; // Scale up by 1.5x
      const drawWidth = originalWidth * scale;
      const drawHeight = originalHeight * scale;
      const drawX = (renderSize - drawWidth) / 2;
      const drawY = (modelAreaHeight - drawHeight) / 2;

      // Draw the model
      ctx.drawImage(modelImg, drawX, drawY, drawWidth, drawHeight);

      // Add side texts
      const sideFontSize = Math.floor(renderSize * 0.02); // smaller font
      const letterSpacingValue = sideFontSize * 0.5; // wide letter spacing
      ctx.font = `${sideFontSize}px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = '#d0d0d0'; // light gray for subtle
      ctx.letterSpacing = `${letterSpacingValue}px`;

      const leftX = renderSize * 0.05;

      // Left side text
      const leftText = 'CUSTOMIZE YOURS';
      ctx.save();
      ctx.translate(leftX, renderSize / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(leftText, 0, 0);
      ctx.restore();

      ctx.letterSpacing = '0px';

      // Load and draw the logo with proper aspect ratio
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
        logoImg.src = '/mainkanelogo.png';
      });

      // Calculate logo dimensions maintaining aspect ratio - scaled smaller
      const logoAspectRatio = logoImg.width / logoImg.height;
      const logoHeight = renderSize * 0.05; // smaller
      const logoWidth = logoHeight * logoAspectRatio;

      // Position logo in bottom center with more space
      const logoX = (renderSize - logoWidth) / 2;
      const logoY = renderSize - logoHeight - (renderSize * 0.06); // more margin from bottom

      ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

      // Convert to blob and download
      socialCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `kane-shoes-instagram-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Success!",
            description: "Instagram post image downloaded successfully.",
          });
        }
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Error generating Instagram post:', error);
      toast({
        title: "Error",
        description: "Failed to generate Instagram post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyShareLink = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex rounded-full items-center gap-2 transition-all duration-300 ${isDarkMode
            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
            : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-white'
            }`}
          disabled={isGenerating}
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl">
<DropdownMenuItem onClick={generateInstagramPost} className="hover:bg-gray-100 rounded-2xl">
          Instagram Post
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyShareLink}  className="hover:bg-gray-100 rounded-2xl" >
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};