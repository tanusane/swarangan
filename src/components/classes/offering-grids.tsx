import { uiIcons } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { TiltCard } from "@/components/ui/tilt-card";
import type { ClassOffering, LocationOption } from "@/content/types";

/**
 * The class-offering and location card grids.
 *
 * Both the home page and the Classes page show these, so they live here once
 * rather than as two copies that would drift the moment a card gains a field.
 *
 * `headingLevel` exists because heading rank is a property of the page, not of
 * the component: on the home page these sit under an <h2> section heading and
 * so must be <h3>, while on the Classes page the section heading IS the <h1>
 * and these become <h2>. Hard-coding either would break the document outline on
 * one of the two pages.
 */
type HeadingLevel = "h2" | "h3";

const CARD =
  "flex h-full flex-col rounded-(--radius-card) border border-sand-300 p-7";

export function ClassOfferingsGrid({
  offerings,
  note,
  headingLevel: Heading = "h3",
}: {
  offerings: readonly ClassOffering[];
  /** Shown beneath the cards, e.g. "*Individual and group classes available." */
  note?: string;
  headingLevel?: HeadingLevel;
}) {
  return (
    <>
      <ul className="grid gap-6 md:grid-cols-3">
        {offerings.map((offering, i) => (
          <Reveal key={offering.key} as="li" variant="leaf" delay={i * 0.08}>
            <TiltCard
              className={`${CARD} bg-sand-100 hover:shadow-(--shadow-lift-lg)`}
            >
              <span
                aria-hidden="true"
                className="bg-magenta-600/10 text-magenta-700 mb-4 inline-flex size-11 items-center justify-center rounded-full text-lg font-(--font-display)"
              >
                {i + 1}
              </span>
              <Heading className="mb-2.5 text-xl">{offering.title}</Heading>
              <p className="text-ink-muted text-sm">{offering.description}</p>
            </TiltCard>
          </Reveal>
        ))}
      </ul>

      {note && (
        <Reveal delay={0.2}>
          <p className="text-ink-muted mt-8 text-sm italic">{note}</p>
        </Reveal>
      )}
    </>
  );
}

export function LocationsGrid({
  locations,
  headingLevel: Heading = "h3",
}: {
  locations: readonly LocationOption[];
  headingLevel?: HeadingLevel;
}) {
  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {locations.map((option, i) => {
        const Icon = uiIcons[option.icon];
        return (
          <Reveal key={option.key} as="li" delay={i * 0.08}>
            <TiltCard
              className={`${CARD} bg-sand-50 hover:shadow-(--shadow-lift)`}
            >
              <Icon
                aria-hidden="true"
                className="text-magenta-600 mb-4 size-7"
              />
              <Heading className="mb-2 text-lg">{option.title}</Heading>
              <p className="text-ink-muted text-sm">{option.description}</p>
            </TiltCard>
          </Reveal>
        );
      })}
    </ul>
  );
}
