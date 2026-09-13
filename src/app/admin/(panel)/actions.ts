"use server";

import { redirect } from "next/navigation";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { sessionClient } from "@/lib/supabase/clients";

export async function signOut(): Promise<void> {
  // Even signing out verifies the caller: a Server Action is a public endpoint.
  const admin = await requireAdmin();

  const supabase = await sessionClient();
  await supabase.auth.signOut();
  await writeAudit("auth.sign_out", {}, admin.userId);

  redirect("/admin/login?signed-out=1");
}
