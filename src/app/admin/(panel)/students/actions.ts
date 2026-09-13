"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { fieldErrors } from "@/lib/cms/fields";
import { studentSchema, type StudentInput } from "@/lib/students/schema";
import { sessionClient } from "@/lib/supabase/clients";

import type { ContentResult } from "../content/actions";

/**
 * Roster writes. Validated against the one student schema, run as the signed-in
 * admin so row-level security still applies, and audited — without copying
 * students' personal details into the audit log.
 */

const id = z.uuid();

export async function saveStudent(
  studentId: string | null,
  input: StudentInput,
): Promise<ContentResult> {
  const admin = await requireAdmin();
  if (studentId !== null && !id.safeParse(studentId).success) {
    return { ok: false, error: "Invalid request." };
  }

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const supabase = await sessionClient();
  const result = studentId
    ? await supabase
        .from("students")
        .update(parsed.data)
        .eq("id", studentId)
        .select("id")
    : await supabase.from("students").insert(parsed.data).select("id");

  if (result.error) {
    console.error("[students] save failed", result.error);
    return { ok: false, error: "Could not save. Please try again." };
  }
  if (!result.data?.length) {
    return { ok: false, error: "That student no longer exists." };
  }

  await writeAudit(
    studentId ? "student.update" : "student.create",
    { id: result.data[0]!.id },
    admin.userId,
  );
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteStudent(studentId: string): Promise<ContentResult> {
  const admin = await requireAdmin();
  if (!id.safeParse(studentId).success)
    return { ok: false, error: "Invalid request." };

  const supabase = await sessionClient();
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId);
  if (error) return { ok: false, error: "Could not delete. Please try again." };

  await writeAudit("student.delete", { id: studentId }, admin.userId);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
