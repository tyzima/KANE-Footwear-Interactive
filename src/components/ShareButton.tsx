import React, { useRef, useState } from 'react';
import { Share2, Download, Copy, Check, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { useDesignSharing, DesignData } from '@/hooks/useDesignSharing';

interface ShareButtonProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  isDarkMode?: boolean;
  onCaptureModel?: () => Promise<string>;
  // Function to get current design state
  getCurrentDesign?: () => DesignData;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  canvasRef,
  isDarkMode = false,
  getCurrentDesign
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const { saveDesign, isLoading: isSaving } = useDesignSharing();

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

      // Convert to blob and handle sharing/download
      socialCanvas.toBlob(async (blob) => {
        if (blob) {
          const fileName = `kane-shoes-instagram-${Date.now()}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Custom Kane Shoes',
                text: 'Check out my custom Kane shoes! Customize yours now.',
              });
              toast({
                title: "Success!",
                description: "Image shared successfully.",
              });
            } catch (error) {
              if (error.name !== 'AbortError') {
                // Fallback to download
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                toast({
                  title: "Success!",
                  description: "Instagram post image downloaded successfully.",
                });
              }
            }
          } else {
            // Download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
              title: "Success!",
              description: "Instagram post image downloaded successfully.",
            });
          }
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

  const saveAndShareDesign = async () => {
    if (!getCurrentDesign) {
      toast({
        title: "Error",
        description: "Design capture function not available.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentDesign = getCurrentDesign();
      const designName = `Custom Design - ${new Date().toLocaleDateString()}`;
      
      const result = await saveDesign(designName, currentDesign, 'Custom shoe design created with KANE Footwear');
      
      if (result) {
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?design=${result.shareToken}`;
        
    // Try to copy to clipboard with Safari-compatible approach
    let copySuccessful = false;
    
    try {
      // First try modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        copySuccessful = true;
      } else {
        throw new Error('Clipboard API not available');
      }
    } catch (clipboardError) {
      console.warn('Clipboard API failed, trying fallback:', clipboardError);
      
      // Safari-compatible fallback method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        
        // Make textarea visible but off-screen for Safari
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.style.opacity = '0';
        textArea.style.pointerEvents = 'none';
        textArea.setAttribute('readonly', '');
        
        document.body.appendChild(textArea);
        
        // For iOS Safari, we need to use a different approach
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          textArea.contentEditable = 'true';
          textArea.readOnly = false;
          const range = document.createRange();
          range.selectNodeContents(textArea);
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          textArea.setSelectionRange(0, 999999);
        } else {
          textArea.select();
          textArea.setSelectionRange(0, 999999);
        }
        
        // Try to copy
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          copySuccessful = true;
        }
      } catch (fallbackError) {
        console.warn('Fallback copy method failed:', fallbackError);
        // Clean up if textarea was created
        const textArea = document.querySelector('textarea[readonly]');
        if (textArea) {
          document.body.removeChild(textArea);
        }
      }
    }
    
    if (copySuccessful) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Design saved and link copied!",
        description: "Anyone can view your custom design with this link.",
      });
    } else {
      // If all copy methods fail, show a nice modal for manual copying
      setShareUrl(shareUrl);
      setShowShareModal(true);
      
      toast({
        title: "Design saved!",
        description: "Share modal opened - copy the link from there.",
      });
    }
      }
    } catch (error) {
      console.error('Error saving and sharing design:', error);
      toast({
        title: "Error",
        description: "Failed to save and share design. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyCurrentPageLink = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title: "Link copied!",
        description: "Current page link copied to clipboard.",
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
          className={`rounded-full w-9 md:w-auto items-center gap-2 transition-all duration-300 ${isDarkMode
            ? 'bg-black/40 border-white/20 text-white hover:bg-white/20'
            : 'bg-white/80 border-gray-200 text-gray-700 hover:bg-black'
            }`}
          disabled={isGenerating || isSaving}
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden md:block">Share</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl">
        <DropdownMenuItem onClick={saveAndShareDesign} className="hover:bg-gray-100 hover:text-black rounded-xl" disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          <span className='flex-1'>{isSaving ? 'Saving...' : 'Save & Share Design'}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={generateInstagramPost} className="hover:bg-gray-100 hover:text-black rounded-xl" disabled={isGenerating}>
          <Download className="w-4 h-4 mr-2" />
          <span className='flex-1'>Instagram Post</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyCurrentPageLink} className="hover:bg-gray-100 rounded-xl">
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          <span className='flex-1'>{copied ? 'Copied!' : 'Copy Page Link'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Share Modal for Safari and other browsers that can't auto-copy */}
    <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Design
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your design has been saved! Copy the link below to share it with others:
          </p>
          
          <div className="flex items-center space-x-2">
            <Input
              value={shareUrl}
              readOnly
              className="flex-1"
              onClick={(e) => {
                const input = e.target as HTMLInputElement;
                input.select();
              }}
            />
            <Button
              size="sm"
              onClick={async () => {
                try {
                  // Try one more time to copy when user explicitly clicks
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast({
                      title: "Link copied!",
                      description: "Share link has been copied to clipboard.",
                    });
                  } else {
                    // Select the input for manual copying
                    const input = document.querySelector('input[readonly]') as HTMLInputElement;
                    if (input) {
                      input.focus();
                      input.select();
                      toast({
                        title: "Link selected",
                        description: "Press Cmd+C (Mac) or Ctrl+C (PC) to copy.",
                      });
                    }
                  }
                } catch (error) {
                  // Select the input for manual copying
                  const input = document.querySelector('input[readonly]') as HTMLInputElement;
                  if (input) {
                    input.focus();
                    input.select();
                    toast({
                      title: "Link selected",
                      description: "Press Cmd+C (Mac) or Ctrl+C (PC) to copy.",
                    });
                  }
                }
              }}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view your design
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};