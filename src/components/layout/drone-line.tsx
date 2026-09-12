"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * The tanpura drone.
 *
 * A single fine string down the left edge that fills as the page scrolls — the
 * visual equivalent of the drone running continuously beneath a performance.
 * Decorative and inert to assistive tech; the spring keeps it from twitching on
 * fast scroll.
 */
export function DroneLine() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  return (
    <div
      aria-hidden="true"
      className="bg-sand-300/60 pointer-events-none fixed inset-y-0 left-0 z-40 hidden w-px lg:block"
    >
      <motion.div
        style={{ scaleY: progress }}
        className="from-magenta-600 via-magenta-500 h-full w-px origin-top bg-gradient-to-b to-blue-700"
      />
    </div>
  );
}
