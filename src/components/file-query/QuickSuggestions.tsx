"use client";

import React from "react";

interface Suggestion {
  text: string;
  query: string;
}

interface QuickSuggestionsProps {
  className?: string;
  onQuerySelect?: (query: string) => void;
  suggestions?: Suggestion[];
  title?: string;
}

export function QuickSuggestions({ 
  className = "", 
  onQuerySelect, 
  suggestions: customSuggestions,
  title = "Quick suggestion"
}: QuickSuggestionsProps) {
  const defaultSuggestions = [
    { 
      text: "What are the main topics covered in the uploaded documents?", 
      query: "What are the main topics covered in the uploaded documents?"
    },
    { 
      text: "Summarize the key findings from the financial reports", 
      query: "Summarize the key findings from the financial reports"
    },
    { 
      text: "Find all mentions of budget allocations and spending", 
      query: "Find all mentions of budget allocations and spending"
    },
    { 
      text: "Extract data from tables and structured content", 
      query: "Extract data from tables and structured content"
    },
  ];

  const suggestions = customSuggestions || defaultSuggestions;

  const handleSuggestionClick = (query: string) => {
    if (onQuerySelect) {
      onQuerySelect(query);
    }
  };

  return (
    <div className={`space-y-4 ${className}`} data-tour="suggestions">
      <h3 className="text-sm font-semibold text-white mb-6">
        {title}
      </h3>
      <div className="file-query-responsive-grid">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className="px-4 py-3 cursor-pointer flex flex-col justify-center items-start text-left h-16 quick-suggestion-card"
            onClick={() => handleSuggestionClick(suggestion.query)}
          >
            <p className="file-query-responsive-text text-slate-400 leading-tight line-clamp-2 overflow-hidden">
              {suggestion.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
