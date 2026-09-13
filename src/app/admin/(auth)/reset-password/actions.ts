"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { getAdmin } from "@/lib/auth/dal";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-rules";
import { sessionClient } from "@/lib/supabase/clients";

export interface NewPasswordState {
  error: string | null;
}

const schema = z
  .object({
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
      )
      .max(256),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "The two passwords do not match.",
  });

/**
 * Set a new password. Only reachable with the session created by a valid reset
 * link, and only for someone on the admin allow-list.
 */
export async function setNewPassword(
  _previous: NewPasswordState,
  formData: FormData,
): Promise<NewPasswordState> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/forgot-password?expired=1");

  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check the form.",
    };
  }

  const supabase = await sessionClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    // Supabase rejects reusing the current password, and weak passwords when
    // its leaked-password check is on; its message says which.
    return { error: error.message };
  }

  await writeAudit("auth.password_changed", {}, admin.userId);
  redirect("/admin?password-updated=1");
}
