import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthNotice } from "../auth-card";

import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const expired = (await searchParams).expired === "1";

  return (
    <AuthCard
      title="Forgot your password?"
      lead="Enter your admin email and we will send you a link to choose a new one."
    >
      {expired && (
        <AuthNotice tone="error">
          That reset link has expired or was already used. Please ask for a new
          one.
        </AuthNotice>
      )}
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm">
        <Link href="/admin/login" className="text-magenta-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
