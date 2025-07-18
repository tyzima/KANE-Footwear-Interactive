import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Droplets, ChevronDown, ChevronUp, School, Upload, Paintbrush, ChevronLeft, ChevronRight, MessageCircle, X, Send, Bot, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { LogoUploader } from './LogoUploader';
import { SchoolSelector } from './SchoolSelector';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface ColorCustomizerProps {
  topColor: string;
  bottomColor: string;
  onTopColorChange: (color: string) => void;
  onBottomColorChange: (color: string) => void;
  upperHasSplatter: boolean;
  soleHasSplatter: boolean;
  upperSplatterColor: string;
  soleSplatterColor: string;
  upperPaintDensity: number;
  solePaintDensity: number;
  onUpperSplatterToggle: (enabled: boolean) => void;
  onSoleSplatterToggle: (enabled: boolean) => void;
  onUpperSplatterColorChange: (color: string) => void;
  onSoleSplatterColorChange: (color: string) => void;
  onUpperPaintDensityChange: (density: number) => void;
  onSolePaintDensityChange: (density: number) => void;
  activeTab?: 'upper' | 'sole' | 'laces' | 'logos';
  onTabChange?: (tab: 'upper' | 'sole' | 'laces' | 'logos') => void;
  // Lace and logo colors (single color for both left and right)
  laceColor?: string;
  logoColor?: string;
  onLaceColorChange?: (color: string) => void;
  onLogoColorChange?: (color: string) => void;
  upperHasGradient?: boolean;
  soleHasGradient?: boolean;
  upperGradientColor1?: string;
  upperGradientColor2?: string;
  soleGradientColor1?: string;
  soleGradientColor2?: string;
  onUpperGradientToggle?: (enabled: boolean) => void;
  onSoleGradientToggle?: (enabled: boolean) => void;
  onUpperGradientColor1Change?: (color: string) => void;
  onUpperGradientColor2Change?: (color: string) => void;
  onSoleGradientColor1Change?: (color: string) => void;
  onSoleGradientColor2Change?: (color: string) => void;
  upperTexture?: string | null;
  soleTexture?: string | null;
  onUpperTextureChange?: (texture: string | null) => void;
  onSoleTextureChange?: (texture: string | null) => void;
  // Logo props
  logoUrl?: string | null;
  onLogoChange?: (logoUrl: string | null) => void;
  // Dark mode
  isDarkMode?: boolean;
  // Height callback for AIChat positioning
  onHeightChange?: (height: number) => void;
}

const NATIONAL_PARK_COLORS = [
  // Reds
  { name: 'Crimson', value: '#C01030' },
  { name: 'Cardinal Red', value: '#D81E3A' },
  { name: 'Burgundy', value: '#8F0020' },
  // Oranges
  { name: 'Orange', value: '#FF7700' },
  { name: 'Coral', value: '#FF6040' },
  // Yellows
  { name: 'Gold', value: '#FFD700' },
  { name: 'Yellow', value: '#FFDD00' },
  // Greens
  { name: 'Kelly Green', value: '#2CBB17' },
  { name: 'Forest Green', value: '#004F21' },
  { name: 'Mint', value: '#70FFB0' },
  { name: 'Olive', value: '#6B8000' },
  // Blues
  { name: 'Turquoise', value: '#00E0D0' },
  { name: 'Teal', value: '#008B8B' },
  { name: 'Sky Blue', value: '#50BAFF' },
  { name: 'Royal Blue', value: '#2048FF' },
  { name: 'Navy Blue', value: '#001F5C' },
  // Purples
  { name: 'Purple', value: '#5D1EAF' },
  { name: 'Lavender', value: '#D8A2FF' },
  { name: 'Pink', value: '#FF3399' },
  // Neutrals
  { name: 'White', value: '#FFFFFF' },
  { name: 'Silver', value: '#C8C8C8' },
  { name: 'Slate Gray', value: '#607080' },
  { name: 'Maroon', value: '#900000' },
  { name: 'Black', value: '#000000' },
];

const STEPS = [
  { id: 'colors', title: 'Choose Colors', icon: Paintbrush, description: 'Pick your base colors' },
  { id: 'effects', title: 'Add Effects', icon: Droplets, description: 'Paint splatter & textures' },
  { id: 'schools', title: 'School Spirit', icon: School, description: 'Apply school colors' },
  { id: 'logo', title: 'Add Logo', icon: Upload, description: 'Upload your logo' },
];

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  topColor,
  bottomColor,
  onTopColorChange,
  onBottomColorChange,
  upperHasSplatter,
  soleHasSplatter,
  upperSplatterColor,
  soleSplatterColor,
  upperPaintDensity,
  solePaintDensity,
  onUpperSplatterToggle,
  onSoleSplatterToggle,
  onUpperSplatterColorChange,
  onSoleSplatterColorChange,
  onUpperPaintDensityChange,
  onSolePaintDensityChange,
  activeTab: externalActiveTab,
  onTabChange,
  upperHasGradient = false,
  soleHasGradient = false,
  upperGradientColor1 = '#4a8c2b',
  upperGradientColor2 = '#c25d1e',
  soleGradientColor1 = '#4a8c2b',
  soleGradientColor2 = '#c25d1e',
  onUpperGradientToggle = () => { },
  onSoleGradientToggle = () => { },
  onUpperGradientColor1Change = () => { },
  onUpperGradientColor2Change = () => { },
  onSoleGradientColor1Change = () => { },
  onSoleGradientColor2Change = () => { },
  upperTexture = null,
  soleTexture = null,
  onUpperTextureChange = () => { },
  onSoleTextureChange = () => { },
  // Lace and logo colors with defaults (single color for both left and right)
  laceColor = '#FFFFFF',
  logoColor = '#FFFFFF',
  onLaceColorChange = () => { },
  onLogoColorChange = () => { },
  // Logo props with defaults
  logoUrl = null,
  onLogoChange = () => { },
  // Dark mode with default
  isDarkMode = false,
  // Height callback for AIChat positioning
  onHeightChange = () => { }
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [internalActiveTab, setInternalActiveTab] = useState<'upper' | 'sole' | 'laces' | 'logos'>('upper');
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  // AI Chat integration
  const [isAIChatActive, setIsAIChatActive] = useState(false);
  const [aiInputMessage, setAiInputMessage] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; isUser: boolean; timestamp: Date }[]>([]);
  const [aiResponseVisible, setAiResponseVisible] = useState(false);

  // Initialize Gemini AI
  const genAI = useMemo(() => {
    const apiKey = "AIzaSyDr_8GiHPH6yJaFsTQeoaDQ6cLJPgtn0XE";
    if (!apiKey) {
      console.error("⚠️ Gemini API key not found");
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  }, []);

  const activeTab = externalActiveTab || internalActiveTab;
  const handleTabChange = (tab: 'upper' | 'sole' | 'laces' | 'logos') => {
    onTabChange ? onTabChange(tab) : setInternalActiveTab(tab);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const getCurrentColor = () => {
    switch (activeTab) {
      case 'upper': return topColor;
      case 'sole': return bottomColor;
      case 'laces': return laceColor;
      case 'logos': return logoColor;
      default: return topColor;
    }
  };

  const getCurrentColorChanger = () => {
    switch (activeTab) {
      case 'upper': return onTopColorChange;
      case 'sole': return onBottomColorChange;
      case 'laces': return onLaceColorChange;
      case 'logos': return onLogoColorChange;
      default: return onTopColorChange;
    }
  };

  const getCurrentSplatter = () => {
    // Only upper and sole support splatter effects
    if (activeTab === 'upper') return upperHasSplatter;
    if (activeTab === 'sole') return soleHasSplatter;
    return false; // Laces and logos don't support splatter
  };

  const getCurrentSplatterColor = () => {
    if (activeTab === 'upper') return upperSplatterColor;
    if (activeTab === 'sole') return soleSplatterColor;
    return upperSplatterColor; // Default fallback for laces/logos (not used)
  };

  const getCurrentSplatterToggle = () => {
    if (activeTab === 'upper') return onUpperSplatterToggle;
    if (activeTab === 'sole') return onSoleSplatterToggle;
    return onUpperSplatterToggle; // Default fallback for laces/logos (not used)
  };

  const getCurrentSplatterColorChanger = () => {
    if (activeTab === 'upper') return onUpperSplatterColorChange;
    if (activeTab === 'sole') return onSoleSplatterColorChange;
    return onUpperSplatterColorChange; // Default fallback for laces/logos (not used)
  };

  const getCurrentPaintDensity = () => {
    if (activeTab === 'upper') return upperPaintDensity;
    if (activeTab === 'sole') return solePaintDensity;
    return upperPaintDensity; // Default fallback for laces/logos (not used)
  };

  const getCurrentPaintDensityChanger = () => {
    if (activeTab === 'upper') return onUpperPaintDensityChange;
    if (activeTab === 'sole') return onSolePaintDensityChange;
    return onUpperPaintDensityChange; // Default fallback for laces/logos (not used)
  };

  const getCurrentGradient = () => activeTab === 'upper' ? upperHasGradient : soleHasGradient;
  const getCurrentGradientToggle = () => activeTab === 'upper' ? onUpperGradientToggle : onSoleGradientToggle;
  const getCurrentGradientColor1 = () => activeTab === 'upper' ? upperGradientColor1 : soleGradientColor1;
  const getCurrentGradientColor2 = () => activeTab === 'upper' ? upperGradientColor2 : soleGradientColor2;
  const getCurrentGradientColor1Changer = () => activeTab === 'upper' ? onUpperGradientColor1Change : onSoleGradientColor1Change;
  const getCurrentGradientColor2Changer = () => activeTab === 'upper' ? onUpperGradientColor2Change : onSoleGradientColor2Change;

  const swapGradientColors = () => {
    const color1 = getCurrentGradientColor1();
    const color2 = getCurrentGradientColor2();
    getCurrentGradientColor1Changer()(color2);
    getCurrentGradientColor2Changer()(color1);
  };

  // AI Chat functionality
  const handleAICommand = async (message: string) => {
    if (!message.trim() || isAiProcessing) return;

    setIsAiProcessing(true);
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    }]);

    try {
      if (!genAI) {
        throw new Error("AI features are disabled. Missing Gemini API key.");
      }

      const generationConfig = {
        responseMimeType: 'text/plain',
        responseModalities: ['TEXT', 'IMAGE'],
      };

      const modelName = 'gemini-2.0-flash-preview-image-generation';
      const model = genAI.getGenerativeModel({ model: modelName, generationConfig });

      const prompt = `You are an AI texture pattern generator for shoe customization. Analyze the user's request and respond with BOTH a JSON plan AND optionally a seamless pattern image.

            User Request: "${message}"

            Current Shoe State:
            - Upper color: ${topColor}
            - Sole color: ${bottomColor}
            - Upper has texture: ${upperTexture ? 'YES' : 'NO'}
            - Sole has texture: ${soleTexture ? 'YES' : 'NO'}
            - Upper has splatter: ${upperHasSplatter ? 'YES' : 'NO'}
            - Sole has splatter: ${soleHasSplatter ? 'YES' : 'NO'}
            - Upper has gradient: ${upperHasGradient ? 'YES' : 'NO'}
            - Sole has gradient: ${soleHasGradient ? 'YES' : 'NO'}

            CRITICAL INSTRUCTIONS:
            1. You MUST ALWAYS include a JSON object in your text response with this EXACT format:
            {
              "message": "A friendly message for the user about what you're doing",
              "targetPart": "upper" | "sole" | "both" | "none",
              "clearTextures": "upper" | "sole" | "both" | "none" (ONLY clear textures for parts being modified),
              "changes": {
                "topColor": "hex code or 'current'",
                "bottomColor": "hex code or 'current'",
                "upperHasSplatter": true/false (ONLY include if user specifically requests speckle/splatter/dots),
                "soleHasSplatter": true/false (ONLY include if user specifically requests speckle/splatter/dots)
              }
            }

            2. IMAGE GENERATION RULES:
               - Generate an image ONLY for: "pattern", "print", "design", "texture", "camo", "galaxy", "marble", "wood", "stripes", "dots", "floral", "geometric", "abstract", "animal print", "tie-dye", "waves", "chevron", "plaid", "checkered", or any visual pattern request
               
               - ABSOLUTELY CRITICAL: When generating images, create ONLY seamless, tileable texture patterns
               - DO NOT generate pictures of shoes, sneakers, or footwear
               - DO NOT generate 3D objects or realistic shoe images
               - Generate HIGH-RESOLUTION, DETAILED, FLAT, 2D repeating patterns that look like fabric or material textures
               - The pattern should tile perfectly when repeated (seamless edges)
               - Think of it like wallpaper or fabric swatches - flat patterns that repeat infinitely
               - Make textures VIBRANT, HIGH-CONTRAST, and DETAILED with rich colors and sharp details
               - Avoid washed-out, faded, or low-contrast patterns
               - Create textures that will look crisp and clear when applied to 3D surfaces

            3. SPECKLE/SPLATTER HANDLING:
               - ONLY set upperHasSplatter or soleHasSplatter to true if user explicitly asks for: "speckle", "splatter", "dots", "spots", "paint splatter", "speckled", or similar terms
               - DO NOT add speckle/splatter for texture patterns, colors, or other requests
               - When generating textures/patterns, do NOT automatically add speckle effects
               - If user asks to remove speckle/splatter, set the appropriate field to false

            4. PART-SPECIFIC REQUESTS:
               - When user specifies different treatments for different parts (e.g., "USA pattern top, solid red bottom"), handle each part separately
               - Set targetPart to the part getting the texture/pattern
               - Set clearTextures to only the parts being modified
               - Update colors for parts specified as solid colors

            5. COLOR HANDLING:
               - For solid color requests, update topColor/bottomColor and set clearTextures for that part without generating image
               - If changing from texture back to color, set clearTextures to clear only the specified part's texture

            6. FOLLOW-UP REQUESTS:
               - Always consider current state when processing requests
               - Replace existing patterns with new ones when requested
               - Clear patterns when user asks for solid colors`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseParts = response.candidates?.[0].content.parts || [];

      let parsedPlan: any = null;
      let imageDataUrl: string | null = null;
      let combinedText = '';

      for (const part of responseParts) {
        if (part.text) {
          combinedText += part.text;
        } else if ('inlineData' in part && part.inlineData) {
          const { mimeType, data } = part.inlineData;
          imageDataUrl = `data:${mimeType};base64,${data}`;
        }
      }

      try {
        const jsonStringMatch = combinedText.match(/\{[\s\S]*\}/);
        if (jsonStringMatch) {
          parsedPlan = JSON.parse(jsonStringMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse JSON from combined text:", combinedText);
        if (imageDataUrl) {
          parsedPlan = {
            message: "I've generated a texture pattern for your shoe!",
            targetPart: "upper",
            changes: {}
          };
        }
      }

      if (!parsedPlan) {
        throw new Error("AI response did not include a valid JSON plan.");
      }

      // Add AI response to chat messages
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: parsedPlan.message,
        isUser: false,
        timestamp: new Date()
      }]);

      // Apply changes to the shoe
      if (parsedPlan.clearTextures && parsedPlan.clearTextures !== 'none') {
        if (parsedPlan.clearTextures === 'upper' || parsedPlan.clearTextures === 'both') {
          onUpperTextureChange(null);
        }
        if (parsedPlan.clearTextures === 'sole' || parsedPlan.clearTextures === 'both') {
          onSoleTextureChange(null);
        }
      }

      if (parsedPlan.changes) {
        if (parsedPlan.changes.topColor && parsedPlan.changes.topColor !== 'current') onTopColorChange(parsedPlan.changes.topColor);
        if (parsedPlan.changes.bottomColor && parsedPlan.changes.bottomColor !== 'current') onBottomColorChange(parsedPlan.changes.bottomColor);
        if (typeof parsedPlan.changes.upperHasSplatter === 'boolean') onUpperSplatterToggle(parsedPlan.changes.upperHasSplatter);
        if (typeof parsedPlan.changes.soleHasSplatter === 'boolean') onSoleSplatterToggle(parsedPlan.changes.soleHasSplatter);
      }

      if (imageDataUrl && parsedPlan.targetPart) {
        console.log('Applying texture to:', parsedPlan.targetPart, 'Image size:', imageDataUrl.length);
        if (parsedPlan.targetPart === 'upper' || parsedPlan.targetPart === 'both') {
          onUpperTextureChange(imageDataUrl);
        }
        if (parsedPlan.targetPart === 'sole' || parsedPlan.targetPart === 'both') {
          onSoleTextureChange(imageDataUrl);
        }
      }

      // Show AI response for a few seconds
      setAiResponseVisible(true);
      setTimeout(() => {
        setAiResponseVisible(false);
      }, 5000);

    } catch (error) {
      console.error('AI processing error:', error);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble with that request. Please try again.',
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsAiProcessing(false);
      setAiInputMessage('');

      // Close AI chat input after processing
      setTimeout(() => {
        setIsAIChatActive(false);
      }, 2000);
    }
  };

  // Load school data
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const response = await fetch('/schools/filtered_schools_with_normalized_hex.json');
        const schoolData = await response.json();
        setSchools(schoolData);
      } catch (error) {
        console.error('Failed to load school data:', error);
      }
    };
    loadSchools();
  }, []);

  // Track height changes using ResizeObserver
  const customizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customizerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        onHeightChange(height);
      }
    });

    resizeObserver.observe(customizerRef.current);

    // Initial height measurement with a small delay to ensure DOM is ready
    setTimeout(() => {
      if (customizerRef.current) {
        const initialHeight = customizerRef.current.offsetHeight;
        onHeightChange(initialHeight);
      }
    }, 100);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onHeightChange]);

  // Handle school selection and actions
  const handleSchoolSelect = (school: any) => {
    setSelectedSchool(school);
  };

  const handleApplySchoolColors = (school: any) => {
    if (school.Colors && school.Colors.length > 0) {
      // Apply first color to upper, second to sole (or first to both if only one color)
      const colors = school.Colors;
      onTopColorChange(colors[0].hex);
      onBottomColorChange(colors.length > 1 ? colors[1].hex : colors[0].hex);

      // Clear any existing textures when applying school colors
      onUpperTextureChange(null);
      onSoleTextureChange(null);
    }
  };

  const handleApplySchoolLogo = async (school: any) => {
    if (school.Logo) {
      console.log('Applying school logo:', school["School Name"], school.Logo);

      // Create a proxy function to handle CORS issues
      const loadImageWithProxy = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            // Set canvas size to maintain aspect ratio
            const size = 256;
            canvas.width = size;
            canvas.height = size;

            // Keep transparent background for die-cut effect
            ctx.clearRect(0, 0, size, size);

            // Calculate dimensions to maintain aspect ratio
            const aspectRatio = img.width / img.height;
            let drawWidth = size;
            let drawHeight = size;
            let offsetX = 0;
            let offsetY = 0;

            if (aspectRatio > 1) {
              drawHeight = size / aspectRatio;
              offsetY = (size - drawHeight) / 2;
            } else {
              drawWidth = size * aspectRatio;
              offsetX = (size - drawWidth) / 2;
            }

            // Draw the image centered
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          };

          img.onerror = () => {
            reject(new Error('Failed to load image'));
          };

          // Try multiple approaches to load the image
          img.src = url;
        });
      };

      try {
        // First, try to load the image directly
        const dataUrl = await loadImageWithProxy(school.Logo);
        onLogoChange(dataUrl);
        console.log('School logo loaded and applied successfully');
      } catch (error) {
        console.log('Direct load failed, trying with CORS proxy...');

        try {
          // Try with a CORS proxy service
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(school.Logo)}`;
          const dataUrl = await loadImageWithProxy(proxyUrl);
          onLogoChange(dataUrl);
          console.log('School logo loaded via proxy and applied successfully');
        } catch (proxyError) {
          console.log('Proxy load failed, trying fetch approach...');

          try {
            // Try fetching as blob and creating object URL
            const response = await fetch(school.Logo, { mode: 'no-cors' });
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const dataUrl = await loadImageWithProxy(objectUrl);
            onLogoChange(dataUrl);
            URL.revokeObjectURL(objectUrl);
            console.log('School logo loaded via blob and applied successfully');
          } catch (blobError) {
            console.error('All loading methods failed, using original URL as fallback:', blobError);
            // Final fallback - just use the original URL
            onLogoChange(school.Logo);
          }
        }
      }
    }
  };

  const renderStepContent = () => {
    const currentStepData = STEPS[currentStep];

    switch (currentStepData.id) {
      case 'colors':
        return (
          <div className="space-y-4">
            <div className="text-center">

            </div>


          </div>
        );

      case 'effects':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className={`text-lg font-semibold mb-2 transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                Add Effects
              </h3>
              <p className={`text-sm transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                Make your shoe unique with paint splatter
              </p>
            </div>

            <div className={`p-4 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-black/20 border-white/20' : 'bg-secondary/20 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Droplets className={`w-5 h-5 transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`} />
                  <span className={`font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>Paint Splatter</span>
                </div>
                <Button
                  variant={getCurrentSplatter() ? "default" : "outline"}
                  size="sm"
                  onClick={() => getCurrentSplatterToggle()(!getCurrentSplatter())}
                  className={`transition-all duration-300 ${isDarkMode && !getCurrentSplatter()
                    ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white'
                    : ''
                    }`}
                >
                  {getCurrentSplatter() ? 'ON' : 'OFF'}
                </Button>
              </div>

              {getCurrentSplatter() && (
                <div className="space-y-4">
                  <div>
                    <p className={`text-sm mb-3 transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>Splatter Color:</p>
                    <div className="flex gap-2 flex-wrap">
                      {NATIONAL_PARK_COLORS.slice(0, 8).map(c => (
                        <Button
                          key={c.value}
                          variant="outline"
                          size="sm"
                          className={`w-10 h-10 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${getCurrentSplatterColor() === c.value ? 'border-primary ring-2 ring-primary/20' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                            }`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => getCurrentSplatterColorChanger()(c.value)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={`pt-3 border-t transition-all duration-300 ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>Intensity</span>
                      <span className={`text-sm font-mono px-2 py-1 rounded transition-all duration-300 ${isDarkMode ? 'bg-black/80 text-white/90' : 'bg-secondary text-foreground'}`}>
                        {getCurrentPaintDensity()}%
                      </span>
                    </div>
                    <Slider
                      value={[getCurrentPaintDensity()]}
                      onValueChange={v => getCurrentPaintDensityChanger()(v[0])}
                      min={100}
                      max={500}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'schools':
        return (
          <SchoolSelector
            schools={schools}
            selectedSchool={selectedSchool}
            onSchoolSelect={handleSchoolSelect}
            onApplyColors={handleApplySchoolColors}
            onApplyLogo={handleApplySchoolLogo}
            isDarkMode={isDarkMode}
          />
        );

      case 'logo':
        return (
          <div className="space-y-6">
            <div className="text-center">

            </div>

            <LogoUploader
              onLogoChange={onLogoChange}
              currentLogo={logoUrl}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-4">
      {/* AI Chat Messages Bubble */}
      {aiResponseVisible && chatMessages.length > 0 && (
        <div className="flex justify-center mb-3">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`max-w-md px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${isDarkMode
              ? 'bg-black/90 text-white/90 border border-white/20'
              : 'bg-white text-gray-900 border border-gray-200'
              }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm mt-0.5 transition-all duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-gray-50'
                }`}>
                <Bot className={`w-4 h-4 transition-all duration-300 ${isDarkMode ? 'text-white/80' : 'text-gray-600'
                  }`} />
              </div>
              <div>
                <p className="text-sm">{chatMessages[chatMessages.length - 1]?.isUser ? 'Thinking...' : chatMessages[chatMessages.length - 1]?.text}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div ref={customizerRef} className="space-y-3">
        {/* Tabs - Outside and Centered */}
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            {isAIChatActive ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`flex w-full max-w-md rounded-full p-1 relative backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-black/90 border border-white/20' : 'bg-white/95 border border-gray-200'}`}
              >
                <div className="flex items-center w-full px-3 py-1">
                  <motion.div
                    initial={{ rotate: -30, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      viewBox="0 0 9.86 8.28"
                      style={{
                        filter: `drop-shadow(0 0 2px ${isDarkMode ? 'rgba(0, 100, 255, 0.7)' : 'rgba(0, 100, 255, 0.5)'})`
                      }}
                    >
                      <motion.path
                        d="M.25.26c.27.11.53.21.8.31.83.31,1.65.62,2.48.93.21.08.41.19.56.36.22.24.31.52.31.84v5.33s-.03,0-.04-.01c-.85-.35-1.71-.7-2.55-1.07-.9-.4-1.4-1.1-1.54-2.07,0-.09-.02-.18-.02-.28V.32s0-.04,0-.06Z"
                        stroke={isDarkMode ? "#4d8bf9" : "#2563eb"}
                        strokeWidth="0.5"
                        strokeLinejoin="round"
                        fill="none"
                        animate={{
                          stroke: isDarkMode
                            ? ["#4d8bf9", "#00c2ff", "#4d8bf9"]
                            : ["#2563eb", "#0ea5e9", "#2563eb"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.path
                        d="M5.45,8.03V2.75c0-.61.28-1.02.85-1.24.92-.35,1.84-.69,2.76-1.04.16-.06.31-.12.47-.19.02,0,.05-.02.08-.03v4.29c0,1.09-.62,2.01-1.63,2.43-.81.34-1.63.68-2.44,1.02-.02.01-.05.02-.08.03h0Z"
                        stroke={isDarkMode ? "#4d8bf9" : "#2563eb"}
                        strokeWidth="0.5"
                        strokeLinejoin="round"
                        fill="none"
                        animate={{
                          stroke: isDarkMode
                            ? ["#4d8bf9", "#00c2ff", "#4d8bf9"]
                            : ["#2563eb", "#0ea5e9", "#2563eb"]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </svg>
                  </motion.div>
                  <input
                    type="text"
                    value={aiInputMessage}
                    onChange={(e) => setAiInputMessage(e.target.value)}
                    placeholder="Describe your shoe design..."
                    disabled={isAiProcessing}
                    className={`flex-1 bg-transparent focus:outline-none text-sm ${isDarkMode
                      ? 'text-white placeholder-white/60'
                      : 'text-gray-900 placeholder-gray-400'
                      }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && aiInputMessage.trim()) {
                        e.preventDefault();
                        handleAICommand(aiInputMessage);
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    {isAiProcessing ? (
                      <div className="flex items-center space-x-1 mr-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/70' : 'bg-gray-500'}`}
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/70' : 'bg-gray-500'}`}
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-white/70' : 'bg-gray-500'}`}
                        />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!aiInputMessage.trim()}
                        className={`h-8 w-8 p-0 rounded-full transition-all duration-300 ${isDarkMode
                          ? 'hover:bg-white/10 text-white/80 hover:text-white'
                          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                          }`}
                        onClick={() => {
                          if (aiInputMessage.trim()) {
                            handleAICommand(aiInputMessage);
                          }
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAIChatActive(false)}
                      className={`h-8 w-8 p-0 rounded-full transition-all duration-300 ${isDarkMode
                        ? 'hover:bg-white/10 text-white/80 hover:text-white'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className={`flex rounded-3xl p-1 relative backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-black/90 border border-white/20' : 'bg-gray-100 border border-gray-200'}`}
              >
                {/* Dynamic background for active tab */}
                <div
                  className={`absolute top-1 bottom-1 ml-1 rounded-full shadow-sm transition-all duration-300 ease-out ${isDarkMode ? 'bg-white/20' : 'bg-white'}`}
                  style={{
                    width: 'calc(20% - 2px)',
                    left: `calc(${activeTab === 'upper' ? '0' :
                      activeTab === 'sole' ? '20' :
                        activeTab === 'laces' ? '40' :
                          activeTab === 'logos' ? '60' : '0'
                      }% + 1px)`
                  }}
                />
                <button onClick={() => handleTabChange('upper')} className={`relative z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 min-w-[60px] ${activeTab === 'upper' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Upper
                </button>
                <button onClick={() => handleTabChange('sole')} className={`relative z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 min-w-[60px] ${activeTab === 'sole' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Sole
                </button>
                <button onClick={() => handleTabChange('laces')} className={`relative z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 min-w-[60px] ${activeTab === 'laces' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Laces
                </button>
                <button onClick={() => handleTabChange('logos')} className={`relative z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm font-medium rounded-md transition-all duration-300 min-w-[60px] ${activeTab === 'logos' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Logos
                </button>
                <button
                  onClick={() => setIsAIChatActive(true)}
                  className={`relative z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 min-w-[60px] flex items-center justify-center ${isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <motion.div
                    initial={{ rotate: -30, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      viewBox="0 0 9.86 8.28"
                      style={{
                        filter: `drop-shadow(0 0 2px ${isDarkMode ? 'rgba(0, 100, 255, 0.7)' : 'rgba(0, 100, 255, 0.5)'})`
                      }}
                    >
                      <motion.path
                        d="M.25.26c.27.11.53.21.8.31.83.31,1.65.62,2.48.93.21.08.41.19.56.36.22.24.31.52.31.84v5.33s-.03,0-.04-.01c-.85-.35-1.71-.7-2.55-1.07-.9-.4-1.4-1.1-1.54-2.07,0-.09-.02-.18-.02-.28V.32s0-.04,0-.06Z"
                        stroke={isDarkMode ? "#4d8bf9" : "#2563eb"}
                        strokeWidth="0.5"
                        strokeLinejoin="round"
                        fill="none"
                        animate={{
                          stroke: isDarkMode
                            ? ["#4d8bf9", "#00c2ff", "#4d8bf9"]
                            : ["#2563eb", "#0ea5e9", "#2563eb"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.path
                        d="M5.45,8.03V2.75c0-.61.28-1.02.85-1.24.92-.35,1.84-.69,2.76-1.04.16-.06.31-.12.47-.19.02,0,.05-.02.08-.03v4.29c0,1.09-.62,2.01-1.63,2.43-.81.34-1.63.68-2.44,1.02-.02.01-.05.02-.08.03h0Z"
                        stroke={isDarkMode ? "#4d8bf9" : "#2563eb"}
                        strokeWidth="0.5"
                        strokeLinejoin="round"
                        fill="none"
                        animate={{
                          stroke: isDarkMode
                            ? ["#4d8bf9", "#00c2ff", "#4d8bf9"]
                            : ["#2563eb", "#0ea5e9", "#2563eb"]
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                      />
                    </svg>
                  </motion.div> <p className='text-[8px] font-black pl-1.5 pr-1.5 -ml-1 -pt-1 -ml-2 rounded-sm bg-white/40' > AI </p>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Control Card */}
        <div className={`backdrop-blur-sm rounded-[20px] transition-all duration-300 ${isDarkMode ? 'bg-black/90 border border-white/20' : 'bg-white/95 border border-gray-200'}`}>
          {/* Main Control Bar */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-4">

              {/* Left: Title */}
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <h2 className={`text-base sm:text-lg font-bold transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                    Customize
                  </h2>
                </div>
              </div>

              {/* Center: Color Palette */}
              <div className="flex-1 flex justify-center">
                {/* Desktop: Scrollable Color Palette with Arrows and Fade */}
                <div className="hidden md:flex items-center relative w-full max-w-xs sm:max-sm md:max-w-lg ml-10 lg:max-w-[595px] xl:max-w-[610px] 2xl:max-w-2xl">
                  {/* Left Scroll Arrow */}

                  {/* Paint Splatter Toggle with Popover - Only show for upper and sole */}
                  {(activeTab === 'upper' || activeTab === 'sole') && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={`w-10 h-10 p-0 border-2 relative rounded-full transition-all duration-300 ${getCurrentSplatter()
                            ? 'bg-primary/10 border-gray-300 hover:bg-primary/20'
                            : isDarkMode
                              ? 'border-white/30 hover:bg-white/10'
                              : 'hover:bg-gray-100'
                            }`}
                          onClick={(e) => {
                            // If splatter is off, turn it on when clicking the button
                            if (!getCurrentSplatter()) {
                              getCurrentSplatterToggle()(true);
                            }
                          }}
                        >
                          <img
                            src="/splatter.svg"
                            alt="Paint Splatter"
                            className={`w-10 h-10 transition-all duration-300 ${getCurrentSplatter()
                              ? 'text-primary'
                              : isDarkMode
                                ? 'text-white/70'
                                : 'text-gray-600'
                              }`}
                            style={{
                              filter: getCurrentSplatter()
                                ? `drop-shadow(0 0 2px ${isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'})`
                                : 'none',
                              color: getCurrentSplatterColor() // This will tint the SVG if it uses currentColor
                            }}
                          />
                          {getCurrentSplatter() && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border border-white"></span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className={`w-64 p-4 transition-all duration-300 ${isDarkMode
                          ? 'bg-black/95 border-white/20 text-white/90'
                          : 'bg-white border-gray-200'
                          }`}
                        sideOffset={5}
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src="/splatter.svg" alt="Paint Splatter" className={`w-4 h-4 transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`} />
                              <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                                Paint Splatter
                              </span>
                            </div>
                            <Button
                              variant={getCurrentSplatter() ? "default" : "outline"}
                              size="sm"
                              onClick={() => getCurrentSplatterToggle()(!getCurrentSplatter())}
                              className={`h-7 px-2 text-xs transition-all duration-300 ${isDarkMode && !getCurrentSplatter()
                                ? 'border-white/30 text-white/80 hover:bg-white/10 hover:text-white'
                                : ''
                                }`}
                            >
                              {getCurrentSplatter() ? 'ON' : 'OFF'}
                            </Button>
                          </div>

                          <div className={getCurrentSplatter() ? "" : "opacity-50 pointer-events-none"}>
                            <div>

                              <div className="flex gap-1.5 pb-20 flex-wrap">
                                {NATIONAL_PARK_COLORS.slice(0, 8).map(c => (
                                  <Button
                                    key={c.value}
                                    variant="outline"
                                    size="sm"
                                    className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${getCurrentSplatterColor() === c.value
                                      ? 'border-primary ring-2 ring-primary/20'
                                      : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                                      }`}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => getCurrentSplatterColorChanger()(c.value)}
                                    disabled={!getCurrentSplatter()}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className={`pt-3 border-t transition-all duration-300 ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                                  Intensity
                                </span>
                                <span className={`text-xs font-mono px-2 py-0.5 rounded transition-all duration-300 ${isDarkMode ? 'bg-black/80 text-white/90' : 'bg-secondary text-foreground'
                                  }`}>
                                  {getCurrentPaintDensity()}%
                                </span>
                              </div>
                              <Slider
                                value={[getCurrentPaintDensity()]}
                                onValueChange={v => getCurrentPaintDensityChanger()(v[0])}
                                min={500}
                                max={1000}
                                step={100}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}




                  {/* Color Palette Container with Fade Mask */}
                  <div
                    className="relative flex-1 mx-2 overflow-hidden"
                    style={{
                      maskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)'
                    }}
                  >
                    {/* Scrollable Color Container */}
                    <div
                      id="color-palette-container"
                      className="flex items-center gap-2 overflow-x-auto py-2 px-4"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                      }}
                    >
                      <style jsx>{`
                        #color-palette-container::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      {NATIONAL_PARK_COLORS.map(c => (
                        <div key={c.value} className="relative group">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-10 h-10 p-0 border-2 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ${getCurrentColor() === c.value ? 'border-primary ring-2 ring-primary/20 scale-110' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                              }`}
                            style={{ backgroundColor: c.value }}
                            onClick={() => getCurrentColorChanger()(c.value)}
                          />
                          {/* Custom Tooltip */}
                          <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap ${isDarkMode ? 'bg-black/90 text-white border border-white/20' : 'bg-gray-900 text-white'
                            }`}>
                            {c.name}
                            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${isDarkMode ? 'border-t-black/90' : 'border-t-gray-900'
                              }`}></div>
                          </div>
                        </div>
                      ))}

                      {/* Custom Color Picker */}
                      <div className="relative group">
                        <input
                          type="color"
                          value={getCurrentColor()}
                          onChange={e => getCurrentColorChanger()(e.target.value)}
                          className={`
                            w-10 h-10 p-0 cursor-pointer border-2 border-white flex-shrink-0
                            rounded-full appearance-none overflow-hidden
                            [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                            [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-none
                            hover:scale-110 transition-all duration-300
                          `}
                        />
                        {/* Custom Color Tooltip */}
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap ${isDarkMode ? 'bg-black/90 text-white border border-white/20' : 'bg-gray-900 text-white'
                          }`}>
                          Custom Color
                          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${isDarkMode ? 'border-t-black/90' : 'border-t-gray-900'
                            }`}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Scroll Arrow */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute hover:bg-gray-300 top-2 -right-9 z-10 h-10 w-10 p-0 rounded-full transition-all duration-300 ${isDarkMode
                      ? 'border-none hover:text-white  '
                      : 'text-gray-600 hover:text-gray-900 '
                      }`}
                    onClick={() => {
                      const container = document.getElementById('color-palette-container');
                      if (container) {
                        container.scrollBy({ left: 200, behavior: 'smooth' });
                      }
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mobile: Compact Grid Layout */}
                <div className="md:hidden w-full">
                  <div className="grid grid-cols-6 gap-1.5 max-w-[200px] mx-auto">
                    {NATIONAL_PARK_COLORS.slice(0, 12).map(c => (
                      <div key={c.value} className="relative group">
                        <Button
                          variant="outline"
                          size="sm"
                          className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-110 ${getCurrentColor() === c.value ? 'border-primary ring-1 ring-primary/20 scale-110' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                            }`}
                          style={{ backgroundColor: c.value }}
                          onClick={() => getCurrentColorChanger()(c.value)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Mobile Custom Color Picker - Separate Row */}
                  <div className="flex justify-center mt-2">
                    <input
                      type="color"
                      value={getCurrentColor()}
                      onChange={e => getCurrentColorChanger()(e.target.value)}
                      title="Custom Color"
                      className={`
                        w-8 h-8 p-0 cursor-pointer border-2 border-white
                        rounded-full appearance-none overflow-hidden
                        [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                        [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-none
                        hover:scale-110 transition-all duration-300
                      `}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Effects & Actions */}
              <div className="flex items-center gap-1 sm:gap-2">

                {/* Quick Actions */}
                <div className="flex items-center gap-1 sm:gap-2">

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (isOpen && currentStep === 2) {
                        setIsOpen(false);
                      } else {
                        setCurrentStep(2);
                        setIsOpen(true);
                      }
                    }}
                    className={`w-12 h-12 bg-white/20  p-0 flex items-center hover:bg-gray-200 justify-center transition-all duration-300 ${isDarkMode ? 'border-white/30 border-white/20 border text-white/80 hover:bg-white/10 hover:text-white' : ''
                      }`}
                  >
                    <img src="public/teams.svg" alt="Schools" className="w-8 h-8 grayscale" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (isOpen && currentStep === 3) {
                        setIsOpen(false);
                      } else {
                        setCurrentStep(3);
                        setIsOpen(true);
                      }
                    }}
                    className={`w-12 h-12 p-0 bg-white/20 flex items-center hover:bg-gray-200 justify-center transition-all duration-300 ${isDarkMode ? 'border-white/20 border text-white/80 hover:bg-white/10 hover:text-white' : ''
                      }`}
                  >
                    <img src="public/logo.svg" alt="Logo" className="w-8 h-8" />
                  </Button>
                </div>

                {/* Expand/Collapse */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(!isOpen)}
                  className={`h-8 w-8 p-0 transition-all duration-300 ${isDarkMode
                    ? 'hover:bg-white/10 text-white/80 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Expanded Content Area */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 80, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0.0, 0.2, 1],
                  opacity: { duration: 0.3 }
                }}
                className="overflow-hidden"
              >
                <div className={`px-4 pb-4 border-t transition-all duration-300 ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
                  <div className="pt-4 h-full overflow-y-auto">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderStepContent()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};