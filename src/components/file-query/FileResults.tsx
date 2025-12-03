import React from "react";
import { File, FileText, Brain, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/loading";

export interface FileQueryResult {
  id: string;
  answer?: string;
  confidence?: string | number;
  sources_used?: number;
  query?: string;
  content?: string;
  text?: string;
  source?: string;
  filename?: string;
  source_file?: string;
  source_title?: string;
  page_range?: string;
  document_number?: number;
  file_path?: string;
  is_source?: boolean;
  sources?: any[];
  context_length?: number;
  prompt_length?: number;
  similarity?: number;
  total_results?: number;
  [key: string]: any; // Allow for additional properties
}

export interface FileSearchResult {
  filename: string;
  similarity: number;
}

export interface FileSearchResponse {
  query: string;
  results: FileSearchResult[];
  answer: string;
  total_results: number;
}

interface FileResultsProps {
  results?: FileQueryResult[]; // Optional - kept for backward compatibility but no longer used
  query: string;
  isLoading?: boolean;
  className?: string;
  searchResponse?: FileSearchResponse; // Required prop for structured response
}

export function FileResults({
  results,
  query,
  isLoading = false,
  className = "",
  searchResponse,
}: FileResultsProps) {
  // Format answer content with proper markdown-like rendering
  const formatAnswerContent = (content: string) => {
    if (!content) return "No content available";

    // Split content into lines for processing
    const lines = content.split("\n");
    const formattedLines = lines.map((line, index) => {
      // Handle bold text (**text**)
      if (line.includes("**") && line.includes("**")) {
        const parts = line.split("**");
        return (
          <div key={index} className="mb-2">
            {parts.map((part, partIndex) => {
              if (partIndex % 2 === 1) {
                return (
                  <strong key={partIndex} className="text-white font-semibold">
                    {part}
                  </strong>
                );
              }
              return <span key={partIndex}>{part}</span>;
            })}
          </div>
        );
      }

      // Handle bullet points
      if (line.trim().startsWith("*") && line.includes(".")) {
        return (
          <div key={index} className="ml-4 mb-1 flex items-start">
            <span className="text-emerald-400 mr-2">•</span>
            <span className="text-gray-300">{line.replace(/^\*\s*/, "")}</span>
          </div>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={index} className="ml-4 mb-1 flex items-start">
            <span className="text-emerald-400 mr-2 font-semibold">
              {line.match(/^\d+\./)?.[0]}
            </span>
            <span className="text-gray-300">
              {line.replace(/^\d+\.\s*/, "")}
            </span>
          </div>
        );
      }

      // Regular text
      if (line.trim()) {
        return (
          <div key={index} className="mb-2 text-gray-300 leading-relaxed">
            {line}
          </div>
        );
      }

      // Empty line
      return <div key={index} className="mb-2"></div>;
    });

    return formattedLines;
  };

  if (isLoading) {
    return (
      <div className={`${className} text-center py-8`}>
        <Spinner size="lg" variant="accent-green" className="mx-auto mb-4" />
        <p className="text-green-400 font-medium">Processing your query...</p>
        <p className="text-gray-400 text-sm">This may take a few moments</p>
      </div>
    );
  }

  // Use structured response - required format
  const hasStructuredResponse = searchResponse && searchResponse.answer;

  if (!hasStructuredResponse) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800/50 flex items-center justify-center border border-gray-600/30">
          <AlertCircle className="w-8 h-8 text-yellow-400" />
        </div>
        <p className="text-white font-medium mb-2">Invalid response format</p>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Expected structured response format not found. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Main AI Answer */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-emerald-400 font-semibold text-lg">AI Answer</h3>
        </div>

        <div className="bg-emerald-900/10 border border-emerald-400/20 rounded-lg p-4">
          <div className="text-gray-100 leading-relaxed">
            {formatAnswerContent(searchResponse.answer)}
          </div>
        </div>
      </div>

      {/* Search Results with Similarity Scores */}
      {searchResponse.results && searchResponse.results.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-emerald-400 font-semibold text-lg">
              Source Documents
            </h3>
          </div>

          <div className="space-y-3">
            {searchResponse.results.map((result, index) => (
              <div
                key={`${result.filename}-${index}`}
                className="bg-emerald-900/10 border border-emerald-400/20 rounded-lg p-3 hover:bg-emerald-900/20 transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <File className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-emerald-300 font-medium text-sm truncate">
                      {result.filename}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
