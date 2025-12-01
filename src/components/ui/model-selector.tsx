"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

export type ModelType = 'gemini' | 'llama-3.3-70b-versatile' | 'openai/gpt-oss-120b';

interface ModelSelectorProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  disabled?: boolean;
  className?: string;
}

const modelOptions = [
  { 
    value: 'gemini' as ModelType, 
    label: 'Gemini'
  },
  { 
    value: 'llama-3.3-70b-versatile' as ModelType, 
    label: 'Llama'
  },
  { 
    value: 'openai/gpt-oss-120b' as ModelType, 
    label: 'GPT'
  }
];

export function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  disabled = false,
  className = ""
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = modelOptions.find(option => option.value === selectedModel);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div
        className={`w-24 sm:w-32 h-10 flex items-center justify-between px-2 sm:px-3 py-2 cursor-pointer transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={{
          background: "var(--components-button-Fill, rgba(255, 255, 255, 0.12))",
          border: "1px solid var(--primary-16, rgba(19, 245, 132, 0.16))",
          borderRadius: "99px",
          color: "white",
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="text-white text-xs sm:text-sm truncate">
          {selectedOption?.label || "Model"}
        </span>
        <ChevronDown 
          className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-400 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </div>
      
      {isOpen && !disabled && (
        <div 
          className="absolute top-full left-0 right-0 sm:right-auto sm:w-32 mt-1 rounded-lg shadow-lg"
          style={{
            background: "var(--components-button-Fill, rgba(255, 255, 255, 0.12))",
            border: "1px solid var(--primary-16, rgba(19, 245, 132, 0.16))",
            backdropFilter: "blur(10px)",
            zIndex: 9999,
            minWidth: "max-content",
          }}
        >
          {modelOptions.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors whitespace-nowrap ${
                selectedModel === option.value ? 'text-green-400' : 'text-white hover:bg-white/10'
              }`}
              onClick={() => {
                onModelChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
