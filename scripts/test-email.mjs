/**
 * Send one test email with the same settings the website uses, to prove that
 * enquiry notifications will arrive.
 *
 *   npm run test:email                     sends to ENQUIRY_NOTIFY_TO
 *   npm run test:email -- you@example.com  sends to that address
 *
 * Reads RESEND_API_KEY, RESEND_FROM and ENQUIRY_NOTIFY_TO from .env.local.
 */
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const { RESEND_API_KEY, RESEND_FROM, ENQUIRY_NOTIFY_TO } = process.env;
const to = process.argv[2] || ENQUIRY_NOTIFY_TO;

if (!RESEND_API_KEY || !RESEND_FROM) {
  console.error(
    "Set RESEND_API_KEY and RESEND_FROM in .env.local first (see SETUP.md step 11).",
  );
  process.exit(1);
}
if (!to) {
  console.error(
    "Give an address: npm run test:email -- you@example.com (or set ENQUIRY_NOTIFY_TO).",
  );
  process.exit(1);
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: RESEND_FROM,
    to: [to],
    subject: "Swarangan website: test email",
    text: "This is a test from the Swarangan website. If you can read it, enquiry notifications will reach this inbox.",
  }),
});

const body = await response.text();
if (response.ok) {
  console.log(`Sent to ${to}. Check the inbox (and spam) in a minute.`);
} else {
  console.error(`Resend refused (HTTP ${response.status}): ${body}`);
  if (/resend\.dev/.test(RESEND_FROM) && response.status === 403) {
    console.error(
      "With the onboarding@resend.dev sender, Resend only delivers to the email you signed up with. Send to that address, or verify swarangan.sg.",
    );
  }
  process.exit(1);
}
