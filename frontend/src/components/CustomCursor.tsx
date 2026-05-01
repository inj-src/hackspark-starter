import React, { useEffect, useState } from 'react';
import { motion, useSpring, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isDark = useSelector((state: RootState) => state.theme.isDark);

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

  // Theme-aware colors
  const dotColor = isDark ? '#f1f5f9' : '#0f172a'; // slate-100 in dark, slate-900 in light
  const ringIdleColor = isDark ? 'rgba(241, 245, 249, 0.8)' : 'rgba(15, 23, 42, 0.8)';
  const ringIdleBg = isDark ? 'rgba(241, 245, 249, 0)' : 'rgba(15, 23, 42, 0)';

  if (!isVisible) return null;

  return (
    <>
      {/* Inner dot — snaps instantly */}
      <motion.div
        className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full pointer-events-none z-[9999]"
        animate={{
          x: mousePosition.x - 5,
          y: mousePosition.y - 5,
          scale: isHovering ? 0 : 1,
          backgroundColor: dotColor,
        }}
        transition={{
          x: { type: 'tween', ease: 'linear', duration: 0 },
          y: { type: 'tween', ease: 'linear', duration: 0 },
          scale: { type: 'spring', stiffness: 400, damping: 25 },
          backgroundColor: { duration: 0.4 },
        }}
      />

      {/* Outer ring — spring-follows with theme color */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9998]"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isHovering ? 1.6 : 1,
          backgroundColor: isHovering ? 'rgba(34, 197, 94, 0.2)' : ringIdleBg,
          borderColor: isHovering ? 'rgba(34, 197, 94, 0.9)' : ringIdleColor,
          borderWidth: '2px',
        }}
        transition={{
          scale: { type: 'spring', stiffness: 300, damping: 20 },
          backgroundColor: { duration: 0.4 },
          borderColor: { duration: 0.4 },
        }}
      />

      {/* Theme-switch flash: brief ripple when toggling mode */}
      <AnimatePresence>
        <motion.div
          key={isDark ? 'dark-ripple' : 'light-ripple'}
          className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-[9997]"
          style={{
            x: springX,
            y: springY,
            translateX: '-50%',
            translateY: '-50%',
          }}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 4, opacity: 0 }}
          exit={{}}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
          // Color pulse: green flash on toggle
          onAnimationStart={() => {}}
        >
          <div
            className="w-full h-full rounded-full"
            style={{ backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}
          />
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default CustomCursor;
