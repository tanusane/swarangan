import {
  ClassOfferingsGrid,
  LocationsGrid,
} from "@/components/classes/offering-grids";
import { Hero } from "@/components/home/hero";
import { SectionAside } from "@/components/home/section-aside";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { ProseSection, Section, SwarDivider } from "@/components/ui/section";
import { SlotImage } from "@/components/ui/slot-image";
import { SwarImage } from "@/components/ui/swar-image";
import { sectionAsides } from "@/content/asides";
import {
  examinationHeading,
  introBlocks,
  quote,
  teacherBlock,
  whyBlock,
} from "@/content/home";
import { siteConfig } from "@/lib/site-config";

/**
 * Home page.
 *
 * The section order is the legacy site's order, which the brief required us to
 * keep: the tradition, then the classes, then why, then where, then Tanuja,
 * then the quote and affiliations. `swaraIndex` walks the ascending scale as the
 * visitor scrolls.
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      {/* -- The tradition --------------------------------------------------- */}
      {introBlocks.map((block, i) => (
        <Section
          key={block.key}
          id={block.key}
          eyebrow={block.eyebrow}
          title={block.title}
          swaraIndex={i}
          ground={i % 2 === 0 ? "ivory" : "sand"}
        >
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="space-y-5 lg:col-span-7">
              {block.body.map((paragraph, p) => (
                <Reveal key={paragraph.slice(0, 40)} delay={p * 0.06}>
                  <p className="text-ink-muted">{paragraph}</p>
                </Reveal>
              ))}
            </div>

            {/* The margin panel. Its contents are drawn from this very
                section's copy, so the right-hand column carries something
                worth reading rather than decoration. */}
            {sectionAsides[block.key] && (
              <div className="lg:col-span-5">
                <SectionAside panel={sectionAsides[block.key]!} />
              </div>
            )}
          </div>
        </Section>
      ))}

      <SwarDivider className="bg-sand-50 py-10" />

      {/* -- Classes --------------------------------------------------------- */}
      <Section
        id="classes"
        eyebrow="What we teach"
        title="Classes at Swarangan"
        swaraIndex={4}
      >
        <ClassOfferingsGrid headingLevel="h3" />
      </Section>

      {/* -- Why ------------------------------------------------------------- */}
      <ProseSection block={whyBlock} swaraIndex={5} ground="sand" size="lg" />

      {/* -- Where ----------------------------------------------------------- */}
      <Section
        id="locations"
        eyebrow="Where classes happen"
        title="In the studio, at your home, or online"
        swaraIndex={6}
      >
        <LocationsGrid headingLevel="h3" />
      </Section>

      {/* -- Tanuja ---------------------------------------------------------- */}
      <Section
        id={teacherBlock.key}
        eyebrow={teacherBlock.eyebrow}
        title={teacherBlock.title}
        swaraIndex={7}
        ground="sand"
      >
        <div className="grid items-start gap-12 lg:grid-cols-12">
          <Reveal variant="leaf" className="lg:col-span-5">
            <figure className="relative">
              <div
                aria-hidden="true"
                className="bg-magenta-600/10 absolute -inset-3 -z-10 rounded-(--radius-card)"
              />
              {/* Replaceable from Admin -> Images. Falls back to the photo
                  that ships with the site until one is uploaded. */}
              <SlotImage
                slot="home.teacher.portrait"
                sizes="(min-width: 1024px) 38vw, 90vw"
                className="rounded-(--radius-card) shadow-(--shadow-lift-lg)"
              />
            </figure>
          </Reveal>

          <div className="space-y-5 lg:col-span-7">
            {teacherBlock.body.map((paragraph, p) => (
              <Reveal key={paragraph.slice(0, 40)} delay={p * 0.06}>
                <p className="text-ink-muted">{paragraph}</p>
              </Reveal>
            ))}
            <Reveal delay={0.25}>
              <ButtonLink href="/contact" className="mt-3">
                Enquire about classes
              </ButtonLink>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* -- Quote ----------------------------------------------------------- */}
      <section className="bg-blue-950 py-(--spacing-section)">
        <div className="container-prose text-center">
          <Reveal>
            <blockquote className="text-sand-50 text-2xl leading-snug font-(--font-display) md:text-3xl">
              <p>“{quote.text}”</p>
              <footer className="text-gold-300 mt-6 text-sm tracking-[0.16em] uppercase">
                <cite className="not-italic">— {quote.attribution}</cite>
              </footer>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* -- Affiliation ----------------------------------------------------- */}
      <Section
        id="affiliation"
        eyebrow={examinationHeading}
        title="Recognised diplomas and certification"
        swaraIndex={8}
        align="center"
      >
        <Reveal variant="leaf">
          <div className="border-sand-300 bg-sand-100 mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-(--radius-card) border px-8 py-10">
            <SwarImage
              image={siteConfig.affiliation.logo}
              sizes="(min-width: 640px) 320px, 80vw"
              className="w-full max-w-xs rounded-md bg-white object-contain p-2"
            />
            <div>
              <p className="text-ink-muted text-sm">Affiliated to</p>
              <h3 className="mt-1 text-2xl">{siteConfig.affiliation.name}</h3>
              <p className="text-magenta-700 mt-2 text-xs tracking-[0.18em] uppercase">
                {siteConfig.affiliation.place}
              </p>
            </div>
            <div>
              <p className="text-ink-muted mb-3 text-sm">
                Diploma certifications
              </p>
              <ul className="flex flex-wrap justify-center gap-2">
                {siteConfig.affiliation.certifications.map((item) => (
                  <li
                    key={item}
                    className="border-sand-300 rounded-full border bg-white px-4 py-1.5 text-sm text-blue-800"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
