"use server";

import {
  enquirySchema,
  type EnquiryInput,
  type EnquiryResult,
} from "@/lib/enquiry-schema";

/**
 * Enquiry submission.
 *
 * PHASE 1: validates on the server using the same schema as the client and
 * returns. It does not yet persist or email anything, and it says so honestly in
 * the log rather than pretending to have delivered a message.
 *
 * PHASE 2 replaces the marked section with:
 *   1. insert into the Supabase `enquiries` table (the durable record — so an
 *      enquiry survives an email failure and shows up in the admin inbox), then
 *   2. a Resend call notifying info@swarangan.sg, plus an acknowledgement to the
 *      visitor.
 * The insert comes first deliberately: losing an enquiry is unacceptable,
 * failing to send a notification is merely bad.
 *
 * Note the client-supplied values are re-validated here. A Server Action is a
 * public HTTP endpoint — the client-side check is a convenience for the visitor,
 * never a security boundary.
 */
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

  // Honeypot filled means a bot. Return success so it learns nothing, and drop
  // the submission.
  if (parsed.data.botField) {
    return { status: "success" };
  }

  try {
    // ---- PHASE 2: Supabase insert + Resend notification go here -----------
    console.info(
      "[enquiry] validated (Phase 1: not yet persisted or emailed)",
      { name: parsed.data.name, email: parsed.data.email },
    );

    return { status: "success" };
  } catch (error) {
    console.error("[enquiry] failed", error);
    return {
      status: "error",
      message:
        "Something went wrong sending your message. Please try WhatsApp or email us directly at info@swarangan.sg.",
    };
  }
}
