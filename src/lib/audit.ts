import "server-only";

import { secretClient } from "@/lib/supabase/clients";

/**
 * The admin audit trail: who did what, and when — including failed and blocked
 * sign-in attempts, so Amit can see from the dashboard if the login is being
 * attacked.
 *
 * Written with the secret client because some events (a failed login) happen
 * with nobody signed in. The table itself is append-only through the API: the
 * admin policy grants SELECT only, so history cannot be quietly rewritten from
 * the admin panel.
 */

export type AuditAction =
  | "auth.sign_in"
  | "auth.sign_in_failed"
  | "auth.sign_in_blocked"
  | "auth.sign_out"
  | "media.update"
  | "media.reset";

export async function writeAudit(
  action: AuditAction,
  detail: Record<string, unknown> = {},
  actor: string | null = null,
): Promise<void> {
  const { error } = await secretClient()
    .from("admin_audit_log")
    .insert({ action, detail, actor });

  // An audit write failing must never break the action it describes, but it
  // must not vanish either: it lands in the server logs.
  if (error) console.error("[audit] write failed", action, error);
}
