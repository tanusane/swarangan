import { classOfferings } from "@/content/home";
import { testimonials } from "@/content/testimonials";
import {
  directionsHref,
  formattedAddress,
  siteConfig,
} from "@/lib/site-config";

/**
 * JSON-LD structured data.
 *
 * Emitted as a single `@graph` so the school, the address, Tanuja as a named
 * person, and the reviews all cross-reference each other by @id — which is what
 * lets Google associate the reviews with the business rather than treating them
 * as orphan snippets.
 *
 * The literals come from siteConfig and the content seed, so this can never
 * drift from what the page actually says.
 */

const SCHOOL_ID = `${siteConfig.url}/#organization`;
const PERSON_ID = `${siteConfig.url}/#tanuja-sane`;

function graph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["MusicSchool", "LocalBusiness"],
        "@id": SCHOOL_ID,
        name: siteConfig.name,
        legalName: siteConfig.legalName,
        description: siteConfig.description,
        url: siteConfig.url,
        telephone: siteConfig.contact.phoneE164,
        email: siteConfig.contact.email,
        image: `${siteConfig.url}/images/events/af2026-thumri-se-ghazal-tak.jpg`,
        logo: `${siteConfig.url}/images/brand/logo.png`,
        address: {
          "@type": "PostalAddress",
          streetAddress: `${siteConfig.address.street}, ${siteConfig.address.unit} ${siteConfig.address.building}`,
          addressLocality: siteConfig.address.locality,
          postalCode: siteConfig.address.postalCode,
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
        hasMap: directionsHref(),
        contactPoint: {
          "@type": "ContactPoint",
          telephone: siteConfig.contact.phoneE164,
          email: siteConfig.contact.email,
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
        sameAs: [
          siteConfig.social.instagram,
          siteConfig.social.youtube,
          siteConfig.social.facebook,
        ],
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

export function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      // The payload is built entirely from our own literals — no user input
      // reaches it, so there is nothing here to escape.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph()) }}
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

/** Address as a single line, for reuse in page copy. */
export const addressLine = formattedAddress;
