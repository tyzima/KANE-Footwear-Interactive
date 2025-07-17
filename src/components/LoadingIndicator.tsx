import React from 'react';
import { motion } from 'framer-motion';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-viewer-bg/80 backdrop-blur-sm z-10">
      <div className="text-center">
        {/* Main Loading Animation */}
        <div className="relative mb-6 flex justify-center">
          <motion.svg
            width="128"
            height="104"
            viewBox="-5 -5 44.5 38.97"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <defs>
              {/* Glass base gradient */}
              <linearGradient id="glassBase" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.4" />
                <stop offset="30%" stopColor="#e2e8f0" stopOpacity="0.5" />
                <stop offset="70%" stopColor="#cbd5e1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.2" />
              </linearGradient>

              {/* Glass highlight gradient */}
              <linearGradient id="glassHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#f8fafc" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.4" />
              </linearGradient>

              {/* Glass shadow gradient */}
              <linearGradient id="glassShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#475569" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.1" />
              </linearGradient>

              {/* Shimmer effect */}
              <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* Soft glow filter */}
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Light glow filter */}
              <filter id="lightGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Ultra-thin shadow layer */}
            <path
              stroke="url(#glassShadow)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#softGlow)"
              d="M19.81,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93.88-3.25,2.69-3.94,2.91-1.11,5.83-2.2,8.75-3.3.5-.19,1-.39,1.5-.59.07-.03.14-.05.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47-1.96,6.38-5.16,7.71-2.59,1.08-5.17,2.16-7.76,3.24-.08.03-.16.06-.26.1Z"
            />
            <path
              stroke="url(#glassShadow)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#softGlow)"
              d="M14.69,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93-.88-3.25-2.69-3.94-2.91-1.11-5.83-2.2-8.75-3.3-.5-.19-1-.39-1.5-.59-.07-.03-.14-.05-.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47,1.96,6.38,5.16,7.71,2.59,1.08,5.17,2.16,7.76,3.24.08.03.16.06.26.1Z"
            />

            {/* Ultra-thin glass base layer */}
            <path
              stroke="url(#glassBase)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              d="M19.81,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93.88-3.25,2.69-3.94,2.91-1.11,5.83-2.2,8.75-3.3.5-.19,1-.39,1.5-.59.07-.03.14-.05.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47-1.96,6.38-5.16,7.71-2.59,1.08-5.17,2.16-7.76,3.24-.08.03-.16.06-.26.1Z"
            />
            <path
              stroke="url(#glassBase)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              d="M14.69,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93-.88-3.25-2.69-3.94-2.91-1.11-5.83-2.2-8.75-3.3-.5-.19-1-.39-1.5-.59-.07-.03-.14-.05-.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47,1.96,6.38,5.16,7.71,2.59,1.08,5.17,2.16,7.76,3.24.08.03.16.06.26.1Z"
            />

            {/* Ultra-thin glass highlight layer */}
            <path
              stroke="url(#glassHighlight)"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              d="M19.81,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93.88-3.25,2.69-3.94,2.91-1.11,5.83-2.2,8.75-3.3.5-.19,1-.39,1.5-.59.07-.03.14-.05.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47-1.96,6.38-5.16,7.71-2.59,1.08-5.17,2.16-7.76,3.24-.08.03-.16.06-.26.1Z"
            />
            <path
              stroke="url(#glassHighlight)"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              d="M14.69,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93-.88-3.25-2.69-3.94-2.91-1.11-5.83-2.2-8.75-3.3-.5-.19-1-.39-1.5-.59-.07-.03-.14-.05-.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47,1.96,6.38,5.16,7.71,2.59,1.08,5.17,2.16,7.76,3.24.08.03.16.06.26.1Z"
            />

            {/* Animated shimmer effect using stroke-dasharray */}
            <motion.path
              stroke="url(#shimmer)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#lightGlow)"
              d="M19.81,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93.88-3.25,2.69-3.94,2.91-1.11,5.83-2.2,8.75-3.3.5-.19,1-.39,1.5-.59.07-.03.14-.05.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47-1.96,6.38-5.16,7.71-2.59,1.08-5.17,2.16-7.76,3.24-.08.03-.16.06-.26.1Z"
              initial={{ strokeDasharray: "0 100", strokeDashoffset: 0 }}
              animate={{
                strokeDasharray: ["0 100", "20 80", "0 100"],
                strokeDashoffset: [0, -100, -200],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                repeatDelay: 1,
              }}
            />
            <motion.path
              stroke="url(#shimmer)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#lightGlow)"
              d="M14.69,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93-.88-3.25-2.69-3.94-2.91-1.11-5.83-2.2-8.75-3.3-.5-.19-1-.39-1.5-.59-.07-.03-.14-.05-.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47,1.96,6.38,5.16,7.71,2.59,1.08,5.17,2.16,7.76,3.24.08.03.16.06.26.1Z"
              initial={{ strokeDasharray: "0 100", strokeDashoffset: 0 }}
              animate={{
                strokeDasharray: ["0 100", "20 80", "0 100"],
                strokeDashoffset: [0, -100, -200],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                repeatDelay: 1,
                delay: 0.4,
              }}
            />

            {/* Subtle pulsing outline */}
            <motion.path
              stroke="#ffffff"
              strokeWidth="0.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#softGlow)"
              d="M19.81,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93.88-3.25,2.69-3.94,2.91-1.11,5.83-2.2,8.75-3.3.5-.19,1-.39,1.5-.59.07-.03.14-.05.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47-1.96,6.38-5.16,7.71-2.59,1.08-5.17,2.16-7.76,3.24-.08.03-.16.06-.26.1Z"
              animate={{
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.path
              stroke="#ffffff"
              strokeWidth="0.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter="url(#softGlow)"
              d="M14.69,26.79v-.27c0-5.49,0-10.99,0-16.48,0-1.93-.88-3.25-2.69-3.94-2.91-1.11-5.83-2.2-8.75-3.3-.5-.19-1-.39-1.5-.59-.07-.03-.14-.05-.25-.09v.25c0,4.46,0,8.91,0,13.37,0,3.47,1.96,6.38,5.16,7.71,2.59,1.08,5.17,2.16,7.76,3.24.08.03.16.06.26.1Z"
              animate={{
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
          </motion.svg>
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
        
        
        </div>

      
     
      </div>
    </div>
  );
};