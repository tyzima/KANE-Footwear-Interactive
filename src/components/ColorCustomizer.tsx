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
  // Lace colors (single color for both left and right)
  laceColor?: string;
  onLaceColorChange?: (color: string) => void;
  // Logo colors - now supporting 3 separate colors
  logoColor1?: string; // Blue parts
  logoColor2?: string; // Black parts  
  logoColor3?: string; // Red parts
  onLogoColor1Change?: (color: string) => void;
  onLogoColor2Change?: (color: string) => void;
  onLogoColor3Change?: (color: string) => void;
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
  // Circle logo props (for SVG texture)
  circleLogoUrl?: string | null;
  onCircleLogoChange?: (logoUrl: string | null) => void;
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
  // Lace colors with defaults (single color for both left and right)
  laceColor = '#FFFFFF',
  onLaceColorChange = () => { },
  // Logo colors with defaults
  logoColor1 = '#2048FF', // Blue parts (Royal Blue)
  logoColor2 = '#000000', // Black parts
  logoColor3 = '#C01030', // Red parts (Crimson)
  onLogoColor1Change = () => { },
  onLogoColor2Change = () => { },
  onLogoColor3Change = () => { },
  // Logo props with defaults
  logoUrl = null,
  onLogoChange = () => { },
  // Circle logo props with defaults
  circleLogoUrl = null,
  onCircleLogoChange = () => { },
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
  const fileInputRef = useRef<HTMLInputElement>(null);


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
      case 'logos': return logoColor1; // For logos, we'll show a special interface
      default: return topColor;
    }
  };

  const getCurrentColorChanger = () => {
    switch (activeTab) {
      case 'upper': return (color: string) => {
        onTopColorChange(color);
        // Clear AI texture when manually changing color
        if (upperTexture) {
          onUpperTextureChange(null);
        }
      };
      case 'sole': return (color: string) => {
        onBottomColorChange(color);
        // Clear AI texture when manually changing color
        if (soleTexture) {
          onSoleTextureChange(null);
        }
      };
      case 'laces': return onLaceColorChange;
      case 'logos': return onLogoColor1Change; // For logos, we'll show a special interface
      default: return (color: string) => {
        onTopColorChange(color);
        // Clear AI texture when manually changing color
        if (upperTexture) {
          onUpperTextureChange(null);
        }
      };
    }
  };

  const PLACEHOLDERS = [
    "Describe your shoe design...",
    "Add splatter to the sole...",
    "Try red on black gradient...",
    "Make it inspired by nature...",
    "Use vintage hockey laces..."
  ];

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


  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = useRef(50);

  useEffect(() => {
    const current = PLACEHOLDERS[placeholderIndex];

    if (!isDeleting && charIndex < current.length) {
      setTimeout(() => {
        setDisplayText(current.slice(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
      }, typingSpeed.current);
    } else if (isDeleting && charIndex > 0) {
      setTimeout(() => {
        setDisplayText(current.slice(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
      }, typingSpeed.current);
    } else {
      setTimeout(() => {
        setIsDeleting((prev) => !prev);
        if (!isDeleting) {
          setTimeout(() => setIsDeleting(true), 1000);
        } else {
          setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        }
      }, 1000);
    }
  }, [charIndex, isDeleting, placeholderIndex]);

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
      
      // Also disable gradients and splatters to ensure clean solid colors
      onUpperGradientToggle(false);
      onSoleGradientToggle(false);
      onUpperSplatterToggle(false);
      onSoleSplatterToggle(false);
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
                      {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
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
              ? 'bg-black/40 text-white/90 border border-white/20'
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
                className={`flex w-full max-w-md rounded-full p-1 relative backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-black/40 border border-white/20' : 'bg-white/95 border border-gray-200'}`}
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
                    placeholder={displayText}
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






                        <Send className="w-4 h-4 rotate-45 opacity-50" />




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
                className={`flex rounded-3xl p-1 relative backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-black/40 border border-white/20' : 'bg-gray-100 border border-gray-200'}`}
              >
                {/* Dynamic background for active tab */}
                <div
                  className={`absolute top-1 bottom-1 ml-1 rounded-full shadow-sm transition-all duration-300 ease-out ${isDarkMode ? 'bg-white/20' : 'bg-white'}`}
                  style={{
                    width: 'calc(20% - 2px)',
                    left: `calc(${activeTab === 'upper' ? '0' :
                      activeTab === 'sole' ? '20' :
                        activeTab === 'laces' ? '39' :
                          activeTab === 'logos' ? '59' : '0'
                      }% + 1px)`
                  }}
                />
                <button onClick={() => handleTabChange('upper')} className={`relative uppercase font-blender font-bold z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm rounded-md transition-all duration-300 min-w-[60px] ${activeTab === 'upper' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Upper
                </button>
                <button onClick={() => handleTabChange('sole')} className={`relative uppercase font-blender z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm font-bold rounded-md transition-all duration-300 min-w-[60px] ${activeTab === 'sole' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Sole
                </button>
                <button onClick={() => handleTabChange('laces')} className={`relative uppercase font-blender z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm font-bold rounded-md transition-all duration-300 min-w-[60px] ${activeTab === 'laces' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
                  Laces
                </button>
                <button onClick={() => handleTabChange('logos')} className={`relative uppercase font-blender z-10 flex-1 px-3 sm:px-4 md:px-5 py-2 text-sm font-bold rounded-md transition-all duration-300 min-w-[60px] ${activeTab === 'logos' ? (isDarkMode ? 'text-white' : 'text-primary') : (isDarkMode ? 'text-white/70 hover:text-white/90' : 'text-muted-foreground hover:text-foreground')}`}>
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
                  </motion.div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Control Card */}
        <div className={`backdrop-blur-sm max-w-6xl mx-auto min-h-[80px] rounded-[20px] transition-all duration-300 ${isDarkMode ? 'bg-black/40 border border-white/20' : 'bg-white/95 border border-gray-200'}`}>
          {/* Main Control Bar */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-4">

              {/* Left: Title */}
              <div className="flex items-center hidden lg:block">
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
                          className={`w-10 h-10 p-0 border-2 relative rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 ${getCurrentSplatter()
                              ? 'bg-primary/10 border-gray-300 hover:bg-primary/20'
                              : isDarkMode
                                ? 'border-white/30 hover:bg-white/10'
                                : 'hover:bg-gray-100'
                            }`}
                          onClick={() => {
                            if (!getCurrentSplatter()) {
                              getCurrentSplatterToggle()(true);
                            }
                          }}
                          style={getCurrentSplatter() ? { color: getCurrentSplatterColor() } : {}}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            stroke="none"
                            className="w-full h-full  scale-[2.2] origin-center "
                            preserveAspectRatio="xMidYMid slice"
                          >
                            <g transform="translate(1 2)">
                              <path d="M3.77,6.82c.41,0,.75-.34.75-.75s-.34-.75-.75-.75-.75.34-.75.75.34.75.75.75Z" />
                              <path d="M7.52,4.32c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5,1.5.67,1.5,1.5,1.5Z" />
                              <path d="M11.02,5.32c.28,0,.5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5Z" />
                              <path d="M19.28,4.17c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5,1.5.67,1.5,1.5,1.5Z" />
                              <path d="M18.02,10.32c.55,0,1-.45,1-1s-.45-1-1-1-1,.45-1,1,.45,1,1,1Z" />
                              <path d="M19.52,13.32c.62,0,1.12-.5,1.12-1.12s-.5-1.12-1.12-1.12-1.12.5-1.12,1.12.5,1.12,1.12,1.12Z" />
                              <path d="M19.28,18.32c.55,0,1-.45,1-1s-.45-1-1-1-1,.45-1,1,.45,1,1,1Z" />
                              <path d="M15,20.7c.59,0,1.08-.48,1.08-1.08s-.48-1.08-1.08-1.08-1.08.48-1.08,1.08.48,1.08,1.08,1.08Z" />
                              <path d="M10.34,13.57c.55,0,1-.45,1-1s-.45-1-1-1-1,.45-1,1,.45,1,1,1Z" />
                              <path d="M6.98,18.82c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5,1.5.67,1.5,1.5,1.5Z" />
                              <path d="M2.02,15.32c.55,0,1-.45,1-1s-.45-1-1-1-1,.45-1,1,.45,1,1,1Z" />
                              <path d="M2.52,11.32c.83,0,1.5-.67,1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5,1.5.67,1.5,1.5,1.5Z" />
                              <path d="M6.98,9.82c.3,0,.54-.24.54-.54s-.24-.54-.54-.54-.54.24-.54.54.24.54.54.54Z" />
                              <path d="M11.69,9.21c.59,0,1.07-.48,1.07-1.07s-.48-1.07-1.07-1.07-1.07.48-1.07,1.07.48,1.07,1.07,1.07Z" />
                              <path d="M6.44,14c.24,0,.43-.19.43-.43s-.19-.43-.43-.43-.43.19-.43.43.19.43.43.43Z" />
                              <path d="M13.93,13.97c.46,0,.82-.37.82-.82s-.37-.82-.82-.82-.82.37-.82.82.37.82.82.82Z" />
                              <path d="M20.64,7.05c.19,0,.35-.16.35-.35s-.16-.35-.35-.35-.35.16-.35.35.16.35.35.35Z" />
                              <path d="M20.17,16.82c-.06.18.04.38.22.44s.38-.04.44-.22-.04-.38-.22-.44-.38.04-.44.22Z" />
                              <path d="M13.3,16.21c-.06.18.04.38.22.44s.38-.04.44-.22-.04-.38-.22-.44-.38.04-.44.22Z" />
                              <path d="M.68,15.82c-.19-.02-.36.11-.39.3s.11.36.3.39.36-.11.39-.3-.11-.36-.3-.39Z" />
                            </g>
                          </svg>

                          {getCurrentSplatter() && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border border-white" />
                          )}
                        </Button>


                      </PopoverTrigger>
                      <PopoverContent
                        className={`w-64 p-4 transition-all duration-300 ${isDarkMode
                          ? 'bg-black/40 border-white/20 text-white/90'
                          : 'bg-white border-gray-200'
                          }`}
                        sideOffset={5}
                      >
                        <div className="space-y-4 ">
                          <div className="flex items-center justify-between ">
                            <div className="flex items-center gap-2">
                              {/* Inline SVG for splatter within Popover as well */}
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`w-4 h-4 transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}
                                style={{ color: getCurrentSplatterColor() }} // Apply color directly here too
                              >
                                {/* Replace with actual paths from splatter.svg */}
                                <circle cx="6" cy="5" r="1.2" />
                                {/* Larger central splatter */}
                                <circle cx="6" cy="6" r="1.4" />
                                <circle cx="12" cy="9" r="1.6" />
                                <circle cx="16" cy="13" r="1.3" />
                                <circle cx="10" cy="16" r="1.2" />
                                <circle cx="14" cy="6" r="1.1" />

                                {/* Small splatter extending outward */}
                                <circle cx="2" cy="3" r="0.4" />
                                <circle cx="22" cy="4" r="0.5" />
                                <circle cx="3" cy="10" r="0.6" />
                                <circle cx="20" cy="8" r="0.3" />
                                <circle cx="4" cy="20" r="0.4" />
                                <circle cx="19" cy="19" r="0.6" />
                                <circle cx="8" cy="22" r="0.5" />
                                <circle cx="0.5" cy="15" r="0.3" />
                                <circle cx="23" cy="12" r="0.4" />
                                <circle cx="7" cy="3" r="0.5" />
                                <circle cx="17" cy="2" r="0.4" />
                                <circle cx="21" cy="22" r="0.5" />
                                <circle cx="11" cy="1" r="0.3" />


                              </svg>
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
                                {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
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




                  {/* Logos Tab: Interactive SVG Preview + Color Swatches */}
                  


                  {activeTab === 'logos' ? (
  <div className="flex-1 mx-2">
    <div className="flex items-center justify-between p-2.5">
      {/* Left: SVG Preview */}
      <div className="flex items-center justify-center flex-1">
        <div className={`rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-black/20' : 'bg-white/50'}`}>
          <svg 
            width="240" 
            height="76" 
            viewBox="0 0 465.12 145.92" 
            className="drop-shadow-sm"
          >
            <rect width="465.12" height="145.92" fill="none"/>
            
            {/* Outer Ring - Color 3 */}
            <Popover>
              <PopoverTrigger asChild>
                <path 
                  d="M433.25,40.06h-135.58C285.37,15.77,260.26,0,232.56,0s-52.8,15.77-65.1,40.06H31.88C14.3,40.06,0,54.36,0,71.93s14.3,31.88,31.88,31.88h134.55c11.85,25.54,37.35,42.11,66.13,42.11s54.28-16.57,66.13-42.11h134.55c17.58,0,31.88-14.3,31.88-31.88s-14.3-31.88-31.88-31.88ZM452.12,71.93c0,10.38-8.49,18.88-18.88,18.88h-143.44c-7.62,24.37-30.4,42.11-57.25,42.11s-49.63-17.74-57.25-42.11H31.88c-10.38,0-18.88-8.49-18.88-18.88h0c0-10.38,8.49-18.88,18.88-18.88h144.14c8.23-23.31,30.46-40.06,56.55-40.06s48.32,16.75,56.55,40.06h144.14c10.38,0,18.88,8.49,18.88,18.88h0Z"
                  fill={logoColor2}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </PopoverTrigger>
              <PopoverContent 
                className={`w-56 p-3 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-white/20 text-white/90' : 'bg-white border-gray-200'}`}
                sideOffset={5}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: logoColor2 }}
                    />
                    <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                      Outer Ring
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                      <Button
                        key={c.value}
                        variant="outline"
                        size="sm"
                        className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor2 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => onLogoColor2Change(c.value)}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Inner Ring - Color 2 */}
            <Popover>
              <PopoverTrigger asChild>
                <path 
                  d="M433.25,53.06h-144.14c-8.23-23.31-30.46-40.06-56.55-40.06s-48.32,16.75-56.55,40.06H31.88c-10.38,0-18.88,8.49-18.88,18.88h0c0,10.38,8.49,18.88,18.88,18.88h143.44c7.62,24.37,30.4,42.11,57.25,42.11s49.63-17.74,57.25-42.11h143.44c10.38,0,18.88-8.49,18.88-18.88h0c0-10.38-8.49-18.88-18.88-18.88ZM232.56,122.42c-27.32,0-49.46-22.14-49.46-49.46s22.14-49.46,49.46-49.46,49.46,22.14,49.46,49.46-22.14,49.46-49.46,49.46Z"
                  fill={logoColor3}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              </PopoverTrigger>
              <PopoverContent 
                className={`w-56 p-3 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-white/20 text-white/90' : 'bg-white border-gray-200'}`}
                sideOffset={5}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: logoColor3 }}
                    />
                    <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                      Inner Ring
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                      <Button
                        key={c.value}
                        variant="outline"
                        size="sm"
                        className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor2 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => onLogoColor3Change(c.value)}
                      />
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Center Circle with Image Upload */}
            <defs>
              <clipPath id="centerClip">
                <circle cx="232.56" cy="72.96" r="49.46" />
              </clipPath>
            </defs>
            <g 
              clipPath="url(#centerClip)" 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => fileInputRef.current?.click()}
            >
              {circleLogoUrl ? (
                <g transform="translate(282.06,23.5) scale(-1,1)">
                  <image 
                    href={circleLogoUrl} 
                    x="0" 
                    y="0" 
                    width="98.92" 
                    height="98.92" 
                    preserveAspectRatio="xMidYMid slice" 
                    transform="rotate(-90 49.46 49.46)"
                  />
                </g>
              ) : (
                <rect 
                  x="183.1" 
                  y="23.5" 
                  width="98.92" 
                  height="98.92" 
                  fill={logoColor1}
                />
              )}
            </g>
          </svg>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  if (event.target?.result) {
                    // Create an image to transform
                    const img = new Image();
                    img.onload = () => {
                      // Create canvas for transformation
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d')!;
                      
                      // Set canvas dimensions (swap width/height due to 90° rotation)
                      canvas.width = img.height;
                      canvas.height = img.width;
                      
                      // Apply transformations:
                      // 1. Translate to center
                      ctx.translate(canvas.width / 2, canvas.height / 2);
                      // 2. Rotate 90 degrees counter-clockwise
                      ctx.rotate(Math.PI / 2);
                      // 3. Scale horizontally by -1 to mirror
                      ctx.scale(-1, 1);
                      
                      // Draw the image (centered around origin)
                      ctx.drawImage(img, -img.width / 2, -img.height / 2);
                      
                      // Convert back to data URL
                      const transformedDataUrl = canvas.toDataURL('image/png');
                      onCircleLogoChange(transformedDataUrl);
                    };
                    img.src = event.target.result as string;
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>
      </div>

      {/* Right: Color Swatches with Popover Color Swatches */}
      <div className="flex items-center gap-3 px-3">
        {/* Color Swatch 1 - Center Circle */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col items-center gap-1 cursor-pointer">
              <div
                className={`
                  w-10 h-10 p-0 border-2 border-white
                  rounded-lg shadow-sm
                  hover:scale-105 transition-all duration-300
                `}
                style={{ backgroundColor: logoColor1 }}
                title="Center Circle Color"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className={`w-56 p-3 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-white/20 text-white/90' : 'bg-white border-gray-200'}`}
            sideOffset={5}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: logoColor1 }}
                />
                <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                  Center Circle
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                  <Button
                    key={c.value}
                    variant="outline"
                    size="sm"
                    className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor1 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => onLogoColor1Change(c.value)}
                  />
                ))}
              </div>
              <div className="pt-2">
                <input
                  type="color"
                  value={logoColor1}
                  onChange={(e) => onLogoColor1Change(e.target.value)}
                  className={`
                    w-10 h-10 p-0 cursor-pointer border-2 border-white
                    rounded-lg appearance-none overflow-hidden shadow-sm
                    [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                    [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg
                    hover:scale-105 transition-all duration-300
                  `}
                  title="Center Circle Color"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Color Swatch 2 - Inner Ring */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col items-center gap-1 cursor-pointer">
              <div
                className={`
                  w-10 h-10 p-0 border-2 border-white
                  rounded-lg shadow-sm
                  hover:scale-105 transition-all duration-300
                `}
                style={{ backgroundColor: logoColor2 }}
                title="Inner Ring Color"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className={`w-56 p-3 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-white/20 text-white/90' : 'bg-white border-gray-200'}`}
            sideOffset={5}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: logoColor2 }}
                />
                <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                  Inner Ring
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                  <Button
                    key={c.value}
                    variant="outline"
                    size="sm"
                    className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor2 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => onLogoColor2Change(c.value)}
                  />
                ))}
              </div>
              <div className="pt-2">
                <input
                  type="color"
                  value={logoColor2}
                  onChange={(e) => onLogoColor2Change(e.target.value)}
                  className={`
                    w-10 h-10 p-0 cursor-pointer border-2 border-white
                    rounded-lg appearance-none overflow-hidden shadow-sm
                    [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                    [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg
                    hover:scale-105 transition-all duration-300
                  `}
                  title="Inner Ring Color"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Color Swatch 3 - Outer Ring */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex flex-col items-center gap-1 cursor-pointer">
              <div
                className={`
                  w-10 h-10 p-0 border-2 border-white
                  rounded-lg shadow-sm
                  hover:scale-105 transition-all duration-300
                `}
                style={{ backgroundColor: logoColor3 }}
                title="Outer Ring Color"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className={`w-56 p-3 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-white/20 text-white/90' : 'bg-white border-gray-200'}`}
            sideOffset={5}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: logoColor3 }}
                />
                <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                  Outer Ring
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                  <Button
                    key={c.value}
                    variant="outline"
                    size="sm"
                    className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor3 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => onLogoColor3Change(c.value)}
                  />
                ))}
              </div>
              <div className="pt-2">
                <input
                  type="color"
                  value={logoColor3}
                  onChange={(e) => onLogoColor3Change(e.target.value)}
                  className={`
                    w-10 h-10 p-0 cursor-pointer border-2 border-white
                    rounded-lg appearance-none overflow-hidden shadow-sm
                    [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                    [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg
                    hover:scale-105 transition-all duration-300
                  `}
                  title="Outer Ring Color"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  </div>
) : (
  


                    /* Standard Color Palette for other tabs */
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
                        <style>{`
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
                          <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap ${isDarkMode ? 'bg-black/40 text-white border border-white/20' : 'bg-gray-900 text-white'
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
                        <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap ${isDarkMode ? 'bg-black/40 text-white border border-white/20' : 'bg-gray-900 text-white'
                          }`}>
                          Custom Color
                          <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${isDarkMode ? 'border-t-black/90' : 'border-t-gray-900'
                            }`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Right Scroll Arrow */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`absolute hover:bg-gray-300 top-2 -right-9 z-10 h-10 w-10 p-0 rounded-full transition-all duration-300 ${isDarkMode
                      ? 'border-none hover:text-white '
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





                

                {/* Mobile: Different layouts for logos vs other tabs */}
                <div className="md:hidden w-full">
                  {activeTab === 'logos' ? (
                    /* Mobile Logos: Interactive SVG Preview + Color Swatches */
                    <div className="h-20">
                  
                      {/* Top Row: SVG Preview */}
                      <div className="flex justify-center mb-2 flex-col">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-black/20' : 'bg-white/50'}`}>
                          <svg 
                            width="100" 
                            height="32" 
                            viewBox="0 0 465.12 145.92" 
                            className="drop-shadow-sm"
                          >
                            <rect width="465.12" height="145.92" fill="none"/>
                            
                            {/* Outer Ring - Color 3 */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <path 
                                  d="M433.25,40.06h-135.58C285.37,15.77,260.26,0,232.56,0s-52.8,15.77-65.1,40.06H31.88C14.3,40.06,0,54.36,0,71.93s14.3,31.88,31.88,31.88h134.55c11.85,25.54,37.35,42.11,66.13,42.11s54.28-16.57,66.13-42.11h134.55c17.58,0,31.88-14.3,31.88-31.88s-14.3-31.88-31.88-31.88ZM452.12,71.93c0,10.38-8.49,18.88-18.88,18.88h-143.44c-7.62,24.37-30.4,42.11-57.25,42.11s-49.63-17.74-57.25-42.11H31.88c-10.38,0-18.88-8.49-18.88-18.88h0c0-10.38,8.49-18.88,18.88-18.88h144.14c8.23-23.31,30.46-40.06,56.55-40.06s48.32,16.75,56.55,40.06h144.14c10.38,0,18.88,8.49,18.88,18.88h0Z"
                                  fill={logoColor3}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                              </PopoverTrigger>
                              <PopoverContent 
                                className={`w-48 p-3 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-white/20 text-white/90' : 'bg-white border-gray-200'}`}
                                sideOffset={5}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                      style={{ backgroundColor: logoColor3 }}
                                    />
                                    <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                                      Outer Ring
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                                      <Button
                                        key={c.value}
                                        variant="outline"
                                        size="sm"
                                        className={`w-8 h-8 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor3 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => onLogoColor3Change(c.value)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            {/* Inner Ring - Color 2 */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <path 
                                  d="M433.25,53.06h-144.14c-8.23-23.31-30.46-40.06-56.55-40.06s-48.32,16.75-56.55,40.06H31.88c-10.38,0-18.88,8.49-18.88,18.88h0c0,10.38,8.49,18.88,18.88,18.88h143.44c7.62,24.37,30.4,42.11,57.25,42.11s49.63-17.74,57.25-42.11h143.44c10.38,0,18.88-8.49,18.88-18.88h0c0-10.38-8.49-18.88-18.88-18.88ZM232.56,122.42c-27.32,0-49.46-22.14-49.46-49.46s22.14-49.46,49.46-49.46,49.46,22.14,49.46,49.46-22.14,49.46-49.46,49.46Z"
                                  fill={logoColor2}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                              </PopoverTrigger>
                              <PopoverContent 
                                className={`w-48 p-3 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-white/20 text-white/90' : 'bg-white border-gray-200'}`}
                                sideOffset={5}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                      style={{ backgroundColor: logoColor2 }}
                                    />
                                    <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                                      Inner Ring
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                                      <Button
                                        key={c.value}
                                        variant="outline"
                                        size="sm"
                                        className={`w-8 h-8 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor2 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => onLogoColor2Change(c.value)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            {/* Center Circle - Color 1 */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <circle 
                                  cx="232.56" 
                                  cy="72.96" 
                                  r="49.46" 
                                  fill={logoColor1}
                                  className="cursor-pointer hover:opacity-80 transition-opacity"
                                />
                              </PopoverTrigger>
                              <PopoverContent 
                                className={`w-48 p-3 transition-all duration-300 ${isDarkMode ? 'bg-black/90 border-white/20 text-white/90' : 'bg-white border-gray-200'}`}
                                sideOffset={5}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                      style={{ backgroundColor: logoColor1 }}
                                    />
                                    <span className={`font-medium text-sm transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                                      Center Circle
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                                      <Button
                                        key={c.value}
                                        variant="outline"
                                        size="sm"
                                        className={`w-8 h-8 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor1 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')}`}
                                        style={{ backgroundColor: c.value }}
                                        onClick={() => onLogoColor1Change(c.value)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </svg>
                        </div>
                      </div>

                      {/* Bottom Row: Color Swatches */}
                      <div className="flex items-center -translate-y-[50px] translate-x-[50px] justify-center gap-4">
                        {/* Color Swatch 1 */}
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-medium transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                            Center
                          </span>
                          <input
                            type="color"
                            value={logoColor1}
                            onChange={(e) => onLogoColor1Change(e.target.value)}
                            className={`
                              w-8 h-8 p-0 cursor-pointer border-2 border-white
                              rounded-lg appearance-none overflow-hidden shadow-sm
                              [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                              [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg
                              hover:scale-105 transition-all duration-300
                            `}
                            title="Center Circle Color"
                          />
                        </div>

                        {/* Color Swatch 2 */}
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-medium transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                            Inner
                          </span>
                          <input
                            type="color"
                            value={logoColor2}
                            onChange={(e) => onLogoColor2Change(e.target.value)}
                            className={`
                              w-8 h-8 p-0 cursor-pointer border-2 border-white
                              rounded-lg appearance-none overflow-hidden shadow-sm
                              [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                              [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg
                              hover:scale-105 transition-all duration-300
                            `}
                            title="Inner Ring Color"
                          />
                        </div>

                        {/* Color Swatch 3 */}
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-medium transition-all duration-300 ${isDarkMode ? 'text-white/70' : 'text-gray-600'}`}>
                            Outer
                          </span>
                          <input
                            type="color"
                            value={logoColor3}
                            onChange={(e) => onLogoColor3Change(e.target.value)}
                            className={`
                              w-8 h-8 p-0 cursor-pointer border-2 border-white
                              rounded-lg appearance-none overflow-hidden shadow-sm
                              [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:rounded-none
                              [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-lg
                              hover:scale-105 transition-all duration-300
                            `}
                            title="Outer Ring Color"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Mobile Standard: Grid Layout */
                    <>
               <div className="flex overflow-x-auto gap-1 max-w-[260px] mx-auto px-1 py-2 scrollbar-thin scrollbar-thumb-gray-400">
  {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
    <div key={c.value} className="relative group flex-shrink-0">
      <Button
        variant="outline"
        size="sm"
        className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-110 ${
          getCurrentColor() === c.value
            ? 'border-primary ring-1 ring-primary/20 scale-110'
            : isDarkMode
            ? 'border-white/30'
            : 'border-gray-300'
        }`}
        style={{ backgroundColor: c.value }}
        onClick={() => getCurrentColorChanger()(c.value)}
      />
    </div>
  ))}
</div>

                  {/* Mobile Custom Color Picker - Separate Row */}
                  <div className=" justify-center mt-2 hidden">
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
                    </>
                  )}
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
                    className={`w-12 h-12 bg-black/5 p-0 flex items-center hover:bg-gray-200 justify-center transition-all rounded-full duration-300 ${isDarkMode ? 'border-white/20 border text-white/80 hover:bg-white/10 hover:text-white' : ''
                      }`}
                  >
                    <img src="/teams.svg" alt="Schools" className="w-8 h-8 grayscale" />
                  </Button>
                </div>

                {/* Expand/Collapse */}
             
              </div>
            </div>
          </div>

          {/* Logo Tab Content - Animated */}
          <AnimatePresence mode="wait">
            {activeTab === 'logos' && (
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut"
                }}
                style={{ 
                  overflow: "hidden",
                  transformOrigin: "top"
                }}
              >
                <div className={`px-4 pb-4 border-t transition-all duration-300 ${isDarkMode ? 'border-white/20' : 'border-gray-200'}`}>
                  <motion.div 
                    className="pt-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Side Logos Section */}
                      <div className={`p-4 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-black/20 border-white/20' : 'bg-secondary/20 border-gray-200'}`}>
                        <div className="text-center mb-4">
                          <h4 className={`text-md font-semibold mb-2 transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                            Side Logos
                          </h4>
                          <p className={`text-sm hidden md:block transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                            Upload logos for the sides of your shoe
                          </p>
                        </div>
                        <LogoUploader
                          onLogoChange={onLogoChange}
                          currentLogo={logoUrl}
                        />
                      </div>

                      {/* Back Logo Section */}
                      <div className={`p-4 rounded-lg border transition-all duration-300 ${isDarkMode ? 'bg-black/20 border-white/20' : 'bg-secondary/20 border-gray-200'}`}>
                        <div className="text-center mb-4">
                          <h4 className={`text-md font-semibold mb-2 transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                            Back Logo
                          </h4>
                          <p className={`text-sm hidden md:block transition-all duration-300 ${isDarkMode ? 'text-white/60' : 'text-muted-foreground'}`}>
                            Customize the heel logo colors and center image
                          </p>
                        </div>

                        {/* Circle Logo Uploader */}
                        <div className="mb-4">
                          <div className="text-center mb-3">
                         
                          </div>
                          <LogoUploader
                            onLogoChange={onCircleLogoChange}
                            currentLogo={circleLogoUrl}
                          />
                        </div>

                        {/* SVG Preview */}
                        <div className=" justify-center mb-6 hidden">
                          <div className={`p-4 rounded-lg transition-all duration-300 ${isDarkMode ? 'bg-black/40' : 'bg-white'}`}>
                            <svg 
                              width="80" 
                              height="80" 
                              viewBox="0 0 1024 1024" 
                              className="drop-shadow-sm"
                            >
                              <rect width="1024" height="1024" fill="none"/>
                              {circleLogoUrl ? (
                                <>
                                  <defs>
                                    <clipPath id="previewCircleClip">
                                      <circle cx="931.55" cy="427.23" r="49.96"/>
                                    </clipPath>
                                  </defs>
                                  <image 
                                    x={931.55 - 49.96} 
                                    y={427.23 - 49.96} 
                                    width={49.96 * 2} 
                                    height={49.96 * 2} 
                                    href={circleLogoUrl} 
                                    clipPath="url(#previewCircleClip)" 
                                    preserveAspectRatio="xMidYMid slice"
                                  />
                                  <circle cx="931.55" cy="427.23" r="49.96" fill="none" stroke={logoColor1} strokeWidth="2"/>
                                </>
                              ) : (
                                <circle cx="931.55" cy="427.23" r="49.96" fill={logoColor1}/>
                              )}
                              <path
                                d="M963.16,354.84l-.13-137.38c-5.1-38.17-55.76-37.96-61.03.04l-.17,134.83c-5.74,4.39-12.32,7.42-17.85,12.15-36.3,31.01-36.45,91.19-.51,122.54,5.66,4.94,12.27,8.36,18.37,12.63l.27,133.73c6.39,37.37,55.52,36.47,60.93-.85l-.08-134.87c56.69-28.83,57.21-114.2.2-142.83ZM951.13,488.63l-.26,139.74c-2.87,27.21-35.28,25.16-36.86-.89l-.15-137.85c-8.54-4.71-17.06-7.83-24.34-14.66-36.2-34-22.12-96.75,24.51-112.65l-.07-138.86c.65-26.62,33.99-29.64,36.91-1.84l.29,142.22c42.94,16.23,55.41,71.96,25.81,106.63-7.24,8.48-16.07,13.25-25.84,18.16Z"
                                fill={logoColor2}
                              />
                              <path
                                d="M951.16,363.84l-.29-142.22c-2.93-27.8-36.27-24.78-36.91,1.84l.07,138.86c-46.63,15.9-60.71,78.65-24.51,112.65,7.28,6.83,15.8,9.94,24.34,14.66l.15,137.85c1.58,26.06,33.99,28.1,36.86.89l.26-139.74c9.77-4.91,18.6-9.68,25.84-18.16,29.6-34.67,17.13-90.4-25.81-106.63ZM931.55,477.19c-27.59,0-49.96-22.37-49.96-49.96s22.37-49.96,49.96-49.96,49.96,22.37,49.96,49.96-22.37,49.96-49.96,49.96Z"
                                fill={logoColor3}
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Three Color Selectors in a Triangular Layout */}
                        <div className="space-y-6 hidden">
                          {/* Color 1 - Center Top */}
                          <div className="text-center">
                            <div className="flex items-center justify-center gap-2 mb-3">
                              <div 
                                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: logoColor1 }}
                              />
                              <span className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                                Primary Element
                              </span>
                            </div>
                            <div className="flex gap-1.5 justify-center flex-wrap max-w-xs mx-auto">
                              {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                                <Button
                                  key={c.value}
                                  variant="outline"
                                  size="sm"
                                  className={`w-8 h-8 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor1 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                                    }`}
                                  style={{ backgroundColor: c.value }}
                                  onClick={() => onLogoColor1Change(c.value)}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Color 2 & 3 - Side by Side */}
                          <div className="grid grid-cols-2 gap-6">
                            {/* Color 2 - Left */}
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <div 
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                  style={{ backgroundColor: logoColor2 }}
                                />
                                <span className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                                  Outline
                                </span>
                              </div>
                              <div className="flex gap-1 justify-center flex-wrap">
                                {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                                  <Button
                                    key={c.value}
                                    variant="outline"
                                    size="sm"
                                    className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor2 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                                      }`}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => onLogoColor2Change(c.value)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Color 3 - Right */}
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2 mb-3">
                                <div 
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                  style={{ backgroundColor: logoColor3 }}
                                />
                                <span className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/90' : 'text-foreground'}`}>
                                  Details
                                </span>
                              </div>
                              <div className="flex gap-1 justify-center flex-wrap">
                                {NATIONAL_PARK_COLORS.slice(0, 30).map(c => (
                                  <Button
                                    key={c.value}
                                    variant="outline"
                                    size="sm"
                                    className={`w-7 h-7 p-0 border rounded-full transition-all duration-300 hover:scale-105 ${logoColor3 === c.value ? 'border-primary ring-2 ring-primary/20 scale-105' : (isDarkMode ? 'border-white/30' : 'border-gray-300')
                                      }`}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => onLogoColor3Change(c.value)}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded Content Area - For Non-Logo Tabs */}
          <AnimatePresence>
            {isOpen && activeTab !== 'logos' && (
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