"use client";

import * as motion from "motion/react-client";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The reveal styles available. "leaf" wipes in the way a leaf unfurls. */
export type RevealVariant = "rise" | "leaf" | "fade";

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  /** Stagger, in seconds. */
  delay?: number;
  className?: string;
  /** Render as something other than a div. */
  as?: "div" | "li" | "section" | "article" | "figure";
}

const VARIANTS = {
  rise: {
    hidden: { opacity: 0, y: 28 },
    shown: { opacity: 1, y: 0 },
  },
  leaf: {
    hidden: { opacity: 0, y: 24, rotate: -1.5, scale: 0.98 },
    shown: { opacity: 1, y: 0, rotate: 0, scale: 1 },
  },
  fade: {
    hidden: { opacity: 0 },
    shown: { opacity: 1 },
  },
} as const;

/**
 * The one scroll-reveal wrapper.
 *
 * Motion's `whileInView` already no-ops the transform under
 * prefers-reduced-motion when combined with the global CSS override, and the
 * element is never left invisible: the hidden state only ever animates to shown,
 * and `once` stops it re-triggering on scroll-back.
 */
export function Reveal({
  children,
  variant = "rise",
  delay = 0,
  className,
  as = "div",
}: RevealProps) {
  const Component = motion[as];

  return (
    <Component
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
      variants={VARIANTS[variant]}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
