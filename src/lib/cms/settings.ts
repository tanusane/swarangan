import { z } from "zod";

import { classesNote, quote } from "@/content/home";
import { siteConfig } from "@/lib/site-config";
import { digitsOnly } from "@/lib/utils";

/**
 * Site settings: every short, single-value piece of site-wide content an admin
 * can edit — contact details, address, social links, the tagline, the closing
 * quote.
 *
 * Stored as one JSON document in site_settings.data. Reading is TOLERANT: each
 * field is validated on its own and anything missing or malformed falls back to
 * the value that ships with the site. So a half-filled record, a typo made in
 * the Supabase dashboard, or a settings document written by an older version of
 * the site can never blank out the phone number on every page.
 */

export interface SiteSettings {
  tagline: string;
  description: string;
  quoteText: string;
  quoteAttribution: string;
  classesNote: string;
  phoneDisplay: string;
  email: string;
  street: string;
  unit: string;
  building: string;
  postalCode: string;
  instagram: HttpsUrl;
  youtube: HttpsUrl;
  facebook: HttpsUrl;
}

/** A link that must be https — enforced by the schema below. */
export type HttpsUrl = `https://${string}`;

export const DEFAULT_SETTINGS: SiteSettings = {
  tagline: siteConfig.tagline,
  description: siteConfig.description,
  quoteText: quote.text,
  quoteAttribution: quote.attribution,
  classesNote,
  phoneDisplay: siteConfig.contact.phoneDisplay,
  email: siteConfig.contact.email,
  street: siteConfig.address.street,
  unit: siteConfig.address.unit,
  building: siteConfig.address.building,
  postalCode: siteConfig.address.postalCode,
  instagram: siteConfig.social.instagram,
  youtube: siteConfig.social.youtube,
  facebook: siteConfig.social.facebook,
};

const text = (max: number) => z.string().trim().min(1).max(max);
const httpsUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => value.startsWith("https://"), "Must start with https://")
  .transform((value) => value as HttpsUrl);

/** Per-field rules, shared by the admin form and the tolerant reader. */
export const SETTINGS_FIELDS = {
  tagline: text(120),
  description: text(320),
  quoteText: text(300),
  quoteAttribution: text(80),
  classesNote: text(200),
  phoneDisplay: z
    .string()
    .trim()
    .max(32)
    .refine(
      (value) => digitsOnly(value).length >= 8,
      "Enter the number with its country code, e.g. +65 8189 5399",
    ),
  email: z.string().trim().email().max(254),
  street: text(120),
  unit: text(40),
  building: text(120),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Singapore postcodes are 6 digits"),
  instagram: httpsUrl,
  youtube: httpsUrl,
  facebook: httpsUrl,
} satisfies { [K in keyof SiteSettings]: z.ZodType<SiteSettings[K], string> };

export const settingsSchema = z.object(SETTINGS_FIELDS);

/** Whether the one-click import has run. Stored alongside the settings. */
export const IMPORTED_FLAG = "contentImported";

/**
 * Read stored settings over the defaults, field by field. Never throws.
 */
export function mergeSettings(stored: unknown): SiteSettings {
  const source =
    stored && typeof stored === "object"
      ? (stored as Record<string, unknown>)
      : {};
  const merged = { ...DEFAULT_SETTINGS };

  for (const key of Object.keys(SETTINGS_FIELDS) as (keyof SiteSettings)[]) {
    const parsed = SETTINGS_FIELDS[key].safeParse(source[key]);
    // Each field's schema produces exactly that field's type.
    if (parsed.success) (merged as Record<string, unknown>)[key] = parsed.data;
  }
  return merged;
}

export function isImported(stored: unknown): boolean {
  return (
    !!stored &&
    typeof stored === "object" &&
    (stored as Record<string, unknown>)[IMPORTED_FLAG] === true
  );
}

// ---- Derived values ------------------------------------------------------------

/**
 * "+65 8189 5399" -> "+6581895399". A number typed without a country code is
 * assumed to be Singaporean, which is the only safe assumption for this site.
 */
export function phoneE164(display: string): string {
  const digits = digitsOnly(display);
  if (display.trim().startsWith("+")) return `+${digits}`;
  return digits.length === 8 ? `+65${digits}` : `+${digits}`;
}

export function telHrefFor(settings: SiteSettings): `tel:${string}` {
  return `tel:${phoneE164(settings.phoneDisplay)}`;
}

export function mailtoHrefFor(settings: SiteSettings): `mailto:${string}` {
  return `mailto:${settings.email}`;
}

export function whatsappHrefFor(
  settings: SiteSettings,
  message = "Hello Swarangan, I would like to know more about your Hindustani vocal music classes.",
): `https://${string}` {
  return `https://wa.me/${digitsOnly(phoneE164(settings.phoneDisplay))}?text=${encodeURIComponent(message)}`;
}

export function addressLineFor(settings: SiteSettings): string {
  return `${settings.street}, ${settings.unit} ${settings.building}, Singapore ${settings.postalCode}`;
}

/** Keyless Google Maps embed for the studio address. */
export function mapEmbedSrcFor(settings: SiteSettings): `https://${string}` {
  const query = encodeURIComponent(
    `${settings.street} ${settings.building} Singapore ${settings.postalCode}`,
  );
  return `https://maps.google.com/maps?q=${query}&z=16&output=embed`;
}

/** Opens directions to the studio in the visitor's maps app. */
export function directionsHrefFor(settings: SiteSettings): `https://${string}` {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressLineFor(settings))}`;
}
