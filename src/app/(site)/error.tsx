"use client";

import { ErrorState } from "@/components/ui/error-state";

/** A page on the public site failed to render. Header and footer stay usable. */
export default function SiteError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="pt-24">
      <ErrorState
        {...props}
        title="This page could not be loaded"
        back={{ href: "/", label: "Go to the home page" }}
      >
        Please try again in a moment. If it keeps happening, reach us on
        WhatsApp or at info@swarangan.sg.
      </ErrorState>
    </div>
  );
}
