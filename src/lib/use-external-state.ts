"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscriptions to browser state that lives outside React.
 *
 * These all use `useSyncExternalStore`, which is the API React provides for
 * exactly this. It is SSR-safe (the server snapshot is the conservative value),
 * tear-free, and avoids the `setState` inside `useEffect` pattern that causes
 * cascading renders.
 *
 * One module, so the carousel, the header and the hero share a single
 * implementation of each subscription rather than three near-copies.
 */

/** Never matches on the server; the client re-evaluates on mount. */
const SERVER_FALSE = () => false;

/** Tracks a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  const snapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, snapshot, SERVER_FALSE);
}

/**
 * True when the visitor has asked for reduced motion.
 *
 * Components use this to skip building an animation at all; the global CSS
 * override in globals.css is the backstop for anything that slips through.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

/**
 * True once the page has scrolled more than `threshold` pixels.
 *
 * Reading the live value rather than storing it means a restored scroll
 * position is correct on the very first paint, with no flash of the wrong
 * header treatment.
 */
export function useScrolledPast(threshold: number): boolean {
  const snapshot = useCallback(() => window.scrollY > threshold, [threshold]);

  return useSyncExternalStore(subscribeToScroll, snapshot, SERVER_FALSE);
}

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

const documentHidden = () => document.hidden;

/** True while the tab is in the background — used to pause autoplay. */
export function useDocumentHidden(): boolean {
  return useSyncExternalStore(
    subscribeToVisibility,
    documentHidden,
    SERVER_FALSE,
  );
}
