import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/dal";
import type { Student } from "@/lib/students/schema";
import { sessionClient } from "@/lib/supabase/clients";

import { AdminPageHeading } from "../content/collection-section";

import { StudentRoster } from "./student-roster";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage() {
  await requireAdmin();
  const supabase = await sessionClient();
  const { data } = await supabase
    .from("students")
    .select(
      "id, name, email, phone, category, level, mode, status, joined_on, notes, created_at",
    )
    .order("name", { ascending: true });

  return (
    <div className="space-y-8">
      <AdminPageHeading title="Students">
        The student roster. It is private — never shown on the website — and
        powers the charts on the dashboard.
      </AdminPageHeading>
      <StudentRoster students={(data ?? []) as Student[]} />
    </div>
  );
}
