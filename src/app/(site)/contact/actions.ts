"use server";

import { after } from "next/server";

import { getSettings } from "@/lib/cms/repository";
import {
  acknowledgementEmail,
  notificationEmail,
} from "@/lib/enquiries/emails";
import { sendEmail } from "@/lib/enquiries/send";
import {
  enquirySchema,
  type EnquiryInput,
  type EnquiryResult,
} from "@/lib/enquiry-schema";
import { isSupabaseConfigured } from "@/lib/env";
import { siteConfig } from "@/lib/site-config";
import { secretClient } from "@/lib/supabase/clients";

/**
 * Enquiry submission.
 *
 *   1. Re-validate. A Server Action is a public HTTP endpoint — the client-side
 *      check is a convenience for the visitor, never a security boundary.
 *   2. Drop bots (honeypot) and floods (a per-address hourly limit).
 *   3. SAVE the enquiry. This is the durable record: it shows up in the admin
 *      inbox even if every email below fails.
 *   4. After responding, email Swarangan and acknowledge the visitor, and record
 *      whether the notification went out, so a failed send is visible in the
 *      inbox rather than silently lost.
 *
 * The insert uses the secret key because enquiries deliberately have no public
 * insert policy — a bot holding the publishable key cannot write to the table
 * and skip everything above.
 */

/** Enquiries accepted from one email address per hour. */
const HOURLY_LIMIT_PER_EMAIL = 3;

const FALLBACK =
  "Something went wrong sending your message. Please try WhatsApp or email us directly at info@swarangan.sg.";

export async function submitEnquiry(
  input: EnquiryInput,
): Promise<EnquiryResult> {
  const parsed = enquirySchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      status: "error",
      message: "Please check the highlighted fields and try again.",
      fieldErrors,
    };
  }

  // Honeypot filled means a bot. Return success so it learns nothing.
  if (parsed.data.botField) return { status: "success" };

  if (!isSupabaseConfigured()) {
    console.error("[enquiry] Supabase is not configured; enquiry not saved");
    return { status: "error", message: FALLBACK };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const db = secretClient();

  try {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await db
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", since);
    if (countError) throw countError;

    if ((count ?? 0) >= HOURLY_LIMIT_PER_EMAIL) {
      return {
        status: "error",
        message:
          "We have already received your recent messages and will reply soon. For anything urgent, please use WhatsApp.",
      };
    }

    const record = {
      name: data.name,
      email,
      phone: data.phone || null,
      interest: data.interest || null,
      mode: data.mode || null,
      message: data.message,
    };

    const { data: saved, error } = await db
      .from("enquiries")
      .insert(record)
      .select("id")
      .single();
    if (error) throw error;

    after(async () => {
      const settings = await getSettings();
      const notified = await sendEmail({
        to: settings.email,
        replyTo: email,
        ...notificationEmail(record, `${siteConfig.url}/admin/enquiries`),
      });
      if (notified) {
        await db
          .from("enquiries")
          .update({ email_sent: true })
          .eq("id", saved.id);
      }
      await sendEmail({
        to: email,
        replyTo: settings.email,
        ...acknowledgementEmail(record),
      });
    });

    return { status: "success" };
  } catch (error) {
    console.error("[enquiry] failed", error);
    return { status: "error", message: FALLBACK };
  }
}
