"use client";

import { Loader2, Mail } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { AuthNotice, EmailField } from "../auth-card";

import { requestPasswordReset, type ResetRequestState } from "./actions";

const initialState: ResetRequestState = { status: "idle", message: null };

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  if (state.status === "sent") {
    return <AuthNotice tone="success">{state.message}</AuthNotice>;
  }

  return (
    <form action={action} className="space-y-5">
      <EmailField />

      {state.status === "error" && state.message && (
        <AuthNotice tone="error">{state.message}</AuthNotice>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <Mail aria-hidden="true" className="size-5" />
        )}
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
