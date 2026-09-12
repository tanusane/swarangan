"use client";

import { useId, type ReactNode } from "react";

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
