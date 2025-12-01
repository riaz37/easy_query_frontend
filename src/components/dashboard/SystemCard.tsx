import React, { useState, useRef, useCallback } from "react";
import { SystemNode, CardPosition } from "./types";
import Image from "next/image";

interface SystemCardProps {
  node: SystemNode;
  position: CardPosition;
  isActive: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onMouseEnter: (nodeId: string) => void;
  onMouseLeave: () => void;
  onPositionChange?: (nodeId: string, newPosition: CardPosition) => void;
}

export const SystemCard: React.FC<SystemCardProps> = ({
  node,
  position,
  isActive,
  isDragging,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onPositionChange,
}) => {
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingLocal(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
    
    onMouseDown(e, node.id);
  }, [node.id, onMouseDown]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingLocal) return;
    
    e.preventDefault();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  }, [isDraggingLocal, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingLocal) return;
    
    setIsDraggingLocal(false);
    
    // Calculate new position based on drag offset
    if (onPositionChange && (dragOffset.x !== 0 || dragOffset.y !== 0)) {
      if (typeof window !== 'undefined') {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        
        const newX = Math.max(0, Math.min(100, position.x + (dragOffset.x / containerWidth) * 100));
        const newY = Math.max(0, Math.min(100, position.y + (dragOffset.y / containerHeight) * 100));
        
        onPositionChange(node.id, { x: newX, y: newY });
      }
    }
    
    setDragOffset({ x: 0, y: 0 });
  }, [isDraggingLocal, dragOffset, position, onPositionChange, node.id]);

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDraggingLocal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLocal, handleMouseMove, handleMouseUp]);

  // Calculate current position with drag offset
  const currentPosition = {
    x: typeof window !== 'undefined' ? position.x + (dragOffset.x / window.innerWidth) * 100 : position.x,
    y: typeof window !== 'undefined' ? position.y + (dragOffset.y / window.innerHeight) * 100 : position.y
  };

  const isDraggingState = isDragging || isDraggingLocal;
  const isActiveState = isActive || isDraggingState;

  return (
    <div
      ref={cardRef}
      className="system-card-container"
      style={{
        left: `${currentPosition.x}%`,
        top: `${currentPosition.y}%`,
        zIndex: isDraggingState ? 1000 : 10,
        transition: isDraggingState ? "none" : "all 0.3s ease-out",
      }}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={onMouseLeave}
    >
      <div
        className={`system-card-wrapper ${isActiveState ? "system-card-active" : "system-card-hover"} ${isDraggingState ? "system-card-dragging" : ""}`}
        onMouseDown={handleMouseDown}
        onMouseEnter={(e) => {
          if (!isDraggingLocal) {
            e.currentTarget.style.filter = "drop-shadow(0 0 40px rgba(16, 185, 129, 0.8))";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isDragging && !isDraggingLocal) {
            e.currentTarget.style.filter = "";
          }
        }}
      >
        {/* Glass Card - Dark theme only */}
        <div className={`system-card-glass ${isDraggingState ? "system-card-shadow" : ""}`}>
          {/* Animated glow dots in corners */}
          <div className="system-card-glow-dot system-card-glow-1" />
          <div className="system-card-glow-dot system-card-glow-2" />
          <div className="system-card-glow-dot system-card-glow-3" />
          <div className="system-card-glow-dot system-card-glow-4" />

          {/* Background image */}
          <div className="system-card-image-container">
            <Image
              src={node.iconPath}
              alt={node.title}
              fill
              className="system-card-image"
              priority
            />
          </div>

          {/* Text overlay */}
          <div className="system-card-text-container">
            <div className="system-card-text-content">
              <h2 className="system-card-title">
                {node.title}
              </h2>
              <p className="system-card-description">
                {node.description}
              </p>
            </div>
          </div>

          {/* Hover glow effect */}
          <div
            className={`system-card-hover-glow ${isDraggingState || isActive ? "system-card-glow-active" : "system-card-glow-hover"}`}
          />
        </div>
      </div>
    </div>
  );
};