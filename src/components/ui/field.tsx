"use client";

import { Loader2, Save } from "lucide-react";
import { useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

/** Props a Field hands to its control so labelling and errors wire up correctly. */
export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
  "aria-required": boolean | undefined;
}

interface FieldProps {
  label: string;
  /** Rendered beneath the label; also announced to screen readers. */
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: (props: FieldControlProps) => ReactNode;
}

const CONTROL_BASE =
  "w-full rounded-lg border bg-sand-50 px-4 py-3 text-base text-ink " +
  "transition-colors duration-200 placeholder:text-sand-500 " +
  "focus:border-magenta-600 focus:outline-none " +
  "aria-[invalid=true]:border-magenta-700 aria-[invalid=true]:bg-magenta-50/40";

/**
 * The one form field wrapper.
 *
 * Owns the label/hint/error layout and, more importantly, the accessibility
 * wiring: a generated id, `aria-describedby` pointing at whichever of hint and
 * error actually exist, `aria-invalid`, and an error announced via role="alert".
 * Getting this right once here is why no individual field can get it wrong.
 *
 * The control is supplied as a function so the caller can register it with
 * react-hook-form while still receiving the generated ids.
 */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-blue-800">
        {label}
        {required && (
          <span className="text-magenta-700 ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-ink-muted text-xs">
          {hint}
        </p>
      )}

      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
        "aria-required": required ? true : undefined,
      })}

      {error && (
        <p id={errorId} role="alert" className="text-magenta-800 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  className,
  ...rest
}: React.ComponentProps<"input">) {
  return <input className={cn(CONTROL_BASE, className)} {...rest} />;
}

export function TextArea({
  className,
  ...rest
}: React.ComponentProps<"textarea">) {
  return (
    <textarea className={cn(CONTROL_BASE, "resize-y", className)} {...rest} />
  );
}

export function Select({ className, ...rest }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(CONTROL_BASE, "appearance-none pr-10", className)}
      {...rest}
    />
  );
}

/**
 * An on/off switch with its label — the one used for every show/hide choice in
 * the admin. A real checkbox underneath, so it is keyboard- and
 * screen-reader-friendly for free.
 */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "peer-focus-visible:ring-magenta-600 relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
          checked ? "bg-magenta-600" : "bg-sand-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5",
          )}
        />
      </span>
      <span className="text-sm">
        <span className="block text-blue-800">{label}</span>
        {hint && <span className="text-ink-muted block text-xs">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * The end of every admin form: an error, if any, then Save (spinning while it
 * works) and Cancel.
 */
export function FormFooter({
  busy,
  error,
  onCancel,
  className,
}: {
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {error && (
        <p role="alert" className="text-magenta-800 text-sm">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {busy ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={busy}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
