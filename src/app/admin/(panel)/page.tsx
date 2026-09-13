import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import type { Metadata } from "next";

import { loadDashboard } from "@/lib/admin/dashboard";
import { loadAdminSettings } from "@/lib/cms/admin-read";
import { describeAge } from "@/lib/heartbeat";
import { cn } from "@/lib/utils";

import { ImportCard } from "./content/import-card";
import { DashboardCharts } from "./dashboard-charts";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Admin home.
 *
 * Students and enquiries first, then the two health checks: whether the
 * keepalive is working, and whether anyone is trying to break into the login.
 * Data loading, including the admin check, lives in lib/admin/dashboard.ts.
 */
export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const passwordUpdated = (await searchParams)["password-updated"] === "1";
  const [{ health, heartbeatSource, recentFailures, stats }, { imported }] =
    await Promise.all([loadDashboard(), loadAdminSettings()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">Dashboard</h1>
        <p className="text-ink-muted mt-1">
          Students and enquiries at a glance. Edit the website from the tabs
          above.
        </p>
      </div>

      {passwordUpdated && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-4 text-sm text-green-800"
        >
          Your password has been changed.
        </p>
      )}

      {!imported && <ImportCard />}

      <DashboardCharts stats={stats} />

      <div className="grid gap-5 md:grid-cols-2">
        {/* -- Keepalive ---------------------------------------------------- */}
        <section className="border-sand-300 rounded-(--radius-card) border bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <Activity aria-hidden="true" className="size-5 text-blue-700" />
            <h2 className="text-lg">Database keepalive</h2>
          </div>

          {health.status === "healthy" && (
            <p className="flex items-start gap-2 text-sm">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-green-700"
              />
              <span>
                Healthy — last ping {describeAge(health.ageMs)}
                {heartbeatSource ? ` via ${heartbeatSource}` : ""}.
              </span>
            </p>
          )}
          {health.status === "stale" && (
            <p className="text-magenta-800 flex items-start gap-2 text-sm">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                No ping for {describeAge(health.ageMs).replace(" ago", "")}. The
                free database pauses after about a week of inactivity — check
                the crons in SETUP.md.
              </span>
            </p>
          )}
          {health.status === "missing" && (
            <p className="text-ink-muted flex items-start gap-2 text-sm">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                No ping recorded yet. This fills in after the first daily cron
                runs on the deployed site.
              </span>
            </p>
          )}
        </section>

        {/* -- Sign-in activity --------------------------------------------- */}
        <section className="border-sand-300 rounded-(--radius-card) border bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert aria-hidden="true" className="size-5 text-blue-700" />
            <h2 className="text-lg">Failed sign-ins, last 7 days</h2>
          </div>

          {recentFailures.length === 0 ? (
            <p className="text-ink-muted text-sm">None. All quiet.</p>
          ) : (
            <ul className="divide-sand-200 divide-y text-sm">
              {recentFailures.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="truncate">{event.email}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs",
                      event.blocked
                        ? "bg-magenta-100 text-magenta-800"
                        : "bg-sand-200 text-sand-800",
                    )}
                  >
                    {event.blocked ? "locked out" : "wrong password"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
