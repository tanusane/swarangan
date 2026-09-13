import type { ClassOffering, Testimonial } from "@/content/types";
import { jsonLd } from "@/lib/json-ld";
import {
  getClassOfferings,
  getSettings,
  getTestimonials,
} from "@/lib/cms/repository";
import {
  directionsHrefFor,
  phoneE164,
  type SiteSettings,
} from "@/lib/cms/settings";
import { siteConfig } from "@/lib/site-config";

/**
 * JSON-LD structured data.
 *
 * Emitted as a single `@graph` so the school, the address, Tanuja as a named
 * person, and the reviews all cross-reference each other by @id — which is what
 * lets Google associate the reviews with the business rather than treating them
 * as orphan snippets.
 *
 * Built from the same settings and content the pages render, so it can never
 * drift from what the page actually says. Admin-editable text reaches this, so
 * it is serialised with jsonLd(), which escapes anything that could close the
 * <script> tag.
 */

const SCHOOL_ID = `${siteConfig.url}/#organization`;
const PERSON_ID = `${siteConfig.url}/#tanuja-sane`;

function graph(
  settings: SiteSettings,
  classOfferings: readonly ClassOffering[],
  testimonials: readonly Testimonial[],
) {
  // Left out entirely when the admin has hidden the number from the site.
  const telephone = settings.showPhone
    ? phoneE164(settings.phoneDisplay)
    : undefined;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["MusicSchool", "LocalBusiness"],
        "@id": SCHOOL_ID,
        name: siteConfig.name,
        legalName: siteConfig.legalName,
        description: settings.description,
        url: siteConfig.url,
        telephone,
        email: settings.email,
        image: `${siteConfig.url}/images/events/af2026-thumri-se-ghazal-tak.jpg`,
        logo: `${siteConfig.url}/images/brand/logo.png`,
        address: {
          "@type": "PostalAddress",
          streetAddress: `${settings.street}, ${settings.unit} ${settings.building}`,
          addressLocality: siteConfig.address.locality,
          postalCode: settings.postalCode,
          addressCountry: siteConfig.address.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: siteConfig.address.geo.lat,
          longitude: siteConfig.address.geo.lng,
        },
        // Studio classes in the West, home classes island-wide, online anywhere.
        areaServed: [
          { "@type": "Country", name: "Singapore" },
          {
            "@type": "Place",
            name: `${siteConfig.address.neighbourhood}, Singapore`,
          },
        ],
        hasMap: directionsHrefFor(settings),
        contactPoint: {
          "@type": "ContactPoint",
          telephone,
          email: settings.email,
          contactType: "admissions",
          areaServed: "SG",
        },
        // The class catalogue, so search engines and AI assistants can answer
        // "does Swarangan teach adults?" from structured facts, not guesswork.
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Hindustani vocal music classes",
          itemListElement: classOfferings.map((offering) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Course",
              name: offering.title,
              description: offering.description,
              provider: { "@id": SCHOOL_ID },
              inLanguage: "en",
            },
          })),
        },
        founder: { "@id": PERSON_ID },
        employee: { "@id": PERSON_ID },
        sameAs: [settings.instagram, settings.youtube, settings.facebook],
        knowsAbout: [
          "Hindustani classical music",
          "Khayal",
          "Thumri",
          "Bhajan",
          "Ghazal",
          "Semi-classical vocal music",
        ],
        review: testimonials.map((item) => ({
          "@type": "Review",
          author: { "@type": "Person", name: item.author },
          reviewBody: item.body.join("\n\n"),
          itemReviewed: { "@id": SCHOOL_ID },
        })),
      },
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: "Tanuja Sane",
        jobTitle: "Hindustani vocal music teacher",
        description:
          "Founder of Swarangan, Singapore. Master of Arts in Hindustani Vocal Music from Bharati Vidyapeeth, Pune, with more than 20 years of teaching experience.",
        image: `${siteConfig.url}/images/people/tanuja-sane-tanpura.jpg`,
        worksFor: { "@id": SCHOOL_ID },
        alumniOf: {
          "@type": "CollegeOrUniversity",
          name: "Bharati Vidyapeeth",
          address: "Pune, India",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        publisher: { "@id": SCHOOL_ID },
        inLanguage: "en-SG",
      },
    ],
  };
}

export async function OrganizationSchema() {
  const [settings, offerings, testimonials] = await Promise.all([
    getSettings(),
    getClassOfferings(),
    getTestimonials(),
  ]);

  return (
    <script
      type="application/ld+json"
      // jsonLd() escapes "<", so admin-entered text cannot close this tag.
      dangerouslySetInnerHTML={{
        __html: jsonLd(graph(settings, offerings, testimonials)),
      }}
    />
  );
}

/** Breadcrumbs for any page below the root. */
export function BreadcrumbSchema({
  items,
}: {
  items: readonly { name: string; href: string }[];
}) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.href}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd(payload) }}
    />
  );
}
