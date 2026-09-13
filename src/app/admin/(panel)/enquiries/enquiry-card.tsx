"use client";

import { AlertTriangle, Loader2, Mail, Phone, Trash2 } from "lucide-react";

import { Select } from "@/components/ui/field";
import {
  ENQUIRY_STATUSES,
  formatSingaporeTime,
  type Enquiry,
} from "@/lib/enquiries/statuses";

import { useAction } from "../content/collection-editor";

import { deleteEnquiry, setEnquiryStatus } from "./actions";

export function EnquiryCard({ enquiry }: { enquiry: Enquiry }) {
  const { run, busy, error } = useAction();
  const replySubject = encodeURIComponent("Re: your enquiry to Swarangan");

  return (
    <article className="border-sand-300 rounded-(--radius-card) border bg-white p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg">{enquiry.name}</h2>
          <p className="text-ink-muted text-xs">
            {formatSingaporeTime(enquiry.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {busy && (
            <Loader2
              aria-label="Saving"
              className="size-4 animate-spin text-blue-700"
            />
          )}
          <label className="sr-only" htmlFor={`status-${enquiry.id}`}>
            Status
          </label>
          <Select
            id={`status-${enquiry.id}`}
            value={enquiry.status}
            disabled={busy}
            className="w-36 py-1.5 text-sm"
            onChange={(event) => {
              const next = event.target.value;
              run(() => setEnquiryStatus(enquiry.id, next));
            }}
          >
            {ENQUIRY_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
          <button
            type="button"
            aria-label="Delete enquiry"
            title="Delete enquiry"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  `Delete the enquiry from ${enquiry.name}? This cannot be undone.`,
                )
              ) {
                run(() => deleteEnquiry(enquiry.id));
              }
            }}
            className="text-magenta-700 hover:bg-magenta-50 inline-flex size-9 items-center justify-center rounded-full"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </header>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {enquiry.interest && (
          <div>
            <dt className="text-ink-muted inline">Interest: </dt>
            <dd className="inline">{enquiry.interest}</dd>
          </div>
        )}
        {enquiry.mode && (
          <div>
            <dt className="text-ink-muted inline">Where: </dt>
            <dd className="inline">{enquiry.mode}</dd>
          </div>
        )}
      </dl>

      {/* Visitor text, rendered as text: React escapes it, and pre-wrap keeps
          their line breaks without any HTML. */}
      <p className="bg-sand-50 mt-3 rounded-lg p-4 text-sm whitespace-pre-wrap">
        {enquiry.message}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <a
          href={`mailto:${enquiry.email}?subject=${replySubject}`}
          className="bg-magenta-600 hover:bg-magenta-700 inline-flex items-center gap-2 rounded-full px-4 py-2 text-white"
        >
          <Mail aria-hidden="true" className="size-4" />
          Reply to {enquiry.email}
        </a>
        {enquiry.phone && (
          <a
            href={`tel:${enquiry.phone.replace(/[^\d+]/g, "")}`}
            className="border-sand-300 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-blue-800"
          >
            <Phone aria-hidden="true" className="size-4" />
            {enquiry.phone}
          </a>
        )}
        {!enquiry.email_sent && (
          <span className="text-ink-muted inline-flex items-center gap-1 text-xs">
            <AlertTriangle aria-hidden="true" className="size-3.5" />
            No email notification was sent for this one.
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="text-magenta-800 mt-2 text-sm">
          {error}
        </p>
      )}
    </article>
  );
}
