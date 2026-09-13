import { z } from "zod";

/**
 * The enquiry form contract.
 *
 * ONE schema, shared by the client form and the server action, so client-side
 * and server-side validation can never drift apart. It is also the shape
 * written to the Supabase `enquiries` table.
 */

export const CLASS_INTERESTS = [
  "Beginner classes for children",
  "Beginner classes for Adults",
  "Advanced classes",
  "Not sure yet",
] as const;

export const CLASS_MODES = [
  "At the West Coast studio",
  "At my home",
  "Online",
  "No preference",
] as const;

export const enquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please tell us your name.")
    .max(120, "That name is too long."),

  email: z
    .string()
    .trim()
    .min(1, "We need an email address to reply to.")
    .email("That does not look like an email address.")
    .max(254),

  /**
   * Optional, but validated when given. Deliberately permissive: Singapore
   * locals write "8189 5399", overseas enquirers write "+91 98...". Anything
   * with 7–20 digits and only sane separators is accepted.
   */
  phone: z
    .string()
    .trim()
    .max(32, "That phone number is too long.")
    .refine(
      (value) => value === "" || /^[+()\d][\d\s().-]{5,}$/.test(value),
      "Please check the phone number.",
    )
    .optional()
    .or(z.literal("")),

  interest: z.enum(CLASS_INTERESTS).optional().or(z.literal("")),
  mode: z.enum(CLASS_MODES).optional().or(z.literal("")),

  message: z
    .string()
    .trim()
    .min(10, "Please add a line or two so we can help properly.")
    .max(4000, "Please keep the message under 4000 characters."),

  /**
   * Honeypot. Real visitors never see this field, so anything in it is a bot.
   * Kept in the schema (rather than checked ad hoc) so the server action cannot
   * forget to look at it.
   */
  botField: z.literal("").optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** What the server action returns to the form. */
export type EnquiryResult =
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };
