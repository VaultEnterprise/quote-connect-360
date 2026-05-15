import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * EnrollmentStepTransition
 * Smooth animated transitions between wizard steps with fade + slide.
 * Improves UX on both desktop and mobile.
 */
export default function EnrollmentStepTransition({ children, stepId }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepId}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}