import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { EnquiryForm } from "@/components/contact/enquiry-form";
import { MapEmbed } from "@/components/contact/map-embed";
import { BreadcrumbSchema } from "@/components/seo/structured-data";
import { ButtonLink } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import {
  mailtoHref,
  siteConfig,
  telHref,
  whatsappHref,
} from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Swarangan for Hindustani vocal music classes in Singapore. Call or WhatsApp +65 8189 5399, email info@swarangan.sg, or send an enquiry.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ]}
      />

      <PageHeader
        eyebrow="Get in touch"
        title="Contact us"
        lead="Tell us about the student and what you would like to learn. We usually reply within a day."
      />

      <section className="py-(--spacing-section)">
        <div className="container-swar">
          <div className="grid gap-14 lg:grid-cols-12">
            {/* -- Form ----------------------------------------------------- */}
            <div className="lg:col-span-7">
              <Reveal>
                <h2 className="mb-2 text-2xl md:text-3xl">Write a message</h2>
                <p className="text-ink-muted mb-8">
                  Fields marked with an asterisk are required.
                </p>
                <EnquiryForm />
              </Reveal>
            </div>

            {/* -- Details --------------------------------------------------- */}
            <div className="lg:col-span-5">
              <Reveal delay={0.1}>
                <div className="border-sand-300 bg-sand-100 rounded-(--radius-card) border p-7">
                  <h2 className="mb-6 text-xl">Reach us directly</h2>

                  <ul className="space-y-6 text-sm">
                    <li className="flex gap-4">
                      <Phone
                        aria-hidden="true"
                        className="text-magenta-600 mt-0.5 size-5 shrink-0"
                      />
                      <div>
                        <p className="font-medium text-blue-800">Phone</p>
                        <a
                          href={telHref}
                          className="text-ink-muted hover:text-magenta-700 transition-colors"
                        >
                          {siteConfig.contact.phoneDisplay}
                        </a>
                        {/* Amit's request: WhatsApp right beside the number. */}
                        <div className="mt-3">
                          <ButtonLink
                            href={whatsappHref()}
                            variant="whatsapp"
                            size="sm"
                          >
                            <WhatsAppIcon className="size-4" />
                            Message on WhatsApp
                          </ButtonLink>
                        </div>
                      </div>
                    </li>

                    <li className="flex gap-4">
                      <Mail
                        aria-hidden="true"
                        className="text-magenta-600 mt-0.5 size-5 shrink-0"
                      />
                      <div>
                        <p className="font-medium text-blue-800">Email</p>
                        <a
                          href={mailtoHref}
                          className="text-ink-muted hover:text-magenta-700 break-all transition-colors"
                        >
                          {siteConfig.contact.email}
                        </a>
                      </div>
                    </li>

                    <li className="flex gap-4">
                      <MapPin
                        aria-hidden="true"
                        className="text-magenta-600 mt-0.5 size-5 shrink-0"
                      />
                      <div>
                        <p className="font-medium text-blue-800">Studio</p>
                        <address className="text-ink-muted not-italic">
                          {siteConfig.address.street}, {siteConfig.address.unit}
                          <br />
                          {siteConfig.address.locality} —{" "}
                          {siteConfig.address.postalCode}
                        </address>
                      </div>
                    </li>

                    <li className="flex gap-4">
                      <Clock
                        aria-hidden="true"
                        className="text-magenta-600 mt-0.5 size-5 shrink-0"
                      />
                      <div>
                        <p className="font-medium text-blue-800">Classes</p>
                        <p className="text-ink-muted">
                          At the studio, at your home, or online in any time
                          zone. Contact us for available batches.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={0.2} className="mt-8">
                <h2 className="mb-4 text-xl">Find the studio</h2>
                <MapEmbed />
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
