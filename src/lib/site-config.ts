import type { ImageKey } from "@/content/generated/image-manifest";
import { digitsOnly } from "@/lib/utils";

/**
 * Single source of truth for everything about the business that appears in more
 * than one place: contact details, address, social links, navigation.
 *
 * Phase 2 replaces the literals below with a read from the Supabase
 * `site_settings` table. Nothing else changes, because every component reads
 * from here rather than hard-coding a number or a URL.
 */

/**
 * Confirmed by Amit (13 Sep 2026): +65 8189 5399.
 * The legacy Contact page showed "8189 3599" — that was the typo. This one value
 * drives the tel: link, the WhatsApp deep link and the structured data.
 */
const PHONE_E164 = "+6581895399";

export const CLASS_ENQUIRY_MESSAGE =
  "Hello Swarangan, I would like to know more about your Hindustani vocal music classes.";

export const siteConfig = {
  name: "Swarangan",
  /** Used in <title> templates and structured data. */
  legalName: "Swarangan",
  tagline: "Hindustani vocal music, Singapore",
  description:
    "Swarangan teaches Hindustani classical, semi-classical and light vocal music in Singapore. Individual and group classes for children and adults, in person, at home or online.",

  /** Drives canonical URLs, sitemap and OG tags. Set per environment. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.swarangan.sg",

  contact: {
    phoneE164: PHONE_E164,
    /** Display form, as written on the legacy site. */
    phoneDisplay: "+65 8189 5399",
    /** Confirmed with Amit: WhatsApp is the same number as the phone. */
    whatsappE164: PHONE_E164,
    email: "info@swarangan.sg",
  },

  address: {
    street: "52 West Coast Crescent",
    unit: "#07-09",
    locality: "Singapore",
    postalCode: "128036",
    country: "SG",
    /**
     * Neighbourhood, as locals search for it. Verified against OpenStreetMap,
     * which places 52 West Coast Crescent in Clementi West.
     */
    neighbourhood: "Clementi West",
    region: "West Region",
    /**
     * Verified 13 Sep 2026 against OpenStreetMap for 52 West Coast Crescent.
     * (An earlier estimate was ~700 m out.) Used in structured data, where a
     * wrong pin actively hurts local search.
     */
    geo: { lat: 1.298694, lng: 103.766358 },
  },

  /** ACRA business registration, shown in the footer as on the legacy site. */
  businessRegistration: "53370759E",

  social: {
    facebook: "https://www.facebook.com/SwaranganSingapore/",
    youtube: "https://www.youtube.com/channel/UCRUFat39YgpIP3JmSa0dlQA",
    /** Channel id, for the keyless public RSS feed of latest uploads. */
    youtubeChannelId: "UCRUFat39YgpIP3JmSa0dlQA",
    instagram: "https://www.instagram.com/swarangan.sg/",
  },

  affiliations: [
    {
      name: "Bharati Vidyapeeth School of Performing Arts",
      place: "Pune, India",
      logo: "affiliations/bharati-vidyapeeth.jpg" as ImageKey | null,
      note: "Diploma certifications in vocal, instrumental and Indian dance forms.",
    },
    {
      name: "Suro Bharati Sangeet Kala Kendra",
      place: "West Bengal, India",
      // Logo removed at Amit's request (13 Sep 2026); the affiliation stays.
      logo: null as ImageKey | null,
      note: "Vocal diploma certifications.",
    },
  ],
} as const;

/** Primary navigation. Gallery is photographs only; video lives under Social. */
export const navigation = [
  { href: "/", label: "Home" },
  { href: "/classes", label: "Classes" },
  { href: "/gallery", label: "Gallery" },
  { href: "/social", label: "Social Presence" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Link helpers.
 *
 * Return types are the template-literal shapes rather than plain `string`, so
 * they satisfy ButtonLink's external-href type and a malformed scheme is caught
 * at compile time instead of producing a dead link.
 */

/** `tel:` href for the business number. */
export const telHref: `tel:${string}` = `tel:${siteConfig.contact.phoneE164}`;

/** `mailto:` href for the business address. */
export const mailtoHref: `mailto:${string}` = `mailto:${siteConfig.contact.email}`;

/**
 * Build a WhatsApp deep link with a pre-filled message. Defaults to the general
 * class enquiry so a visitor never has to compose one from scratch.
 */
export function whatsappHref(
  message: string = CLASS_ENQUIRY_MESSAGE,
): `https://${string}` {
  const number = digitsOnly(siteConfig.contact.whatsappE164);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** One-line address, used in the footer and structured data. */
export function formattedAddress(): string {
  const { street, unit, locality, postalCode } = siteConfig.address;
  return `${street}, ${unit}, ${locality} ${postalCode}`;
}

/**
 * Keyless Google Maps embed. The plain `maps?output=embed` endpoint needs no API
 * key and no billing account, which is what keeps the map inside the free tier.
 */
export function mapEmbedSrc(): `https://${string}` {
  const query = encodeURIComponent(
    `${siteConfig.address.street} ${siteConfig.address.unit} Singapore ${siteConfig.address.postalCode}`,
  );
  return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
}

/** Deep link that opens directions in the visitor's maps app. */
export function directionsHref(): `https://${string}` {
  const query = encodeURIComponent(formattedAddress());
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}
