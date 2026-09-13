import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/dal";

import { AdminPageHeading } from "../content/collection-section";

import { BackupForm } from "./backup-form";

export const metadata: Metadata = { title: "Backup" };

export default async function BackupPage() {
  const admin = await requireAdmin();

  return (
    <div className="max-w-2xl space-y-8">
      <AdminPageHeading title="Backup">
        Download a copy of everything in the database — website content,
        students, enquiries and the activity log — as one ZIP file.
      </AdminPageHeading>

      <section className="border-sand-300 space-y-4 rounded-(--radius-card) border bg-white p-6 text-sm">
        <ul className="text-ink-muted list-disc space-y-1.5 pl-5">
          <li>
            Inside: each table as a spreadsheet (CSV, opens in Excel or Google
            Sheets) and as exact data for restoring (JSON).
          </li>
          <li>
            Photos are not inside — they stay safely in storage. The file lists
            every photo in use.
          </li>
          <li>
            The file contains students&rsquo; and parents&rsquo; contact
            details. Keep it somewhere private.
          </li>
          <li>A good habit: download one at the start of every month.</li>
        </ul>
        <BackupForm email={admin.email ?? ""} />
      </section>
    </div>
  );
}
