import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";

import { AuthCard, AuthNotice } from "../auth-card";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Already signed in as an admin: go straight to the panel.
  if (await getAdmin()) redirect("/admin");

  const configured = isSupabaseConfigured();
  const signedOut = (await searchParams)["signed-out"] === "1";

  return (
    <AuthCard title="Admin sign in" lead="For Swarangan staff only.">
      {signedOut && (
        <AuthNotice tone="success">You have been signed out.</AuthNotice>
      )}

      {configured ? (
        <>
          <LoginForm />
          <p className="mt-6 text-center text-sm">
            <Link
              href="/admin/forgot-password"
              className="text-magenta-700 hover:underline"
            >
              Forgot your password?
            </Link>
          </p>
        </>
      ) : (
        <AuthNotice tone="info">
          The admin panel is not connected to its database yet. Follow the steps
          in <code>SETUP.md</code> to finish setting it up.
        </AuthNotice>
      )}
    </AuthCard>
  );
}
