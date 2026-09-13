"use client";

import { animate, createTimeline, stagger, utils } from "animejs";
import { useEffect, useRef } from "react";

import { BrandLogo } from "@/components/ui/brand-logo";
import { ButtonLink } from "@/components/ui/button";
import { SWARAS } from "@/components/ui/icons";
import { useSiteSettings } from "@/components/providers/site-settings";
import { usePrefersReducedMotion } from "@/lib/use-external-state";

/**
 * The landing hero.
 *
 * Deliberately has no photography. An earlier version crossfaded the concert
 * photographs behind this content, but every one of them has the Swarangan logo
 * projected on the screen behind the stage, so the scrim needed to be so heavy
 * that the photographs read as murk rather than as pictures — competing with the
 * wordmark while showing nothing. The photographs are far better served by the
 * Gallery, where they are seen at full strength.
 *
 * What remains is the brand on a deep blue ground, centred, with the swaras of
 * the scale rising slowly behind it. Calm, legible, and unmistakably the logo.
 */
export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { tagline } = useSiteSettings();

  // Entrance: the eyebrow, the logo settling in, then the tagline and actions.
  useEffect(() => {
    if (reducedMotion) return;

    const timeline = createTimeline({ defaults: { ease: "out(3)" } })
      .add("[data-hero='eyebrow']", {
        opacity: [0, 1],
        y: [12, 0],
        duration: 700,
      })
      .add(
        "[data-hero='logo']",
        {
          opacity: [0, 1],
          scale: [0.9, 1],
          y: [16, 0],
          filter: ["blur(10px)", "blur(0px)"],
          duration: 1300,
        },
        "-=350",
      )
      .add(
        "[data-hero='line']",
        { opacity: [0, 1], y: [16, 0], duration: 700, delay: stagger(120) },
        "-=650",
      );

    return () => {
      timeline.revert();
    };
  }, [reducedMotion]);

  // The swaras drift upward like the notes of an ascending phrase.
  useEffect(() => {
    const host = notesRef.current;
    if (!host || reducedMotion) return;

    const notes = Array.from(host.children) as HTMLElement[];
    const animations = notes.map((note, i) =>
      animate(note, {
        translateY: [utils.random(30, 90), -utils.random(120, 220)],
        translateX: [0, utils.random(-30, 30)],
        opacity: [0, 0.42, 0],
        scale: [0.75, 1.15],
        duration: utils.random(11000, 18000),
        delay: i * 1600,
        loop: true,
        ease: "inOutSine",
      }),
    );

    return () => animations.forEach((animation) => animation.revert());
  }, [reducedMotion]);

  return (
    <section
      ref={rootRef}
      className="relative isolate flex min-h-[92svh] items-center overflow-hidden bg-blue-950"
    >
      {/* A single soft radial lift, so the ground is not a flat slab. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_38%,var(--color-blue-900),transparent_70%)]"
      />

      {/* -- Rising swaras --------------------------------------------------- */}
      <div
        ref={notesRef}
        aria-hidden="true"
        data-motion="decorative"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {SWARAS.map((swara, i) => (
          <span
            key={swara.roman}
            className="text-gold-200/0 absolute text-2xl font-(--font-devanagari) select-none md:text-4xl"
            style={{ left: `${7 + i * 13}%`, bottom: "8%" }}
          >
            {swara.short}
          </span>
        ))}
      </div>

      {/* -- Content --------------------------------------------------------- */}
      <div className="container-swar relative flex flex-col items-center pt-28 pb-24 text-center">
        <p
          data-hero="eyebrow"
          className="text-gold-300 mb-8 text-xs tracking-[0.32em] uppercase opacity-0 motion-reduce:opacity-100"
        >
          Est. Singapore · Gwalior &amp; Jaipur-Atrauli gharana
        </p>

        {/* The heading IS the logo. The visually-hidden span carries the real
            text for search engines and screen readers, so the image is
            decorative and the name is not announced twice. */}
        <h1>
          <span className="sr-only">
            Swarangan — Hindustani classical vocal music classes in Singapore
          </span>
          <BrandLogo
            variant="reverse"
            alt=""
            priority
            data-hero="logo"
            className="h-auto w-[min(88vw,34rem)] opacity-0 motion-reduce:opacity-100 lg:w-[40rem]"
          />
        </h1>

        <p
          data-hero="line"
          className="text-sand-200 mt-10 max-w-2xl text-lg opacity-0 motion-reduce:opacity-100 md:text-xl"
        >
          {tagline} — Hindustani classical, semi-classical and light vocal
          music, taught in the Guru–Shishya tradition.
        </p>

        <div
          data-hero="line"
          className="mt-10 flex flex-wrap items-center justify-center gap-3 opacity-0 motion-reduce:opacity-100"
        >
          <ButtonLink href="/contact" size="lg">
            Book a trial class
          </ButtonLink>
          <ButtonLink href="/classes" variant="onDark" size="lg">
            Explore classes
          </ButtonLink>
        </div>

        {/* The seven swaras, set out plainly — an ascending scale, and a quiet
            statement of what is actually taught here. */}
        <ul
          data-hero="line"
          className="border-sand-200/15 mt-16 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t pt-7 opacity-0 motion-reduce:opacity-100"
        >
          {SWARAS.map((swara) => (
            <li key={swara.roman} className="flex items-baseline gap-1.5">
              <span
                aria-hidden="true"
                className="text-magenta-400 text-base font-(--font-devanagari)"
              >
                {swara.short}
              </span>
              <span className="text-sand-400 text-2xs tracking-[0.18em] uppercase">
                {swara.roman}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* -- Scroll cue ------------------------------------------------------ */}
      <a
        href="#what-is-hindustani-classical-music"
        className="text-sand-200/70 hover:text-sand-50 text-2xs absolute inset-x-0 bottom-5 mx-auto flex w-fit flex-col items-center gap-1 tracking-[0.2em] uppercase transition-colors"
      >
        Scroll
        <span
          aria-hidden="true"
          data-motion="decorative"
          className="from-gold-300/80 h-8 w-px bg-gradient-to-b to-transparent motion-safe:animate-pulse"
        />
      </a>
    </section>
  );
}
