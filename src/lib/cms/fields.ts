import { z } from "zod";

import type { CollectionDef, FieldDef } from "@/lib/cms/collections";

/**
 * Turning form input into database values, and back.
 *
 * The browser sends plain strings and booleans; each field type decides how
 * that becomes a column value. The same rules run on the server for every save,
 * so the browser's form is a convenience, never the authority.
 *
 * Paragraph fields are the delicate case. Testimonials and page text are stored
 * as arrays of paragraphs, edited as one text box with an empty line between
 * paragraphs. The conversion must be exactly reversible — opening a testimonial
 * and saving it untouched must not change one character — so paragraphs are
 * split only on empty lines, and the text within a paragraph (including double
 * spaces) is left alone. Only leading and trailing whitespace is removed.
 */

export type FormValue = string | boolean;
export type FormValues = Record<string, FormValue>;

// ---- Paragraphs -------------------------------------------------------------------

export function paragraphsToText(
  paragraphs: readonly string[] | null | undefined,
): string {
  return (paragraphs ?? []).join("\n\n");
}

export function textToParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

// ---- YouTube ------------------------------------------------------------------------

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Accept what an admin is likely to paste: a watch link, a short youtu.be link,
 * a Shorts or embed link, or the bare 11-character ID. Returns the ID or null.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, "");
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.slice(1).split("/")[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    candidate =
      url.searchParams.get("v") ??
      url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1] ??
      null;
  }

  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

// ---- Keys -----------------------------------------------------------------------------

/** "Annual Function 2026!" -> "annual-function-2026". */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** A slug that is not already taken: "album", "album-2", "album-3"… */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  const root = slugify(base) || "item";
  if (!taken.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

// ---- Schema ----------------------------------------------------------------------------

function fieldSchema(field: FieldDef): z.ZodType<unknown> {
  const max = field.max ?? 500;

  switch (field.type) {
    case "boolean":
      return z.boolean().default(false);

    case "paragraphs": {
      const base = z
        .string()
        .max(max, `${field.label} is too long.`)
        .transform(textToParagraphs);
      return field.required
        ? base.refine(
            (paragraphs) => paragraphs.length > 0,
            `${field.label} is required.`,
          )
        : base;
    }

    case "youtube":
      return z.string().transform((value, context) => {
        const id = parseYouTubeId(value);
        if (!id) {
          context.addIssue({
            code: "custom",
            message: "That doesn't look like a YouTube link.",
          });
          return z.NEVER;
        }
        return id;
      });

    case "year":
      return z
        .string()
        .trim()
        .transform((value, context) => {
          if (value === "") return null;
          const year = Number(value);
          if (!Number.isInteger(year) || year < 1950 || year > 2100) {
            context.addIssue({
              code: "custom",
              message: "Enter a year like 2026, or leave it empty.",
            });
            return z.NEVER;
          }
          return year;
        });

    case "text":
    case "textarea": {
      const trimmed = z.string().trim().max(max, `${field.label} is too long.`);
      return field.required
        ? trimmed.min(1, `${field.label} is required.`)
        : trimmed.transform((value) => (value === "" ? null : value));
    }
  }
}

/** The server-side validator for one collection's form. */
export function itemSchema(def: CollectionDef) {
  return z.object(
    Object.fromEntries(
      def.fields.map((field) => [field.name, fieldSchema(field)]),
    ),
  );
}

/** First validation message per field, for showing next to the inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** A database row turned back into form values, for editing. */
export function rowToFormValues(
  def: CollectionDef,
  row: Record<string, unknown>,
): FormValues {
  return Object.fromEntries(
    def.fields.map((field) => {
      const value = row[field.name];
      switch (field.type) {
        case "boolean":
          return [field.name, value === true];
        case "paragraphs":
          return [field.name, paragraphsToText(value as string[] | null)];
        case "year":
          return [
            field.name,
            value === null || value === undefined ? "" : String(value),
          ];
        default:
          return [field.name, typeof value === "string" ? value : ""];
      }
    }),
  );
}

/** Empty form values for a new item. */
export function emptyFormValues(def: CollectionDef): FormValues {
  return Object.fromEntries(
    def.fields.map((field) => [
      field.name,
      field.type === "boolean" ? false : "",
    ]),
  );
}

/**
 * Where an item lands after moving it up or down, among its siblings in
 * display order. Returns the two ids whose positions swap, or null at an edge.
 */
export function neighbourFor<T extends { id: string; sort: number }>(
  siblings: readonly T[],
  id: string,
  direction: "up" | "down",
): { a: T; b: T } | null {
  const ordered = [...siblings].sort((x, y) => x.sort - y.sort);
  const index = ordered.findIndex((item) => item.id === id);
  if (index === -1) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return null;
  return { a: ordered[index]!, b: ordered[target]! };
}
