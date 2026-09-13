"use client";

import { DatabaseZap, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useAction } from "./collection-editor";
import { importOriginalContent } from "./import-actions";

/**
 * Shown on the dashboard until the website's built-in content has been copied
 * into the database. Until then the editors are empty and the live site keeps
 * showing its original content.
 */
export function ImportCard() {
  const { run, busy, error } = useAction();

  return (
    <section className="border-magenta-300 bg-magenta-50/40 rounded-(--radius-card) border p-6">
      <div className="mb-2 flex items-center gap-2">
        <DatabaseZap aria-hidden="true" className="text-magenta-700 size-5" />
        <h2 className="text-lg">One step before editing</h2>
      </div>
      <p className="text-ink-muted mb-4 max-w-2xl text-sm">
        Copy everything the website shows today — page text, testimonials,
        gallery, videos and contact details — into the editors, exactly as
        written. The live site looks the same afterwards; from then on, your
        edits appear on it. This is done once.
      </p>
      <Button
        size="sm"
        disabled={busy}
        onClick={() => run(importOriginalContent)}
      >
        {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {busy ? "Importing…" : "Import the website's content"}
      </Button>
      {error && (
        <p role="alert" className="text-magenta-800 mt-3 text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
