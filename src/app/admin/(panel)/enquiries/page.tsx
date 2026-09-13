import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/dal";
import { ENQUIRY_STATUSES, type Enquiry } from "@/lib/enquiries/statuses";
import { sessionClient } from "@/lib/supabase/clients";
import { cn } from "@/lib/utils";

import { AdminPageHeading } from "../content/collection-section";

import { EnquiryCard } from "./enquiry-card";

export const metadata: Metadata = { title: "Enquiries" };

const FILTERS = [...ENQUIRY_STATUSES, { value: "all", label: "All" }] as const;

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const requested = (await searchParams).status;
  const filter =
    FILTERS.find((option) => option.value === requested)?.value ?? "new";

  const supabase = await sessionClient();
  let query = supabase
    .from("enquiries")
    .select(
      "id, name, email, phone, interest, mode, message, status, email_sent, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;
  const enquiries = (data ?? []) as Enquiry[];

  return (
    <div className="space-y-8">
      <AdminPageHeading title="Enquiries">
        Messages sent through the contact form, newest first. Mark each one as
        replied once you have answered it.
      </AdminPageHeading>

      <nav aria-label="Filter enquiries" className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Link
            key={option.value}
            href={{
              pathname: "/admin/enquiries",
              query: { status: option.value },
            }}
            aria-current={filter === option.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              filter === option.value
                ? "border-magenta-600 bg-magenta-600 text-white"
                : "border-sand-300 hover:border-magenta-600 bg-white text-blue-800",
            )}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      {enquiries.length === 0 ? (
        <p className="text-ink-muted border-sand-300 rounded-(--radius-card) border border-dashed bg-white p-6 text-sm">
          No enquiries here.
        </p>
      ) : (
        <ul className="space-y-4">
          {enquiries.map((enquiry) => (
            <li key={enquiry.id}>
              <EnquiryCard enquiry={enquiry} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
