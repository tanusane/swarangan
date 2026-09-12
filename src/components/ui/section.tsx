import type { ReactNode } from "react";

import { Reveal } from "@/components/ui/reveal";
import { swaraForIndex } from "@/components/ui/icons";
import type { ContentBlock } from "@/content/types";
import { cn } from "@/lib/utils";

export type SectionGround = "ivory" | "sand" | "deep";

interface SectionProps {
  /** Anchor id, also used by the in-page navigation. */
  id?: string;
  eyebrow?: string;
  title?: string;
  /**
   * Position of this section on the page. Selects which swara is shown beside
   * the heading, so scrolling the page traverses the ascending scale.
   */
  swaraIndex?: number;
  ground?: SectionGround;
  /** Constrain children to a reading measure rather than the full grid. */
  prose?: boolean;
  className?: string;
  children: ReactNode;
}

const GROUNDS: Record<SectionGround, string> = {
  ivory: "bg-sand-50 text-ink",
  sand: "bg-sand-200 text-ink",
  deep: "bg-blue-950 text-sand-100 [&_h2]:text-sand-50 [&_h3]:text-sand-50",
};

/**
 * The one section wrapper.
 *
 * Owns vertical rhythm, the ground colour, the container measure and the
 * eyebrow/swara/title heading block. Every page section on the site goes through
 * this, which is what makes the alignment consistent — the old site positioned
 * each block by hand and drifted.
 */
export function Section({
  id,
  eyebrow,
  title,
  swaraIndex,
  ground = "ivory",
  prose = false,
  className,
  children,
}: SectionProps) {
  const swara = swaraIndex === undefined ? null : swaraForIndex(swaraIndex);
  const onDark = ground === "deep";

  return (
    <section
      id={id}
      className={cn("py-(--spacing-section)", GROUNDS[ground], className)}
    >
      <div className={prose ? "container-prose" : "container-swar"}>
        {(eyebrow || title) && (
          <Reveal className="mb-10 md:mb-14">
            <div className="flex items-start gap-4">
              {swara && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 shrink-0 text-2xl leading-none font-(--font-devanagari) select-none",
                    onDark ? "text-gold-300/70" : "text-magenta-300",
                  )}
                >
                  {swara.short}
                </span>
              )}
              <div>
                {eyebrow && (
                  <p
                    className={cn(
                      "mb-2 text-xs font-medium tracking-[0.18em] uppercase",
                      onDark ? "text-gold-300" : "text-magenta-700",
                    )}
                  >
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h2 className="text-balance-display text-3xl md:text-4xl">
                    {title}
                  </h2>
                )}
              </div>
            </div>
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

/**
 * A thin gold rule with the songbird's swar glyph at its centre — the section
 * divider described in the design system.
 */
export function SwarDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex items-center justify-center gap-4", className)}
    >
      <span className="to-gold-300 h-px w-16 bg-gradient-to-r from-transparent sm:w-28" />
      <span className="text-gold-500 text-sm font-(--font-devanagari) select-none">
        ॐ
      </span>
      <span className="to-gold-300 h-px w-16 bg-gradient-to-l from-transparent sm:w-28" />
    </div>
  );
}

/**
 * A whole section that is nothing but a heading and some paragraphs.
 *
 * Several blocks of the legacy copy are exactly this shape, and two pages show
 * the same "Why Hindustani Classical Music" block, so it lives here once rather
 * than being re-typed per page. `swaraIndex` stays a prop because a section's
 * place in the scale is a property of the page it sits on, not of the content.
 */
export function ProseSection({
  block,
  swaraIndex,
  ground = "ivory",
  size = "base",
}: {
  block: ContentBlock;
  swaraIndex?: number;
  ground?: SectionGround;
  /** "lg" for a short standalone block; "base" for long-form copy. */
  size?: "base" | "lg";
}) {
  return (
    <Section
      id={block.key}
      eyebrow={block.eyebrow}
      title={block.title}
      swaraIndex={swaraIndex}
      ground={ground}
    >
      <div className="max-w-3xl space-y-5">
        {block.body.map((paragraph) => (
          <Reveal key={paragraph.slice(0, 40)}>
            <p
              className={cn(
                "text-ink-muted",
                size === "lg" ? "text-lg" : undefined,
              )}
            >
              {paragraph}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
