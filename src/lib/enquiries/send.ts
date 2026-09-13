import "server-only";

import { emailEnv } from "@/lib/env";

/**
 * Send one plain-text email through Resend's HTTP API.
 *
 * A direct fetch rather than the Resend SDK: it is one request, and this keeps
 * a dependency out of the project. Never throws — returns whether it was sent —
 * because an email failure must never undo a saved enquiry.
 */
export async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const env = emailEnv();
  if (!env) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(
        "[email] Resend refused",
        response.status,
        await response.text(),
      );
    }
    return response.ok;
  } catch (error) {
    console.error("[email] send failed", error);
    return false;
  }
}
