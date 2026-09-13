"use client";

import { Loader2, LogIn } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

import { EmailField } from "../auth-card";

import { signIn, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="space-y-5">
      <EmailField />

      <Field label="Password" required>
        {(props) => (
          <TextInput
            {...props}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        )}
      </Field>

      {state.error && (
        <p
          role="alert"
          className="bg-magenta-50 text-magenta-800 rounded-lg px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
        ) : (
          <LogIn aria-hidden="true" className="size-5" />
        )}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
