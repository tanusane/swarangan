"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  useDocumentHidden,
  usePrefersReducedMotion,
} from "@/lib/use-external-state";

export interface UseCarouselOptions {
  /** Number of slides. */
  count: number;
  /** Wrap from last to first. Default true. */
  loop?: boolean;
  /** Advance automatically every N ms. Omit or 0 to disable. */
  autoplayMs?: number;
  /** Start on this index. Default 0. */
  initialIndex?: number;
}

export interface UseCarouselResult {
  index: number;
  goTo: (next: number) => void;
  next: () => void;
  previous: () => void;
  /** True while autoplay is suspended (hover, focus, reduced motion, hidden tab). */
  isPaused: boolean;
  setPaused: (paused: boolean) => void;
  /** Spread onto the scrolling viewport element. */
  viewportProps: {
    onKeyDown: (event: React.KeyboardEvent) => void;
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocusCapture: () => void;
    onBlurCapture: () => void;
    tabIndex: 0;
    role: "group";
    "aria-roledescription": "carousel";
  };
}

/** Distance in px a pointer must travel horizontally to count as a swipe. */
const SWIPE_THRESHOLD = 44;

/**
 * The one carousel engine in the app.
 *
 * Owns index maths, looping, autoplay with correct pause semantics, keyboard
 * navigation and pointer swiping — but renders nothing and imposes no styling,
 * so the hero, the testimonials and the gallery lightbox all drive their very
 * different presentations from this single implementation.
 *
 * Autoplay pauses on hover, on keyboard focus within the carousel, when the tab
 * is hidden, and permanently when the visitor prefers reduced motion.
 */
export function useCarousel({
  count,
  loop = true,
  autoplayMs = 0,
  initialIndex = 0,
}: UseCarouselOptions): UseCarouselResult {
  const [rawIndex, setIndex] = useState(initialIndex);
  const [interacting, setInteracting] = useState(false);
  const tabHidden = useDocumentHidden();
  const reducedMotion = usePrefersReducedMotion();
  const pointerStartX = useRef<number | null>(null);

  // Derived rather than corrected in an effect, so a shrinking slide count can
  // never render a frame pointing at a slide that no longer exists.
  const index = Math.min(rawIndex, Math.max(count - 1, 0));

  const goTo = useCallback(
    (target: number) => {
      if (count <= 0) return;
      setIndex(
        loop
          ? ((target % count) + count) % count
          : Math.min(Math.max(target, 0), count - 1),
      );
    },
    [count, loop],
  );

  // Read from a ref-free closure over `index` via the functional updater so the
  // autoplay timer never needs re-creating when the index changes.
  const next = useCallback(() => {
    setIndex((current) =>
      loop
        ? (current + 1) % count
        : Math.min(current + 1, Math.max(count - 1, 0)),
    );
  }, [count, loop]);

  const previous = useCallback(() => {
    setIndex((current) =>
      loop ? (current - 1 + count) % count : Math.max(current - 1, 0),
    );
  }, [count, loop]);

  const isPaused = interacting || tabHidden || reducedMotion;

  useEffect(() => {
    if (!autoplayMs || isPaused || count < 2) return;
    const timer = window.setInterval(next, autoplayMs);
    return () => window.clearInterval(timer);
  }, [autoplayMs, isPaused, count, next]);

  const viewportProps = useMemo(
    () =>
      ({
        onKeyDown: (event: React.KeyboardEvent) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            next();
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            previous();
          } else if (event.key === "Home") {
            event.preventDefault();
            goTo(0);
          } else if (event.key === "End") {
            event.preventDefault();
            goTo(count - 1);
          }
        },
        onPointerDown: (event: React.PointerEvent) => {
          pointerStartX.current = event.clientX;
        },
        onPointerUp: (event: React.PointerEvent) => {
          const start = pointerStartX.current;
          pointerStartX.current = null;
          if (start === null) return;
          const travelled = event.clientX - start;
          if (Math.abs(travelled) < SWIPE_THRESHOLD) return;
          if (travelled < 0) next();
          else previous();
        },
        onMouseEnter: () => setInteracting(true),
        onMouseLeave: () => setInteracting(false),
        onFocusCapture: () => setInteracting(true),
        onBlurCapture: () => setInteracting(false),
        tabIndex: 0,
        role: "group",
        "aria-roledescription": "carousel",
      }) as const,
    [count, goTo, next, previous],
  );

  return {
    index,
    goTo,
    next,
    previous,
    isPaused,
    setPaused: setInteracting,
    viewportProps,
  };
}
