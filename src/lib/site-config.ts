import type { ImageKey } from "@/content/generated/image-manifest";
import { digitsOnly } from "@/lib/utils";

/**
 * Single source of truth for everything about the business that appears in more
 * than one place: contact details, address, social links, navigation.
 *
 * These are the shipped defaults. Anything an admin can change (phone, email,
 * address, social links) is read from `site_settings` through
 * lib/cms/settings.ts, which falls back to these values field by field.
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

  /**
   * Drives canonical URLs, sitemap and OG tags. Set per environment. Trailing
   * slashes are dropped, so "https://x.app/" cannot produce "//admin" links.
   */
  url: (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.swarangan.sg"
  ).replace(/\/+$/, ""),

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
    building: "West Bay Condominium",
    locality: "Singapore",
    postalCode: "128036",
    country: "SG",
    /** The neighbourhood, as people in Singapore search for it. */
    neighbourhood: "Clementi West",
    region: "West Region",
    /**
     * Postcode, building and coordinates verified 13 Sep 2026 against OneMap,
     * the Singapore Land Authority's official address service. (OpenStreetMap
     * gave a different postcode and was wrong; the old site's 128036 is right.)
     * The coordinates feed structured data, where a wrong pin hurts local
     * search.
     */
    geo: { lat: 1.298739, lng: 103.766369 },
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

  /**
   * The school's affiliation. Swarangan previously also listed Suro Bharati
   * Sangeet Kala Kendra; that reference was removed at Amit's request
   * (13 Sep 2026), leaving Bharati Vidyapeeth as the single affiliation.
   */
  affiliation: {
    name: "Bharati Vidyapeeth School of Performing Arts",
    place: "Pune, India",
    logo: "affiliations/bharati-vidyapeeth.jpg" as ImageKey,
    /** As listed on the legacy site: "Diploma certifications". */
    certifications: ["Vocal", "Instrumental", "Indian dance forms"],
  },
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
  const { street, unit, building, locality, postalCode } = siteConfig.address;
  return `${street}, ${unit} ${building}, ${locality} ${postalCode}`;
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
