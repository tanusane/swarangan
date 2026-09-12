import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The one class-name combiner used across the whole app. Merges conditional
 * classes (clsx) and then resolves Tailwind conflicts so a caller-supplied
 * `className` always wins over a component's own defaults.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Strip everything but digits — used to build `tel:` and `wa.me` links. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}
