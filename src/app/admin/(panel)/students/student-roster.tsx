"use client";

import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FormFooter,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/field";
import {
  STUDENT_CATEGORIES,
  STUDENT_MODES,
  STUDENT_STATUSES,
  labelFor,
  type Student,
  type StudentInput,
} from "@/lib/students/schema";
import { cn } from "@/lib/utils";

import { useAction } from "../content/collection-editor";

import { deleteStudent, saveStudent } from "./actions";

type Options = readonly { value: string; label: string }[];

const STATUS_TONE: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-gold-100 text-sand-800",
  left: "bg-sand-200 text-sand-800",
};

function todayInSingapore(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
  }).format(new Date());
}

function toInput(student: Student | null): StudentInput {
  return {
    name: student?.name ?? "",
    email: student?.email ?? "",
    phone: student?.phone ?? "",
    category: student?.category ?? "children-beginner",
    level: student?.level ?? "",
    mode: student?.mode ?? "studio",
    status: student?.status ?? "active",
    joined_on: student?.joined_on ?? todayInSingapore(),
    notes: student?.notes ?? "",
  };
}

export function StudentRoster({ students }: { students: readonly Student[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const levels = useMemo(
    () => [...new Set(students.map((student) => student.level))].sort(),
    [students],
  );

  const shown = students.filter((student) => {
    const text = query.trim().toLowerCase();
    return (
      (status === "all" || student.status === status) &&
      (category === "all" || student.category === category) &&
      (!text ||
        [student.name, student.email, student.phone, student.level]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(text)))
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search students</span>
          <Search
            aria-hidden="true"
            className="text-ink-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <TextInput
            type="search"
            placeholder="Search by name, email, phone or level"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="py-2 pl-9"
          />
        </label>
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={STUDENT_STATUSES}
        />
        <FilterSelect
          label="Class"
          value={category}
          onChange={setCategory}
          options={STUDENT_CATEGORIES}
        />
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" className="size-4" />
          Add student
        </Button>
      </div>

      <p className="text-ink-muted text-sm" aria-live="polite">
        Showing {shown.length} of {students.length} students.
      </p>

      {editing === "new" && (
        <div className="border-sand-300 rounded-(--radius-card) border bg-white p-5">
          <h2 className="mb-4 text-lg">New student</h2>
          <StudentForm
            student={null}
            levels={levels}
            onDone={() => setEditing(null)}
          />
        </div>
      )}

      <ul className="space-y-3">
        {shown.map((student) => (
          <li
            key={student.id}
            className="border-sand-300 rounded-(--radius-card) border bg-white p-4"
          >
            <StudentRow
              student={student}
              editing={editing === student.id}
              onEdit={() =>
                setEditing(editing === student.id ? null : student.id)
              }
            />
            {editing === student.id && (
              <div className="border-sand-200 mt-4 border-t pt-4">
                <StudentForm
                  student={student}
                  levels={levels}
                  onDone={() => setEditing(null)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Options;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-blue-800">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="py-2 text-sm"
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function StudentRow({
  student,
  editing,
  onEdit,
}: {
  student: Student;
  editing: boolean;
  onEdit: () => void;
}) {
  const { run, busy, error } = useAction();

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-blue-900">{student.name}</p>
          <p className="text-ink-muted text-sm">
            {labelFor(STUDENT_CATEGORIES, student.category)} · {student.level} ·{" "}
            {labelFor(STUDENT_MODES, student.mode)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            STATUS_TONE[student.status],
          )}
        >
          {labelFor(STUDENT_STATUSES, student.status)}
        </span>
        {busy && (
          <Loader2 aria-label="Saving" className="size-4 animate-spin" />
        )}
        <button
          type="button"
          aria-label={editing ? "Close" : `Edit ${student.name}`}
          onClick={onEdit}
          className="hover:bg-sand-200 inline-flex size-9 items-center justify-center rounded-full text-blue-800"
        >
          {editing ? (
            <X aria-hidden="true" className="size-4" />
          ) : (
            <Pencil aria-hidden="true" className="size-4" />
          )}
        </button>
        <button
          type="button"
          aria-label={`Delete ${student.name}`}
          disabled={busy}
          onClick={() => {
            if (
              window.confirm(
                `Delete ${student.name} from the roster? To keep their history, set their status to "Left" instead.`,
              )
            ) {
              run(() => deleteStudent(student.id));
            }
          }}
          className="text-magenta-700 hover:bg-magenta-50 inline-flex size-9 items-center justify-center rounded-full"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>
      {error && (
        <p role="alert" className="text-magenta-800 mt-2 text-sm">
          {error}
        </p>
      )}
    </>
  );
}

function StudentForm({
  student,
  levels,
  onDone,
}: {
  student: Student | null;
  levels: readonly string[];
  onDone: () => void;
}) {
  const [values, setValues] = useState<StudentInput>(() => toInput(student));
  const { run, busy, error, fieldErrors } = useAction();
  const levelListId = useId();

  const set = <K extends keyof StudentInput>(name: K, value: StudentInput[K]) =>
    setValues((current) => ({ ...current, [name]: value }));

  const text = (
    name: "name" | "email" | "phone" | "level",
    label: string,
    extra = {},
  ) => (
    <Field
      label={label}
      error={fieldErrors[name]}
      required={name === "name" || name === "level"}
    >
      {(control) => (
        <TextInput
          {...control}
          {...extra}
          value={values[name] ?? ""}
          onChange={(event) => set(name, event.target.value)}
        />
      )}
    </Field>
  );

  const choice = (
    name: "category" | "mode" | "status",
    label: string,
    options: Options,
  ) => (
    <Field label={label} error={fieldErrors[name]} required>
      {(control) => (
        <Select
          {...control}
          value={values[name]}
          onChange={(event) => set(name, event.target.value as never)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => saveStudent(student?.id ?? null, values), onDone);
      }}
    >
      {text("name", "Name")}
      {text("level", "Level", {
        list: levelListId,
        placeholder: "e.g. Prarambhik",
      })}
      <datalist id={levelListId}>
        {levels.map((level) => (
          <option key={level} value={level} />
        ))}
      </datalist>
      {choice("category", "Class", STUDENT_CATEGORIES)}
      {choice("mode", "Where", STUDENT_MODES)}
      {choice("status", "Status", STUDENT_STATUSES)}
      <Field label="Joined on" error={fieldErrors.joined_on} required>
        {(control) => (
          <TextInput
            {...control}
            type="date"
            value={values.joined_on}
            onChange={(event) => set("joined_on", event.target.value)}
          />
        )}
      </Field>
      {text("email", "Email", { type: "email" })}
      {text("phone", "Phone", { type: "tel" })}
      <Field label="Notes" error={fieldErrors.notes} className="md:col-span-2">
        {(control) => (
          <TextArea
            {...control}
            rows={3}
            value={values.notes ?? ""}
            onChange={(event) => set("notes", event.target.value)}
          />
        )}
      </Field>

      <FormFooter
        busy={busy}
        error={error}
        onCancel={onDone}
        className="md:col-span-2"
      />
    </form>
  );
}
