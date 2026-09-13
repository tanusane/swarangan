import { z } from "zod";

/**
 * The student roster contract.
 *
 * One definition of every choice, used by the form's dropdowns, the server's
 * validation, the dashboard's chart labels, and the database check constraints
 * in the migration. The `value`s here must match those constraints exactly.
 */

export const STUDENT_CATEGORIES = [
  { value: "children-beginner", label: "Beginner — children" },
  { value: "adults-beginner", label: "Beginner — adults" },
  { value: "advanced", label: "Advanced" },
] as const;

export const STUDENT_MODES = [
  { value: "studio", label: "At the studio" },
  { value: "home", label: "Home classes" },
  { value: "online", label: "Online" },
] as const;

export const STUDENT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "left", label: "Left" },
] as const;

type Values<T extends readonly { value: string }[]> = T[number]["value"];

export type StudentCategory = Values<typeof STUDENT_CATEGORIES>;
export type StudentMode = Values<typeof STUDENT_MODES>;
export type StudentStatus = Values<typeof STUDENT_STATUSES>;

const values = <T extends readonly { value: string }[]>(options: T) =>
  options.map((option) => option.value) as [Values<T>, ...Values<T>[]];

/** A label for a stored value, falling back to the raw value if unknown. */
export function labelFor(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

/**
 * `level` is free text on purpose. Swarangan's grading follows its diploma
 * syllabus, which is Tanuja's to name — not ours to invent a fixed list for. The
 * form suggests levels already in use so the dashboard's grouping stays tidy.
 * Whitespace is collapsed so "Level  1" and "Level 1" count as one.
 */
const level = z
  .string()
  .trim()
  .min(1, "Please enter a level.")
  .max(60)
  .transform((value) => value.replace(/\s+/g, " "));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === "" ? null : value));

export const studentSchema = z.object({
  name: z.string().trim().min(2, "Please enter the student's name.").max(120),
  email: z
    .string()
    .trim()
    .max(254)
    .refine(
      (value) => value === "" || z.email().safeParse(value).success,
      "That does not look like an email address.",
    )
    .transform((value) => (value === "" ? null : value.toLowerCase())),
  phone: optionalText(32),
  category: z.enum(values(STUDENT_CATEGORIES)),
  level,
  mode: z.enum(values(STUDENT_MODES)),
  status: z.enum(values(STUDENT_STATUSES)),
  joined_on: z.iso.date("Please enter the date they joined."),
  notes: optionalText(2000),
});

/** What the form submits, before transforms. */
export type StudentInput = z.input<typeof studentSchema>;
/** What is written to the database, after transforms. */
export type StudentRecord = z.output<typeof studentSchema>;

export interface Student extends StudentRecord {
  id: string;
  created_at: string;
}
