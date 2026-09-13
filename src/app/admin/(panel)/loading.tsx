import { Loader2 } from "lucide-react";

/** Shown while an admin page loads, so a click always visibly does something. */
export default function AdminLoading() {
  return (
    <div
      role="status"
      className="text-ink-muted flex min-h-[40svh] items-center justify-center gap-3"
    >
      <Loader2
        aria-hidden="true"
        className="text-magenta-600 size-6 animate-spin"
      />
      Loading…
    </div>
  );
}
