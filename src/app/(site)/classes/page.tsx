import type { Metadata } from "next";

import {
  ClassOfferingsGrid,
  LocationsGrid,
} from "@/components/classes/offering-grids";
import { BreadcrumbSchema } from "@/components/seo/structured-data";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { ProseSection, Section } from "@/components/ui/section";
import { WhatsAppIcon } from "@/components/ui/icons";
import {
  getClassOfferings,
  getFeePlans,
  getLocations,
  getSection,
  getSettings,
} from "@/lib/cms/repository";
import { whatsappHrefFor } from "@/lib/cms/settings";

export const metadata: Metadata = {
  title: "Classes",
  description:
    "Individual and group Hindustani vocal music classes in Singapore — beginner classes for children and adults, and advanced classes. In person at West Coast, at your home, or online.",
  alternates: { canonical: "/classes" },
};

/**
 * Classes page.
 *
 * Gathers the class and location content from the home page seed — the same
 * objects, not copies — so the two pages can never disagree about what is
 * taught or where.
 */
export default async function ClassesPage() {
  const [whyBlock, offerings, locations, feePlans, settings] =
    await Promise.all([
      getSection("why-hindustani-classical-music"),
      getClassOfferings(),
      getLocations(),
      getFeePlans(),
      getSettings(),
    ]);

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Classes", href: "/classes" },
        ]}
      />

      <PageHeader
        eyebrow="What we teach"
        title="Classes at Swarangan"
        lead="Individual and group classes in Hindustani classical, semi-classical and light vocal music — for children and adults, at every level."
        image="events/af2024-young-students.jpg"
      />

      <Section
        eyebrow="Choose your starting point"
        title="Our classes"
        swaraIndex={0}
      >
        <ClassOfferingsGrid
          offerings={offerings}
          note={settings.classesNote}
          headingLevel="h2"
        />
      </Section>

      {whyBlock && (
        <ProseSection block={whyBlock} swaraIndex={1} ground="sand" size="lg" />
      )}

      <Section
        eyebrow="Where classes happen"
        title="In the studio, at your home, or online"
        swaraIndex={2}
      >
        <LocationsGrid locations={locations} headingLevel="h2" />
      </Section>

      {/* -- Fees and batch timings ------------------------------------------
          Shown only once at least one fee plan is published from the admin. */}
      {feePlans.length > 0 && (
        <Section
          eyebrow="Fees and timings"
          title="Batches and fees"
          swaraIndex={3}
          ground="sand"
        >
          <ul className="grid gap-6 md:grid-cols-3">
            {feePlans.map((plan, i) => (
              <Reveal key={plan.key} as="li" delay={i * 0.08}>
                <div className="border-sand-300 bg-sand-50 h-full rounded-(--radius-card) border p-7">
                  <h2 className="text-xl">{plan.title}</h2>
                  <p className="text-magenta-700 mt-2 text-2xl font-(--font-display)">
                    {plan.price}
                  </p>
                  <p className="text-ink-muted mt-3 text-sm">{plan.cadence}</p>
                  {plan.note && (
                    <p className="text-ink-muted mt-3 text-xs">{plan.note}</p>
                  )}
                </div>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      <Section ground="deep" swaraIndex={4}>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-2xl md:text-3xl">Ready to begin?</h2>
            <p className="text-sand-300 mt-4">
              Tell us a little about the student — age, any previous training,
              and whether you would prefer the studio, home or online — and we
              will suggest a batch.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/contact" size="lg">
                Enquire about classes
              </ButtonLink>
              <ButtonLink
                href={whatsappHrefFor(settings)}
                variant="whatsapp"
                size="lg"
              >
                <WhatsAppIcon className="size-5" />
                Ask on WhatsApp
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
