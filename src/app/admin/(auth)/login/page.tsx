import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandLogo } from "@/components/ui/brand-logo";
import { getAdmin } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  // Already signed in as an admin: go straight to the panel.
  if (await getAdmin()) redirect("/admin");

  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <BrandLogo
          alt="Swarangan"
          priority
          className="mx-auto mb-8 h-14 w-auto"
        />

        <div className="border-sand-300 rounded-(--radius-card) border bg-white p-8 shadow-(--shadow-lift)">
          <h1 className="text-2xl">Admin sign in</h1>
          <p className="text-ink-muted mt-1 mb-6 text-sm">
            For Swarangan staff only.
          </p>

          {configured ? (
            <LoginForm />
          ) : (
            <p
              role="status"
              className="bg-sand-100 text-ink-muted rounded-lg p-4 text-sm"
            >
              The admin panel is not connected to its database yet. Follow the
              steps in <code>SETUP.md</code> to finish setting it up.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
