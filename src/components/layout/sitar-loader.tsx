"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/**
 * The landing animation: a sitar being played.
 *
 * It plays every time the home page is opened — on first arrival, on refresh,
 * and on coming back to Home from another page — and holds for a few seconds so
 * the animation can be enjoyed rather than glimpsed. Other pages never show it.
 *
 * It can never trap anyone: it is click-to-skip and Escape-to-skip, and the page
 * behind it is fully rendered the whole time — an overlay, never a gate on
 * content, so it costs nothing in SEO. Anyone who prefers reduced motion never
 * sees it at all.
 */

/** How long the intro holds before fading out. */
const INTRO_MS = 3500;
/** Length of the fade-out, matched to the CSS transition below. */
const FADE_MS = 600;

/** The store never emits; the preference is read once per page load. */
const noopSubscribe = () => () => {};
const prefersMotion = () =>
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** The server cannot know, so it renders nothing and the client decides. */
const neverOnServer = () => false;

export function SitarLoader() {
  const pathname = usePathname();
  const motionOk = useSyncExternalStore(
    noopSubscribe,
    prefersMotion,
    neverOnServer,
  );

  // Leaving Home unmounts the intro, so returning mounts a fresh one that plays
  // again from the start.
  return motionOk && pathname === "/" ? <SitarIntro /> : null;
}

function SitarIntro() {
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const visible = !dismissed;

  useEffect(() => {
    if (!visible) return;

    const timer = window.setTimeout(() => setLeaving(true), INTRO_MS);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLeaving(true);
    };
    window.addEventListener("keydown", onKey);

    // Nothing behind the overlay should scroll while it is up.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  // Remove from the tree once the fade-out has finished.
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setDismissed(true), FADE_MS);
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
