import type { ReactNode } from "react";

import { BrandLogo } from "@/components/ui/brand-logo";
import { Field, TextInput } from "@/components/ui/field";

/** The centred card shared by sign-in, forgot password and reset password. */
export function AuthCard({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <BrandLogo
          alt="Swarangan"
          priority
          className="mx-auto mb-8 h-14 w-auto"
        />
        <div className="border-sand-300 rounded-(--radius-card) border bg-white p-8 shadow-(--shadow-lift)">
          <h1 className="text-2xl">{title}</h1>
          <p className="text-ink-muted mt-1 mb-6 text-sm">{lead}</p>
          {children}
        </div>
      </div>
    </main>
  );
}

/** A status line inside an auth card. */
export function AuthNotice({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const tones = {
    success: "bg-green-50 text-green-800",
    error: "bg-magenta-50 text-magenta-800",
    info: "bg-sand-100 text-ink-muted",
  };
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`mb-5 rounded-lg p-3 text-sm ${tones[tone]}`}
    >
      {children}
    </p>
  );
}

/** The admin email input, as sign-in and password reset both need it. */
export function EmailField() {
  return (
    <Field label="Email" required>
      {(props) => (
        <TextInput
          {...props}
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
        />
      )}
    </Field>
  );
}
