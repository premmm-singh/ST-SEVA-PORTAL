import React from 'react';
import { motion } from 'framer-motion';

/**
 * ScrollReveal Component
 * Fades and slides elements up when 20% into viewport using Intersection Observer / Framer Motion.
 * Respects prefers-reduced-motion automatically.
 */
export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.3,
  yOffset = 20,
  threshold = 0.2
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration,
        delay,
        ease: 'easeOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
