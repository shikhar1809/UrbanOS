'use client';

import React, { useState, useEffect, useRef, ReactNode, HTMLAttributes } from 'react';

interface MagnetProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 150,
  disabled = false,
  magnetStrength = 15,
  activeTransition = 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  inactiveTransition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  wrapperClassName = '',
  innerClassName = '',
  ...props
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      setIsActive(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;

      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!magnetRef.current) return;

        const rect = magnetRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from cursor to center
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Check if cursor is within magnetic field (padding distance)
        if (distance < padding) {
          setIsActive(true);
          
          // Calculate attraction strength based on distance (closer = stronger)
          // Inverse relationship: closer cursor = stronger pull
          const attractionStrength = 1 - (distance / padding);
          const strength = attractionStrength * attractionStrength; // Quadratic for smoother falloff

          // Calculate offset with distance-based strength
          // Divide by magnetStrength to control how much it moves
          const maxOffset = (padding * strength) / magnetStrength;
          const offsetX = (deltaX / distance) * maxOffset * strength;
          const offsetY = (deltaY / distance) * maxOffset * strength;

          setPosition({ 
            x: offsetX, 
            y: offsetY 
          });
        } else {
          // Cursor is outside magnetic field - return to original position
          if (isActive) {
            setIsActive(false);
            setPosition({ x: 0, y: 0 });
          }
        }
      });
    };

    const handleMouseLeave = () => {
      // Return to original position when mouse leaves the area
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsActive(false);
      setPosition({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [padding, disabled, magnetStrength, isActive]);

  const transitionStyle = isActive ? activeTransition : inactiveTransition;

  return (
    <div
      ref={magnetRef}
      className={wrapperClassName}
      style={{ position: 'relative', display: 'inline-block' }}
      {...props}
    >
      <div
        className={innerClassName}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: transitionStyle,
          willChange: 'transform'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Magnet;

