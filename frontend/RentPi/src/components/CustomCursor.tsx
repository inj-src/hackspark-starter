import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Use springs for smooth following
  const springX = useSpring(-100, { stiffness: 500, damping: 28, mass: 0.5 });
  const springY = useSpring(-100, { stiffness: 500, damping: 28, mass: 0.5 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      springX.set(e.clientX);
      springY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Determine if we're hovering over a clickable element
      const computedCursor = window.getComputedStyle(target).cursor;
      const isClickable = 
        computedCursor === 'pointer' ||
        computedCursor === 'grab' ||
        computedCursor === 'grabbing' ||
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') !== null ||
        target.closest('a') !== null;
      
      setIsHovering(isClickable);
    };

    const handleMouseLeave = () => setIsVisible(false);

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [springX, springY, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Small dark inner dot (follows instantly) */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-slate-900 rounded-full pointer-events-none z-[9999]"
        animate={{
          x: mousePosition.x - 5,
          y: mousePosition.y - 5,
          scale: isHovering ? 0 : 1,
        }}
        transition={{ type: 'tween', ease: 'linear', duration: 0 }}
      />
      {/* Outer ring (follows smoothly with spring) */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9998] flex items-center justify-center"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 1.5 : 1,
          backgroundColor: isHovering ? 'rgba(34, 197, 94, 0.2)' : 'rgba(15, 23, 42, 0)',
          borderColor: isHovering ? 'rgba(34, 197, 94, 0.8)' : 'rgba(15, 23, 42, 0.8)',
          borderWidth: '2px',
        }}
        transition={{ scale: { type: 'spring', stiffness: 300, damping: 20 } }}
      />
    </>
  );
};

export default CustomCursor;
