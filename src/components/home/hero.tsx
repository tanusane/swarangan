"use client";

import { animate, createTimeline, stagger, utils } from "animejs";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { ButtonLink } from "@/components/ui/button";
import { getImage } from "@/components/ui/swar-image";
import type { ImageKey } from "@/content/generated/image-manifest";
import { siteConfig } from "@/lib/site-config";
import { useCarousel } from "@/lib/use-carousel";
import { cn } from "@/lib/utils";

/** Slides, in order. Each is a key into the generated image manifest. */
const SLIDES: readonly ImageKey[] = [
  "events/af2022-1.jpg",
  "events/af2026-thumri-se-ghazal-tak.jpg",
  "events/af2024-young-students.jpg",
  "events/af2024-ensemble.jpg",
];

const SLIDE_MS = 6000;

/**
 * Which raga-hour scrim applies at this local hour. The gradients themselves
 * live in globals.css, keyed off a `data-raga` attribute.
 */
function ragaForHour(hour: number): "dawn" | "day" | "dusk" | "night" {
  if (hour >= 5 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 16) return "day";
  if (hour >= 16 && hour < 20) return "dusk";
  return "night";
}

export function Hero() {
  const { index, goTo, viewportProps } = useCarousel({
    count: SLIDES.length,
    autoplayMs: SLIDE_MS,
  });

  const rootRef = useRef<HTMLElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);

  /**
   * The hour is a property of the visitor's device, not of our render, so it is
   * written straight to the DOM rather than held as state: no hydration
   * mismatch, and no re-render to apply it.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.dataset.raga = ragaForHour(new Date().getHours());
  }, []);

  // Entrance timeline: the eyebrow, then the logo settling into place, then the
  // tagline and actions. Skipped entirely for reduced motion.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
          scale: [0.88, 1],
          y: [18, 0],
          filter: ["blur(9px)", "blur(0px)"],
          duration: 1300,
        },
        "-=350",
      )
      .add(
        "[data-hero='line']",
        { opacity: [0, 1], y: [16, 0], duration: 700, delay: stagger(110) },
        "-=650",
      );

    return () => {
      timeline.revert();
    };
  }, []);

  // The drifting swar notes: the visual echo of a tanpura's open strings.
  useEffect(() => {
    const host = notesRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const notes = Array.from(host.children) as HTMLElement[];
    const animations = notes.map((note, i) =>
      animate(note, {
        translateY: [utils.random(20, 70), -utils.random(80, 170)],
        translateX: [0, utils.random(-40, 40)],
        opacity: [0, 0.5, 0],
        scale: [0.7, 1.1],
        duration: utils.random(9000, 15000),
        delay: i * 1400,
        loop: true,
        ease: "inOutSine",
      }),
    );

    return () => animations.forEach((a) => a.revert());
  }, []);

  // The reversed logo: ivory wordmark, magenta tree, for the dark hero.
  const logo = getImage("brand/logo-reverse.png");

  return (
    <section
      ref={rootRef}
      aria-label="Swarangan — Hindustani vocal music in Singapore"
      className="relative isolate flex min-h-[88svh] items-end overflow-hidden bg-blue-950 md:min-h-[92svh]"
      {...viewportProps}
    >
      {/* -- Slides ---------------------------------------------------------- */}
      <div className="absolute inset-0 -z-20">
        {SLIDES.map((slide, i) => {
          const entry = getImage(slide);
          const active = i === index;
          return (
            <div
              key={slide}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-(--ease-drift) motion-reduce:transition-none",
                active ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={entry.src}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                placeholder="blur"
                blurDataURL={entry.blurDataURL}
                data-motion="decorative"
                /* Every event photo has the projected Swarangan logo on the
                   screen behind the stage. Biasing the crop downwards fills the
                   frame with the performers instead of the projection. */
                style={{ objectPosition: "center 68%" }}
                className={cn(
                  "object-cover",
                  active &&
                    "motion-safe:animate-[kenburns_14s_ease-out_forwards]",
                )}
              />
            </div>
          );
        })}
      </div>

      {/* -- Scrim -----------------------------------------------------------
          Two layers. The raga layer carries the time-of-day colour; the reading
          panel guarantees the headline and tagline clear AA against any
          photograph, however bright. */}
      <div aria-hidden="true" className="raga-scrim absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-blue-950 via-blue-950/70 to-transparent md:bg-gradient-to-r md:from-blue-950 md:via-blue-950/88 md:via-55% md:to-blue-950/20"
      />
      {/* Suppresses the projected logo on the stage screen, which otherwise
          competes with our own wordmark in the upper half of the frame. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-950 from-5% via-blue-950/70 via-50% to-blue-950/25"
      />

      {/* -- Drifting swar notes --------------------------------------------- */}
      <div
        ref={notesRef}
        aria-hidden="true"
        data-motion="decorative"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        {["सा", "रे", "ग", "म", "प", "ध", "नि"].map((swara, i) => (
          <span
            key={swara}
            className="text-gold-200/0 absolute text-2xl font-(--font-devanagari) select-none md:text-3xl"
            style={{ left: `${8 + i * 13}%`, bottom: "12%" }}
          >
            {swara}
          </span>
        ))}
      </div>

      {/* -- Content --------------------------------------------------------- */}
      <div className="container-swar relative max-w-3xl pt-32 pb-20 md:pb-28 lg:max-w-4xl">
        <p
          data-hero="eyebrow"
          className="text-gold-300 mb-6 text-xs tracking-[0.32em] uppercase opacity-0 motion-reduce:opacity-100"
        >
          Est. Singapore · Gwalior &amp; Jaipur-Atrauli gharana
        </p>

        {/* The heading IS the logo — the brand mark, not a typeset imitation of
            it. The h1's real text is carried by the visually-hidden span, which
            gives search engines and screen readers a full, descriptive heading;
            the image is therefore decorative (alt="") so the name is not
            announced twice. */}
        <h1 className="mb-7">
          <span className="sr-only">
            Swarangan — Hindustani classical vocal music classes in Singapore
          </span>
          <Image
            src={logo.src}
            alt=""
            width={logo.width}
            height={logo.height}
            priority
            data-hero="logo"
            className="h-auto w-[min(92%,30rem)] opacity-0 motion-reduce:opacity-100 lg:w-[34rem]"
          />
        </h1>

        <p
          data-hero="line"
          className="text-sand-200 max-w-xl text-lg opacity-0 motion-reduce:opacity-100 md:text-xl"
        >
          {siteConfig.tagline} — Hindustani classical, semi-classical and light
          vocal music, taught in the Guru–Shishya tradition.
        </p>

        <div
          data-hero="line"
          className="mt-9 flex flex-wrap items-center gap-3 opacity-0 motion-reduce:opacity-100"
        >
          <ButtonLink href="/contact" size="lg">
            Book a trial class
          </ButtonLink>
          <ButtonLink href="/classes" variant="onDark" size="lg">
            Explore classes
          </ButtonLink>
        </div>

        {/* -- Slide controls ----------------------------------------------- */}
        <div
          data-hero="line"
          className="mt-12 flex items-center gap-3 opacity-0 motion-reduce:opacity-100"
        >
          {SLIDES.map((slide, i) => (
            <button
              key={slide}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photograph ${i + 1} of ${SLIDES.length}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index
                  ? "bg-magenta-400 w-10"
                  : "bg-sand-100/45 hover:bg-sand-100/80 w-4",
              )}
            />
          ))}
        </div>
      </div>

      {/* Announce slide changes without moving focus. */}
      <p aria-live="polite" className="sr-only">
        {`Photograph ${index + 1} of ${SLIDES.length}`}
      </p>

      {/* -- Scroll cue ------------------------------------------------------ */}
      <a
        href="#what-is-hindustani-classical-music"
        className="text-2xs text-sand-200/70 hover:text-sand-50 absolute inset-x-0 bottom-5 mx-auto flex w-fit flex-col items-center gap-1 tracking-[0.2em] uppercase transition-colors"
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
