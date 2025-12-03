import React, { useRef, useState } from "react";
import { SystemCard } from "./SystemCard";
import { Spotlight } from "../ui/spotlight";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { SYSTEM_NODES, INITIAL_CARD_POSITIONS } from "./constants";
import Image from "next/image";

const Dashboard: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  // Use custom hooks for drag and drop functionality
  const { cardPositions, dragging, handleMouseDown } = useDragAndDrop({
    initialPositions: INITIAL_CARD_POSITIONS,
    containerRef: mountRef,
  });

  const handleNodeMouseEnter = (nodeId: string): void => {
    if (!dragging) {
      setActiveNode(nodeId);
    }
  };

  const handleNodeMouseLeave = (): void => {
    if (!dragging) {
      setActiveNode(null);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Frame SVG Background */}
      <div className="dashboard-background-frame">
        <Image
          src="/dashboard/frame.svg"
          alt="Background Frame"
          fill
          className="dashboard-frame-image"
          priority
        />
      </div>

      {/* Brain Model SVG - Responsive centered design */}
      <div className="dashboard-brain-container">
        <div className="dashboard-brain-wrapper">
          {/* Circle Border - Responsive positioning */}
          <div className="dashboard-circle-border">
            <Image
              src="/dashboard/circle.svg"
              alt="Circle Border"
              fill
              className="dashboard-circle-image"
              priority
            />
          </div>
          
          {/* Brain Model Container - Responsive centered */}
          <div className="dashboard-brain-model">
            <Image
              src="/dashboard/brainmodel.svg"
              alt="Brain Model"
              fill
              className="dashboard-brain-image"
              priority
            />
          </div>
        </div>
      </div>

      {/* Overlay Content - Dark theme only */}
      <div className="dashboard-overlay">
        {/* System Cards - Hidden on mobile, visible on desktop */}
        <div className="dashboard-cards-container hidden md:block">
          {SYSTEM_NODES.map((node, index) => (
            <SystemCard
              key={node.id}
              node={node}
              position={cardPositions[index]}
              isActive={activeNode === node.id}
              isDragging={dragging === node.id}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleNodeMouseEnter}
              onMouseLeave={handleNodeMouseLeave}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
