import React, { useRef, useState } from 'react';
import { Share2, Download, Copy, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
      console.log('Current design data:', currentDesign);
      
      const designName = `Custom Design - ${new Date().toLocaleDateString()}`;
      console.log('Saving design with name:', designName);
      
      const result = await saveDesign(designName, currentDesign, 'Custom shoe design created with KANE Footwear', true);
      console.log('Save result:', result);
      
      if (result) {
        const baseUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${baseUrl}?design=${result.shareToken}`;
        
        // Enhanced clipboard handling with better Safari support
        let copySuccessful = false;
        
        try {
          // Method 1: Try modern clipboard API first (works in Chrome and modern Safari with HTTPS)
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareUrl);
            copySuccessful = true;
          } else {
            throw new Error('Clipboard API not available');
          }
        } catch (clipboardError) {
          console.warn('Modern clipboard API failed, trying fallbacks:', clipboardError);
          
          // Method 2: Traditional execCommand approach for Safari
          try {
            // Create a more Safari-friendly textarea
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            
            // Safari-specific positioning and attributes
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            textArea.style.top = '0';
            textArea.style.opacity = '0';
            textArea.style.pointerEvents = 'none';
            textArea.setAttribute('readonly', '');
            textArea.tabIndex = -1;
            
            document.body.appendChild(textArea);
            
            // Safari needs focus before selection
            textArea.focus();
            textArea.setSelectionRange(0, shareUrl.length);
            
            // Try execCommand
            const successful = document.execCommand('copy');
            
            // Clean up immediately
            document.body.removeChild(textArea);
            
            if (successful) {
              copySuccessful = true;
            } else {
              throw new Error('execCommand returned false');
            }
            
          } catch (execError) {
            console.warn('execCommand failed, trying iOS Safari method:', execError);
            
            // Method 3: iOS Safari specific approach
            try {
              const textArea = document.createElement('textarea');
              textArea.value = shareUrl;
              textArea.contentEditable = 'true';
              textArea.readOnly = false;
              
              // iOS Safari specific styles
              textArea.style.position = 'fixed';
              textArea.style.left = '0';
              textArea.style.top = '0';
              textArea.style.width = '1px';
              textArea.style.height = '1px';
              textArea.style.padding = '0';
              textArea.style.border = 'none';
              textArea.style.outline = 'none';
              textArea.style.boxShadow = 'none';
              textArea.style.background = 'transparent';
              textArea.style.fontSize = '16px'; // Prevent zoom on iOS
              
              document.body.appendChild(textArea);
              
              // iOS Safari selection method
              const range = document.createRange();
              range.selectNodeContents(textArea);
              
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
              }
              
              textArea.setSelectionRange(0, shareUrl.length);
              
              const successful = document.execCommand('copy');
              document.body.removeChild(textArea);
              
              if (successful) {
                copySuccessful = true;
              }
              
            } catch (iosError) {
              console.warn('All clipboard methods failed:', iosError);
              // Final fallback - just show the link
            }
          }
        }
        
        // Show appropriate success message
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        if (copySuccessful) {
          toast({
            title: "Design saved and link copied!",
            description: "Anyone can view your custom design with this link.",
          });
        } else {
          // Show the link for manual copying with a copy button
          toast({
            title: "Design saved successfully!",
            description: (
              <div className="space-y-2">
                <p>Tap the copy icon to copy the link:</p>
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <div className="text-xs font-mono break-all flex-1">
                    {shareUrl}
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        // Try multiple copy methods for the toast copy button
                        if (navigator.clipboard && window.isSecureContext) {
                          await navigator.clipboard.writeText(shareUrl);
                        } else {
                          // Fallback method
                          const textArea = document.createElement('textarea');
                          textArea.value = shareUrl;
                          textArea.style.position = 'fixed';
                          textArea.style.left = '-999999px';
                          textArea.style.top = '-999999px';
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                        }
                        
                        // Show success feedback
                        const button = e.target as HTMLButtonElement;
                        const originalText = button.innerHTML;
                        button.innerHTML = '✓';
                        button.style.color = '#22c55e';
                        setTimeout(() => {
                          button.innerHTML = originalText;
                          button.style.color = '';
                        }, 1000);
                      } catch (error) {
                        console.warn('Copy failed:', error);
                      }
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Copy link"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ),
            duration: 15000, // Show longer for manual copying
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
  );
};