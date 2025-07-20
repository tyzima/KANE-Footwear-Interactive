"use client"

import { useState, useRef, useEffect } from "react"
import { Shield, Zap, Sparkles, Leaf } from "lucide-react"

interface FeatureIconsBarProps {
  isDarkMode?: boolean;
}


const features = [
  {
    id: "durable",
    icon: Shield,
    text: "Ultra durable",
    title: "Built to Last",
    description:
      "Reinforced construction and premium materials ensure long-lasting performance in any condition.",
    image: "https://kanefootwear.com/cdn/shop/files/recover_faster_1.png?v=1726684416&width=1000",
  },
  {
    id: "quick-dry",
    icon: Zap,
    text: "Quick drying",
    title: "Rapid Dry Technology",
    description:
      "Moisture-wicking materials dry 3x faster than traditional footwear for all-day comfort.",
    image: "https://kanefootwear.com/cdn/shop/files/testimonials_tammy.png?v=1726685418&width=1000",
  },
  {
    id: "sustainable",
    icon: Leaf,
    text: "Sustainable",
    title: "Eco-Friendly Design",
    description:
      "Crafted with recycled materials and sustainable processes to reduce environmental impact.",
    image: "https://kanefootwear.com/cdn/shop/files/recover_faster_2.png?v=1726684399&width=1000",
  },
]

function FeatureContent({ feature, isVisible, isDarkMode }: { feature: (typeof features)[0]; isVisible: boolean; isDarkMode?: boolean }) {
  const Icon = feature.icon
  return (
    <div
      className={`transition-all duration-300 ease-out ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
    >
      <div className="flex flex-col gap-4">
        {/* Large image at the top */}
        <div className="w-full h-48 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
         <img src={feature.image || "/lace_texture.jpg"} alt={feature.text} className="w-full h-full object-cover" />
        </div>

        {/* Content below image */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-black/50' : 'bg-gray-100'}`}>
              <Icon className={`w-4 h-4 transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-black'}`} />
            </div>
            <div>
              <h3 className={`font-semibold text-base leading-tight transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
              <p className={`text-xs font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{feature.text}</p>
            </div>
          </div>
          <p className={`text-sm leading-relaxed transition-colors duration-300 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{feature.description}</p>
        </div>
      </div>
    </div>
  )
}

export default function FeatureIconsBar({ isDarkMode = false }: FeatureIconsBarProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [displayFeature, setDisplayFeature] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (featureId: string) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }

    // If no active feature, just show it
    if (!activeFeature) {
      setActiveFeature(featureId)
      setDisplayFeature(featureId)
      return
    }

    // If switching between features
    if (activeFeature !== featureId) {
      setActiveFeature(featureId)
      setIsTransitioning(true)

      // Clear any existing transition timeout
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }

      // Fade out current, then fade in new
      transitionTimeoutRef.current = setTimeout(() => {
        setDisplayFeature(featureId)
        setIsTransitioning(false)
      }, 150)
    }
  }

  const handleMouseLeave = () => {
    // Longer delay before closing
    closeTimeoutRef.current = setTimeout(() => {
      setActiveFeature(null)
      setDisplayFeature(null)
      setIsTransitioning(false)
    }, 800)
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current)
    }
  }, [])

  const currentFeature = features.find((f) => f.id === displayFeature)

  return (
    <div className="flex flex-col hidden md:flex justify-start -ml-5 items-start p-4 gap-8">
      {/* Icons bar */}
      <div className={`rounded-full p-1.5 shadow-lg transition-colors duration-300 ${isDarkMode ? 'bg-black/30' : 'bg-white'}`}>
        <div className="flex items-center gap-1">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const isActive = activeFeature === feature.id

            return (
              <div key={feature.id} className="relative">
                <button
                  className={`group shadow-none relative p-2.5 rounded-full transition-all duration-300 ease-out  ${
                    isActive
                      ? isDarkMode 
                        ? "bg-black/50 scale-105 shadow-md" 
                        : "bg-gray-300 scale-105 shadow-md"
                      : isDarkMode
                        ? "bg-black/50 hover:bg-black/70 hover:scale-95 "
                        : "bg-gray-100 hover:bg-gray-100 hover:scale-95 "
                  } ${isDarkMode ? 'focus:ring-gray-500' : 'focus:ring-gray-400'}`}
                  onMouseEnter={() => handleMouseEnter(feature.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors duration-200 ${
                      isActive 
                        ? isDarkMode ? "text-white" : "text-gray-800"
                        : isDarkMode 
                          ? "text-gray-300 group-hover:text-white" 
                          : "text-gray-600 group-hover:text-gray-800"
                    }`}
                  />
                  <span className="sr-only">{feature.text}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content box below icons */}
      {activeFeature && (
        <div
          className={`w-96 rounded-[20px] shadow-2xl p-6 animate-in fade-in-0 zoom-in-95 transition-colors duration-300 ${
            isDarkMode ? 'bg-black/50' : 'bg-white'
          }`}
          onMouseEnter={() => activeFeature && handleMouseEnter(activeFeature)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="relative">
            {currentFeature && <FeatureContent feature={currentFeature} isVisible={!isTransitioning} isDarkMode={isDarkMode} />}
          </div>
        </div>
      )}
    </div>
  )
}
