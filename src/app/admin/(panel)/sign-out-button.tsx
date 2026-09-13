"use client";

import { Loader2, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { signOut } from "./actions";

/**
 * Sign out, with visible progress: the button spins and reads "Signing out…"
 * until the redirect to the login page lands, so there is no doubt it worked.
 */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className="hover:bg-sand-200 inline-flex items-center gap-2 rounded-full px-3 py-2 text-blue-800 transition-colors disabled:opacity-70"
    >
      {pending ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <LogOut aria-hidden="true" className="size-4" />
      )}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
