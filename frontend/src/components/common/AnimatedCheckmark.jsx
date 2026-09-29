import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated SVG Checkmark with path drawing animation (600ms)
 * and optional pop-in scale spring.
 */
export default function AnimatedCheckmark({
  size = 24,
  strokeColor = '#10B981',
  strokeWidth = 3,
  className = '',
  popIn = true
}) {
  return (
    <motion.div
      initial={popIn ? { scale: 0.5, opacity: 0 } : false}
      animate={popIn ? { scale: 1, opacity: 1 } : false}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 18
      }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        <motion.path
          d="M6.5 12.5L10 16L17.5 8"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.45, 1] }}
        />
      </svg>
    </motion.div>
  );
}
