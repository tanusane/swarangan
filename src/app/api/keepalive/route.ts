import { NextResponse, type NextRequest } from "next/server";

import { isAuthorizedCron } from "@/lib/cron-auth";
import { cronSecret, isSupabaseConfigured } from "@/lib/env";
import { secretClient } from "@/lib/supabase/clients";

/**
 * Keepalive endpoint, hit daily by two independent crons.
 *
 * Supabase pauses a free project after about a week without DATABASE activity,
 * and restoring it is a manual click. Visiting the website does not count: its
 * pages are static and never touch the database. So this performs a real write
 * — upserting the heartbeat row — which both registers as activity and gives
 * the admin dashboard a timestamp to show.
 */
export async function GET(request: NextRequest) {
  let secret: string;
  try {
    secret = cronSecret();
  } catch {
    // Not configured is a deployment mistake, not a caller's fault. Say so
    // plainly in the logs, but do not describe the configuration to the caller.
    console.error("[keepalive] CRON_SECRET is not set");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  if (!isAuthorizedCron(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    console.error("[keepalive] Supabase is not configured");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  // Which cron called, for the dashboard. Anything unrecognised is recorded
  // generically rather than echoing caller-controlled text into the database.
  const source =
    request.nextUrl.searchParams.get("source") === "github"
      ? "GitHub Actions"
      : "Vercel Cron";

  const { error } = await secretClient()
    .from("system_heartbeat")
    .upsert({ id: 1, beat_at: new Date().toISOString(), source });

  if (error) {
    console.error("[keepalive] heartbeat write failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, source });
}
