"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/**
 * The landing animation: a sitar being played.
 *
 * Two rules govern this, because a splash screen is the easiest thing in web
 * design to get wrong:
 *
 *   1. It can never trap anyone. It dismisses on `load`, and unconditionally
 *      after MAX_MS whatever happens — so a stalled asset cannot hold the site
 *      hostage. It is also click-to-skip and Escape-to-skip.
 *   2. It shows once per session, not once per page view. Seeing it on every
 *      navigation would be infuriating, and it would undo the speed of a
 *      statically generated site.
 *
 * It is skipped entirely for anyone who prefers reduced motion, and the page
 * behind it is fully rendered the whole time — this is an overlay, never a gate
 * on content, so it costs nothing in SEO.
 */

/** Hard ceiling. The site is static and usually ready well before this. */
const MAX_MS = 2100;
/** Minimum, so the animation reads as intentional rather than a flicker. */
const MIN_MS = 1100;
const SESSION_KEY = "swarangan:seen-intro";

/**
 * Whether to play the intro, decided once per page load.
 *
 * Memoised at module scope so it is a stable snapshot: `useSyncExternalStore`
 * requires getSnapshot to return the same value until the store changes, and
 * this store never changes. Read-only — the session key is written later, in an
 * effect, so this stays safe to call during render.
 */
let decision: boolean | null = null;

function shouldPlayIntro(): boolean {
  if (decision !== null) return decision;

  // Anyone who has asked for reduced motion never sees it.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    decision = false;
    return decision;
  }

  // sessionStorage throws in some privacy modes; a failure here must never
  // break the page, so it simply means "show the animation".
  try {
    decision = sessionStorage.getItem(SESSION_KEY) === null;
  } catch {
    decision = true;
  }
  return decision;
}

/** The store never emits; the value is fixed for the life of the page. */
const noopSubscribe = () => () => {};
/** The server cannot know, so it renders nothing and the client decides. */
const neverOnServer = () => false;

export function SitarLoader() {
  const play = useSyncExternalStore(
    noopSubscribe,
    shouldPlayIntro,
    neverOnServer,
  );
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const visible = play && !dismissed;

  useEffect(() => {
    if (!visible) return;

    // Claim the session here rather than during render, so a re-render can
    // never consume the one showing we allow per session.
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* nothing to do — the ceiling below still dismisses it */
    }

    const startedAt = Date.now();
    let dismissTimer: number | undefined;

    const dismiss = () => {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_MS - elapsed);
      dismissTimer = window.setTimeout(() => setLeaving(true), wait);
    };

    // Whichever comes first: the page finishing, or the hard ceiling.
    const ceiling = window.setTimeout(() => setLeaving(true), MAX_MS);
    if (document.readyState === "complete") dismiss();
    else window.addEventListener("load", dismiss, { once: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLeaving(true);
    };
    window.addEventListener("keydown", onKey);

    // Nothing behind the overlay should scroll while it is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(ceiling);
      if (dismissTimer) window.clearTimeout(dismissTimer);
      window.removeEventListener("load", dismiss);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  // Remove from the tree once the fade-out has finished.
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setDismissed(true), 600);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  if (!visible) return null;

  return (
    <div
      // Not a dialog: it is a transient decoration, and announcing it would
      // interrupt a screen reader for no benefit. Hidden from the a11y tree
      // entirely — reduced-motion users never see it at all.
      aria-hidden="true"
      onClick={() => setLeaving(true)}
      className={cn(
        "fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center gap-8 bg-blue-950",
        "transition-opacity duration-500 ease-(--ease-swar)",
        leaving ? "pointer-events-none opacity-0" : "opacity-100",
      )}
    >
      <SitarFigure />

      <div className="flex flex-col items-center gap-3">
        <p className="text-gold-300 text-xs tracking-[0.34em] uppercase">
          Swarangan
        </p>
        {/* The scale, lighting up one swara at a time — the sound being tuned. */}
        <ul className="flex items-center gap-2.5">
          {["सा", "रे", "ग", "म", "प", "ध", "नि"].map((swara, i) => (
            <li
              key={swara}
              className="text-magenta-300 text-sm font-(--font-devanagari)"
              style={{
                animation: `swar-light 1.75s ${i * 0.12}s ease-in-out infinite`,
              }}
            >
              {swara}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * The sitar, drawn rather than photographed so it scales and inherits the brand
 * colours. The long neck, the tuning pegs, the gourd, and seven strings — the
 * lower three of which vibrate as if just struck.
 */
function SitarFigure() {
  return (
    <svg
      viewBox="0 0 200 260"
      className="h-44 w-auto md:h-56"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* -- Gourd (tumba) ------------------------------------------------- */}
      <ellipse
        cx="100"
        cy="196"
        rx="52"
        ry="46"
        className="stroke-magenta-500"
        strokeWidth="2.4"
      />
      <ellipse
        cx="100"
        cy="196"
        rx="52"
        ry="46"
        className="fill-magenta-600/12"
        stroke="none"
      />
      {/* Bridge */}
      <rect
        x="86"
        y="178"
        width="28"
        height="9"
        rx="2"
        className="stroke-gold-300"
        strokeWidth="1.8"
      />

      {/* -- Neck ---------------------------------------------------------- */}
      <path
        d="M88 178 L88 34 Q88 22 100 22 Q112 22 112 34 L112 178"
        className="stroke-magenta-400"
        strokeWidth="2.4"
      />
      {/* Frets */}
      {[52, 72, 92, 112, 132, 152].map((y) => (
        <line
          key={y}
          x1="88.5"
          y1={y}
          x2="111.5"
          y2={y}
          className="stroke-gold-300/55"
          strokeWidth="1.4"
        />
      ))}

      {/* -- Tuning pegs --------------------------------------------------- */}
      {[
        [80, 44],
        [80, 62],
        [120, 52],
        [120, 70],
      ].map(([x, y]) => (
        <line
          key={`${x}-${y}`}
          x1={x === 80 ? 88 : 112}
          y1={y}
          x2={x}
          y2={y - 5}
          className="stroke-gold-300"
          strokeWidth="2.6"
        />
      ))}

      {/* -- Strings -------------------------------------------------------
          The upper four are still; the lower three vibrate, as if the phrase
          has just been struck. `string-pluck` is defined in globals.css. */}
      {[93, 97, 100, 103, 107].map((x, i) => (
        <line
          key={x}
          x1={x}
          y1="28"
          x2={x}
          y2="182"
          className="stroke-sand-200/45"
          strokeWidth="0.9"
          data-motion="decorative"
          style={
            i >= 2
              ? {
                  animation: `sitar-string 1.1s ${i * 0.14}s ease-in-out infinite`,
                  transformOrigin: "center",
                }
              : undefined
          }
        />
      ))}

      {/* -- The songbird's note, rising from the gourd -------------------- */}
      <g
        className="stroke-gold-300"
        strokeWidth="2"
        data-motion="decorative"
        style={{ animation: "note-rise 2.6s ease-in-out infinite" }}
      >
        <circle
          cx="150"
          cy="150"
          r="6"
          className="fill-gold-300"
          stroke="none"
        />
        <path d="M156 150 L156 128" />
        <path d="M156 128 Q168 124 170 134" />
      </g>
    </svg>
  );
}
