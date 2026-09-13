"use client";

import { ErrorState } from "@/components/ui/error-state";

/**
 * An admin page failed. The most likely cause is the free database being
 * paused or unreachable, so that is what the message points to.
 */
export default function AdminError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      {...props}
      title="This admin page could not load"
      back={{ href: "/admin", label: "Back to the dashboard" }}
    >
      Nothing was changed. Check your internet connection and try again. If it
      keeps failing, the database may be paused: open the Supabase dashboard and
      restore the project (see &ldquo;If something goes wrong&rdquo; in
      SETUP.md).
    </ErrorState>
  );
}
