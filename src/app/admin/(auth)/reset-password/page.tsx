import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/auth/dal";

import { AuthCard } from "../auth-card";

import { NewPasswordForm } from "./new-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  // Arrived without a valid reset link (or not an admin): start again.
  if (!(await getAdmin())) redirect("/admin/forgot-password?expired=1");

  return (
    <AuthCard
      title="Choose a new password"
      lead="Use something long that you do not use anywhere else. A short sentence works well."
    >
      <NewPasswordForm />
    </AuthCard>
  );
}
