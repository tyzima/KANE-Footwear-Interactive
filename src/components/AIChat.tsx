import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bot, Send, X, MessageCircle, Atom } from 'lucide-react';
import { Button } from './ui/button';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIChatProps {
  // Color state props
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
  isDarkMode?: boolean;
  // ColorCustomizer height for dynamic positioning
  customizerHeight?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const AIChat: React.FC<AIChatProps> = ({
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
  isDarkMode = false,
  customizerHeight = 100
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const genAI = useMemo(() => {
    const apiKey = "AIzaSyDr_8GiHPH6yJaFsTQeoaDQ6cLJPgtn0XE";
    if (!apiKey) {
      console.error("⚠️ Gemini API key not found. Please set REACT_APP_GEMINI_API_KEY in your .env.local file.");
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  }, []);

  // Show only last 3 messages
  const visibleMessages = chatMessages.slice(-3);

  const processAICommand = async (message: string) => {
    if (!genAI) {
      setChatMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "AI features are disabled. Missing Gemini API key.",
        isUser: false,
        timestamp: new Date()
      }]);
      return;
    }

    setIsProcessing(true);
    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date()
    }]);

    try {
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

      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: parsedPlan.message,
        isUser: false,
        timestamp: new Date()
      }]);

      // Clear textures only for parts specified in clearTextures field
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

    } catch (error) {
      console.error('AI processing error:', error);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I had trouble with that request. Please try again.',
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;
    const message = inputMessage.trim();
    setInputMessage('');
    await processAICommand(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatMessages, isProcessing]);



  // Auto-fade messages after 10 seconds (fixed to remove oldest)
  useEffect(() => {
    if (chatMessages.length > 0) {
      const timer = setTimeout(() => {
        setChatMessages(prev => prev.slice(1));
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [chatMessages]);

  // Use the actual ColorCustomizer height plus some padding
  const dynamicBottomPosition = customizerHeight + 16;

  return (
    <div
      className="fixed left-4 md:left-4 md:translate-x-0 max-md:left-1/2 max-md:-translate-x-1/2 z-20 w-80 lg:w-[400px] transition-all duration-500 ease-out"
      style={{
        bottom: `${dynamicBottomPosition}px`
      }}
    >
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className={`mb-2 flex items-center justify-center px-4 py-2 rounded-full border border-none focus:ring-2 focus:ring-primary/50 shadow-none transition-all duration-300 ${isDarkMode
            ? 'bg-black/40 text-white hover:bg-black'
            : 'bg-white/90 text-black hover:bg-white'
            }`}
        >
          <MessageCircle className="w-4 h-4 mr-2 text-primary" />
          AI Chat
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div className="bg-transparent rounded-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* No header to match minimal Grok design */}

          {/* Messages */}
          {(visibleMessages.length > 0 || isProcessing) && (
            <div
              ref={chatContainerRef}
              className="max-h-60 overflow-y-auto px-6 py-6 space-y-0"
            >
              {visibleMessages.map((msg, i) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 items-end transition-all duration-300 ${msg.isUser ? 'justify-end' : 'justify-start'} ${i > 0 ? '-mt-3' : ''}`}
                  style={{
                    opacity: 1 - (visibleMessages.length - 1 - i) * 0.15,
                    zIndex: visibleMessages.length - i,
                    transform: `translateX(${(visibleMessages.length - 1 - i) * (msg.isUser ? -1 : 1) * 2}px) translateY(${(visibleMessages.length - 1 - i) * 2}px)`,
                  }}
                >
                  {!msg.isUser && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-gray-50'
                      }`}>
                      <Bot className={`w-4 h-4 transition-all duration-300 ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-xl text-sm shadow-sm transition-all duration-300 ${isDarkMode
                      ? msg.isUser
                        ? 'bg-black/40 text-white border border-white/20'
                        : 'bg-black/70 text-white/90 border border-white/10'
                      : msg.isUser
                        ? 'bg-white text-black border border-gray-100'
                        : 'bg-gray-50 text-gray-900 border border-gray-100'
                      }`}
                  >
                    {msg.text}
                  </div>
                  {msg.isUser && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-black/40' : 'bg-white'
                      }`}>
                      <span className={`text-sm font-medium transition-all duration-300 ${isDarkMode ? 'text-white/80' : 'text-slate-600'}`}>U</span>
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex gap-3 items-end justify-start animate-pulse mt-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-gray-50'
                    }`}>
                    <Bot className={`w-4 h-4 transition-all duration-300 ${isDarkMode ? 'text-white/80' : 'text-gray-600'}`} />
                  </div>
                  <div className={`flex items-center space-x-1 px-4 py-3 rounded-xl shadow-sm transition-all duration-300 ${isDarkMode
                    ? 'bg-black/70 border border-white/10'
                    : 'bg-gray-50 border border-gray-100'
                    }`}>
                    <div className={`w-2 h-2 rounded-full animate-bounce transition-all duration-300 ${isDarkMode ? 'bg-white/70' : 'bg-gray-500'
                      }`} />
                    <div className={`w-2 h-2 rounded-full animate-bounce delay-150 transition-all duration-300 ${isDarkMode ? 'bg-white/70' : 'bg-gray-500'
                      }`} />
                    <div className={`w-2 h-2 rounded-full animate-bounce delay-300 transition-all duration-300 ${isDarkMode ? 'bg-white/70' : 'bg-gray-500'
                      }`} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input */}
        
        </div>
      )}
    </div>
  );
};