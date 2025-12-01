"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  CustomTypewriter,
  TYPEWRITER_TEXTS,
  TypewriterTextType,
} from "@/components/ui/custom-typewriter";
import { ModelSelector, ModelType } from "@/components/ui/model-selector";

interface QueryFormProps {
  query: string;
  setQuery: (query: string) => void;
  isExecuting: boolean;
  onExecuteClick: (model?: ModelType) => void;
  placeholder?: string;
  placeholderType?: TypewriterTextType;
  buttonText?: string;
  showClearButton?: boolean;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
  className?: string;
  disabled?: boolean;
  enableTypewriter?: boolean;
  stopTypewriter?: boolean;
  showModelSelector?: boolean;
}

export function QueryForm({
  query,
  setQuery,
  isExecuting,
  onExecuteClick,
  placeholder = "Ask a question about your uploaded files...",
  placeholderType = "file",
  buttonText = "Ask",
  showClearButton = true,
  showUploadButton = false,
  onUploadClick,
  className = "",
  disabled = false,
  enableTypewriter = true,
  stopTypewriter = false,
  showModelSelector = false,
}: QueryFormProps) {
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const fallbackTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini');

  // Auto-resize the contenteditable div
  const autoResize = useCallback(() => {
    if (contentEditableRef.current) {
      const element = contentEditableRef.current;
      element.style.height = "auto";
      const scrollHeight = element.scrollHeight;
      const maxHeight = 200; // 200px max height

      // Ensure content stays within bounds
      if (scrollHeight > maxHeight) {
        element.style.height = `${maxHeight}px`;
        element.style.overflowY = "auto";
      } else {
        element.style.height = `${scrollHeight}px`;
        element.style.overflowY = "hidden";
      }

      // Ensure horizontal overflow is handled
      element.style.overflowX = "hidden";
      element.style.wordBreak = "break-word";
      element.style.overflowWrap = "break-word";
    }
  }, []);

  // Get text content from contenteditable div
  const getTextContent = useCallback(() => {
    if (!contentEditableRef.current) return "";
    return contentEditableRef.current.textContent || "";
  }, []);

  // Set text content to contenteditable div
  const setTextContent = useCallback(
    (text: string) => {
      if (!contentEditableRef.current) return;

      if (text === "") {
        contentEditableRef.current.innerHTML = "<p><br></p>";
      } else {
        // Preserve line breaks and ensure proper wrapping
        const lines = text.split("\n");
        const html = lines.map((line) => `<p>${line || "<br>"}</p>`).join("");
        contentEditableRef.current.innerHTML = html;
      }

      // Apply overflow constraints after setting content
      if (contentEditableRef.current) {
        contentEditableRef.current.style.wordBreak = "break-word";
        contentEditableRef.current.style.overflowWrap = "break-word";
        contentEditableRef.current.style.maxWidth = "100%";
        contentEditableRef.current.style.boxSizing = "border-box";
      }

      autoResize();
    },
    [autoResize]
  );

  // Sync contenteditable with query state
  useEffect(() => {
    const currentText = getTextContent();
    if (currentText !== query) {
      setTextContent(query);
    }
  }, [query, getTextContent, setTextContent]);

  // Stop typewriter effect when stopTypewriter prop is true
  useEffect(() => {
    if (stopTypewriter) {
      setHasUserInteracted(true);
    }
  }, [stopTypewriter]);

  const handleClear = () => {
    setQuery("");
    setTextContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop typewriter effect when user starts typing
    setHasUserInteracted(true);

    // Handle Enter key
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Shift+Enter: Allow new line (default behavior)
        return;
      } else {
        // Enter: Submit form
        e.preventDefault();
        if (!isComposing && query.trim()) {
          onExecuteClick(selectedModel);
        }
      }
    }

    // Handle other shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "a":
          // Ctrl+A: Select all (allow default)
          break;
        case "z":
          // Ctrl+Z: Undo (allow default)
          break;
        case "y":
          // Ctrl+Y: Redo (allow default)
          break;
        default:
          break;
      }
    }
  };

  const handleFocus = () => {
    setHasUserInteracted(true);
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleInput = () => {
    setHasUserInteracted(true);

    if (contentEditableRef.current) {
      // Apply overflow constraints during typing
      contentEditableRef.current.style.wordBreak = "break-word";
      contentEditableRef.current.style.overflowWrap = "break-word";
      contentEditableRef.current.style.maxWidth = "100%";
      contentEditableRef.current.style.boxSizing = "border-box";
      contentEditableRef.current.style.overflowX = "hidden";
    }

    const newText = getTextContent();
    setQuery(newText);
    autoResize();
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");

    // Insert plain text at cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Split text by lines and create text nodes
      const lines = text.split("\n");
      lines.forEach((line, index) => {
        if (index > 0) {
          // Add line break for new lines
          const br = document.createElement("br");
          range.insertNode(br);
          range.setStartAfter(br);
        }
        if (line) {
          const textNode = document.createTextNode(line);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
        }
      });

      // Update selection and trigger input
      selection.removeAllRanges();
      selection.addRange(range);
      handleInput();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onExecuteClick(selectedModel);
      }}
      className={`relative -mt-16 px-0 z-10 w-full ${className}`}
      style={{
        background:
          "var(--components-paper-bg-paper-blur, rgba(255, 255, 255, 0.04))",
        borderRadius: "25px",
        padding: "16px",
      }}
    >
      {/* Fallback textarea for accessibility */}
      <textarea
        ref={fallbackTextareaRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: "none" }}
      />


      {/* Main contenteditable input */}
      <div className="relative w-full">
        <div
          ref={contentEditableRef}
          contentEditable={!disabled}
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onPaste={handlePaste}
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          data-virtualkeyboard="true"
          className={`
            w-full text-white resize-none bg-transparent border-0 outline-none focus:outline-none
            text-sm leading-relaxed min-h-[24px] max-h-[200px] overflow-hidden
            ${
              !hasUserInteracted && enableTypewriter
                ? "opacity-0"
                : "opacity-100"
            }
            ${isFocused ? "ring-0" : ""}
          `}
          style={{
            lineHeight: "1.5",
            padding: "0",
            margin: "0",
            background: "transparent !important",
            border: "none !important",
            boxShadow: "none !important",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            wordBreak: "break-word",
            hyphens: "auto",
            transition: "opacity 0.3s ease",
            minWidth: "0",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        />

        {/* Custom placeholder with typewriter effect */}
        {!hasUserInteracted && enableTypewriter && (
          <div
            className="absolute inset-0 pointer-events-none flex items-start pt-0"
            style={{
              color: "rgb(156, 163, 175)", // text-gray-400
              fontFamily: "Public Sans, sans-serif",
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}
          >
            <CustomTypewriter
              texts={TYPEWRITER_TEXTS[placeholderType] || TYPEWRITER_TEXTS.general}
              typeSpeed={10}
              deleteSpeed={5}
              deleteChunkSize={4}
              pauseTime={400}
              loop={true}
              startDelay={200}
              className="text-gray-400 text-sm"
            />
          </div>
        )}

        {/* Static placeholder when no typewriter */}
        {(!enableTypewriter || hasUserInteracted) && query === "" && (
          <div
            className="absolute inset-0 pointer-events-none flex items-start pt-0 text-gray-400 text-sm"
            style={{
             
              lineHeight: "1.5",
            }}
          >
            {placeholder || "Ask anything..."}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-2 mt-3">
        {showUploadButton && onUploadClick && (
          <Button
            type="button"
            variant="outline"
            onClick={onUploadClick}
            className="text-xs cursor-pointer"
            style={{
              background:
                "var(--components-button-Fill, rgba(255, 255, 255, 0.12))",
              border: "1px solid var(--primary-16, rgba(19, 245, 132, 0.16))",
              color: "white",
              borderRadius: "99px",
              height: "36px",
              minWidth: "60px",
            }}
          >
            Upload
          </Button>
        )}
        
        {/* Model Selector */}
        {/* {showModelSelector && (
          <div className="mr-2">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              disabled={isExecuting}
            />
          </div>
        )} */}
        
        <Button
          type="submit"
          disabled={!query || !query.trim() || disabled}
          className="text-xs cursor-pointer"
          style={{
            background:
              "var(--components-button-Fill, rgba(255, 255, 255, 0.12))",
            border: "1px solid var(--primary-16, rgba(19, 245, 132, 0.16))",
            color: "var(--p-main, rgba(19, 245, 132, 1))",
            borderRadius: "99px",
            height: "36px",
            minWidth: "60px",
          }}
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
}
