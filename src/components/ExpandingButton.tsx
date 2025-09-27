"use client"

import type React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Plus, X } from "lucide-react"

interface ExpandingButtonProps {
  placeholder?: string
  buttonText?: string
  className?: string
  onSubmit?: (text: string) => void
  onCancel?: () => void
  value?: string
  onChange?: (text: string) => void
  rows?: number
}

export function ExpandingButton({
  placeholder = "Start typing...",
  buttonText = "Click to expand",
  className,
  onSubmit,
  onCancel,
  value = "",
  onChange,
  rows = 3,
}: ExpandingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [text, setText] = useState(value)

  const handleClick = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleCancel()
    } else if (e.key === "Enter" && e.metaKey) {
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    onSubmit?.(text)
    setIsExpanded(false)
    setText("")
  }

  const handleCancel = () => {
    onCancel?.()
    setIsExpanded(false)
    setText("")
  }

  const handleBlur = () => {
    if (!text.trim()) {
      setIsExpanded(false)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    onChange?.(newText)
  }

  return (
    <div className={cn("relative", className)}>
      {!isExpanded ? (
        <button
          onClick={handleClick}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium 
                     hover:bg-gray-50 hover:border-gray-400 transition-all duration-1200 ease-out
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                     shadow-sm hover:shadow-md transform hover:scale-[1.02] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {buttonText}
        </button>
      ) : (
        <div className="space-y-2">
       
          <textarea
            autoFocus
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 
                       rounded-lg font-medium resize-none
                       focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                       shadow-sm placeholder:text-gray-400
                       transition-all duration-900 ease-out
                       animate-in fade-in-0 zoom-in-95"
            style={{
              animation: "expandIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          />
          <div className="text-xs text-gray-500 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd> to cancel,
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs ml-1">⌘ + Enter</kbd> to submit
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes expandIn {
          from {
            height: 40px;
            min-height: 40px;
          }
          to {
            height: auto;
            min-height: ${rows * 24 + 24}px;
          }
        }
      `}</style>
    </div>
  )
}
