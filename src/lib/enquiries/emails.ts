/**
 * The two enquiry emails, as plain text.
 *
 * Pure, so their exact wording and — more importantly — their safety are tested:
 * everything here is visitor-supplied, so it is sent as plain text (no HTML that
 * a crafted message could inject into) and the subject line has line breaks
 * removed, which is how header injection would otherwise start.
 */

export interface EnquiryEmailInput {
  name: string;
  email: string;
  phone?: string | null;
  interest?: string | null;
  mode?: string | null;
  message: string;
}

export interface EmailContent {
  subject: string;
  text: string;
}

/** Collapse anything that could break out of a header onto one tidy line. */
export function singleLine(value: string, max = 80): string {
  const line = value
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/** To Swarangan: a new enquiry arrived. Reply-To is set to the visitor. */
export function notificationEmail(
  enquiry: EnquiryEmailInput,
  adminUrl: string,
): EmailContent {
  const lines = [
    `New enquiry from ${singleLine(enquiry.name, 120)}`,
    "",
    `Email:    ${enquiry.email}`,
    enquiry.phone ? `Phone:    ${enquiry.phone}` : null,
    enquiry.interest ? `Interest: ${enquiry.interest}` : null,
    enquiry.mode ? `Where:    ${enquiry.mode}` : null,
    "",
    "Message:",
    enquiry.message,
    "",
    "—",
    `Reply to this email to answer directly, or see all enquiries at ${adminUrl}`,
  ];

  return {
    subject: `New enquiry: ${singleLine(enquiry.name, 60)}`,
    text: lines.filter((line) => line !== null).join("\n"),
  };
}

/** To the visitor: we have your message. Deliberately does not echo it back. */
export function acknowledgementEmail(enquiry: EnquiryEmailInput): EmailContent {
  const firstName = singleLine(enquiry.name, 60).split(" ")[0] ?? "";
  return {
    subject: "Thank you for contacting Swarangan",
    text: [
      `Dear ${firstName},`,
      "",
      "Thank you for your enquiry. We have received your message and will reply soon.",
      "",
      "Warm regards,",
      "Swarangan",
      "https://www.swarangan.sg",
    ].join("\n"),
  };
}
