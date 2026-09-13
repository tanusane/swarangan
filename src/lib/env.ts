import "server-only";

import { z } from "zod";

/**
 * Server environment.
 *
 * Validated LAZILY, on first use, not at import. The public site has to build
 * and serve with no configuration at all — that is how a Vercel preview works
 * before the Supabase project exists, and how CI builds work. So a missing key
 * only becomes an error when something that genuinely needs it runs, and the
 * error names exactly what is missing.
 */

const supabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  // Bypasses row-level security. Server-only, never NEXT_PUBLIC_.
  SUPABASE_SECRET_KEY: z.string().min(20),
  // Salts the login-throttle hashes so stored keys cannot be reversed by
  // hashing a list of likely emails.
  AUTH_THROTTLE_PEPPER: z.string().min(32),
});

const cronSchema = z.object({
  CRON_SECRET: z.string().min(32),
});

export type SupabaseEnv = z.infer<typeof supabaseSchema>;

function read<T extends z.ZodType>(schema: T, feature: string): z.infer<T> {
  const parsed = schema.safeParse(process.env);
  if (parsed.success) return parsed.data;

  const missing = parsed.error.issues.map((issue) => issue.path.join("."));
  throw new Error(
    `${feature} is not configured. Missing or invalid: ${missing.join(", ")}. ` +
      "See .env.example and SETUP.md.",
  );
}

let supabaseCache: SupabaseEnv | null = null;

/** Supabase configuration. Throws a descriptive error if incomplete. */
export function supabaseEnv(): SupabaseEnv {
  supabaseCache ??= read(supabaseSchema, "Supabase");
  return supabaseCache;
}

/** Whether the admin features can run at all — used to show a helpful page. */
export function isSupabaseConfigured(): boolean {
  return supabaseSchema.safeParse(process.env).success;
}

/** The shared secret the keepalive crons must present. */
export function cronSecret(): string {
  return read(cronSchema, "Keepalive cron").CRON_SECRET;
}

const emailSchema = z.object({
  RESEND_API_KEY: z.string().startsWith("re_"),
  // A sender on a domain verified in Resend, e.g.
  // "Swarangan <enquiries@swarangan.sg>".
  RESEND_FROM: z.string().min(3),
});

export type EmailEnv = z.infer<typeof emailSchema>;

/**
 * Email is OPTIONAL: without it, enquiries are still saved and appear in the
 * admin inbox; only the notification emails are skipped. Returns null rather
 * than throwing, so a missing key can never lose an enquiry.
 */
export function emailEnv(): EmailEnv | null {
  const parsed = emailSchema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}
