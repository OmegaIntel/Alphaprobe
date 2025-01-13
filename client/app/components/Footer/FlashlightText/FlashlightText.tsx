import React, { useState, useRef } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface FlashlightTextProps {
  text?: string;
  spotlightSize?: number;
  textSize?: string;
  textColor?: string;
}

const FlashlightText: React.FC<FlashlightTextProps> = ({
  text = "Omega AI",
  spotlightSize = 150,
  textSize = "text-8xl",
  textColor = "text-gray-700"
}) => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
  };

  return (
    <div 
      className="inline-block relative"
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      <div 
        className={`${textSize} ${textColor} font-medium`}
        style={{
          WebkitMask: `radial-gradient(circle ${spotlightSize}px at ${mousePosition.x}px ${mousePosition.y}px, black 30%, transparent 70%)`,
          mask: `radial-gradient(circle ${spotlightSize}px at ${mousePosition.x}px ${mousePosition.y}px, black 30%, transparent 70%)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default FlashlightText;