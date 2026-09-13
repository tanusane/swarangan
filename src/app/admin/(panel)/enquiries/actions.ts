"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { ENQUIRY_STATUSES } from "@/lib/enquiries/statuses";
import { sessionClient } from "@/lib/supabase/clients";

import type { ContentResult } from "../content/actions";

const id = z.uuid();
const status = z.enum(
  ENQUIRY_STATUSES.map((s) => s.value) as [string, ...string[]],
);

const FAILED: ContentResult = {
  ok: false,
  error: "Could not save that change. Please try again.",
};

export async function setEnquiryStatus(
  enquiryId: string,
  next: string,
): Promise<ContentResult> {
  const admin = await requireAdmin();
  if (!id.safeParse(enquiryId).success || !status.safeParse(next).success) {
    return { ok: false, error: "Invalid request." };
  }

  const supabase = await sessionClient();
  const { data, error } = await supabase
    .from("enquiries")
    .update({ status: next })
    .eq("id", enquiryId)
    .select("id");
  if (error) return FAILED;
  if (!data?.length)
    return { ok: false, error: "That enquiry no longer exists." };

  await writeAudit(
    "enquiry.status",
    { id: enquiryId, status: next },
    admin.userId,
  );
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function deleteEnquiry(enquiryId: string): Promise<ContentResult> {
  const admin = await requireAdmin();
  if (!id.safeParse(enquiryId).success)
    return { ok: false, error: "Invalid request." };

  const supabase = await sessionClient();
  const { error } = await supabase
    .from("enquiries")
    .delete()
    .eq("id", enquiryId);
  if (error) return FAILED;

  await writeAudit("enquiry.delete", { id: enquiryId }, admin.userId);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
