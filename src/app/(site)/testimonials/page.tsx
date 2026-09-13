import { Quote } from "lucide-react";
import type { Metadata } from "next";

import { BreadcrumbSchema } from "@/components/seo/structured-data";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { Section, SwarDivider } from "@/components/ui/section";
import { TiltCard } from "@/components/ui/tilt-card";
import { getTestimonials } from "@/lib/cms/repository";

export const metadata: Metadata = {
  title: "Testimonials",
  description:
    "What parents and students say about learning Hindustani classical and light vocal music with Tanuja Sane at Swarangan, Singapore.",
  alternates: { canonical: "/testimonials" },
};

/**
 * Testimonials page.
 *
 * The words here belong to the people who wrote them and are rendered exactly
 * as they appear in the content seed. Nothing is truncated, reordered or
 * "tidied" — see the note in src/content/testimonials.ts.
 */
export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Testimonials", href: "/testimonials" },
        ]}
      />

      <PageHeader
        eyebrow="In their words"
        title="Testimonials"
        lead="From the parents and students who have learnt at Swarangan."
        image="events/af2024-ensemble.jpg"
      />

      <Section swaraIndex={0}>
        <ul className="grid gap-7 lg:grid-cols-2">
          {testimonials.map((testimonial, i) => (
            <Reveal
              key={testimonial.key}
              as="li"
              variant="leaf"
              delay={i * 0.08}
            >
              <TiltCard className="border-sand-300 bg-sand-100 flex h-full flex-col rounded-(--radius-card) border p-8 hover:shadow-(--shadow-lift-lg)">
                <Quote
                  aria-hidden="true"
                  className="text-magenta-300 mb-5 size-8 shrink-0"
                />
                <blockquote className="flex flex-1 flex-col">
                  <div className="text-ink-muted flex-1 space-y-4">
                    {testimonial.body.map((paragraph, p) => (
                      <p key={`${testimonial.key}-${p}`}>{paragraph}</p>
                    ))}
                  </div>
                  <footer className="border-sand-300 mt-7 border-t pt-5">
                    <cite className="text-lg font-(--font-display) text-blue-800 not-italic">
                      {testimonial.author}
                    </cite>
                  </footer>
                </blockquote>
              </TiltCard>
            </Reveal>
          ))}
        </ul>
      </Section>

      <SwarDivider className="bg-sand-50 pb-4" />

      <Section ground="sand" swaraIndex={1}>
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-2xl md:text-3xl">Come and sit in on a class</h2>
            <p className="text-ink-muted mt-4">
              The best way to know whether Swarangan suits you or your child is
              to try a class. Write to us and we will find a time.
            </p>
            <ButtonLink href="/contact" size="lg" className="mt-8">
              Book a trial class
            </ButtonLink>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
