"use client";

import { KeyRound, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-rules";

import { AuthNotice } from "../auth-card";

import { setNewPassword, type NewPasswordState } from "./actions";

const initialState: NewPasswordState = { error: null };

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(setNewPassword, initialState);

  return (
    <form action={action} className="space-y-5">
      <Field
        label="New password"
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        required
      >
        {(props) => (
          <TextInput
            {...props}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
        )}
      </Field>
      <Field label="Type it again" required>
        {(props) => (
          <TextInput
            {...props}
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>

      {state.error && <AuthNotice tone="error">{state.error}</AuthNotice>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <KeyRound aria-hidden="true" className="size-5" />
        )}
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
