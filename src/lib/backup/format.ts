import { strToU8, zipSync } from "fflate";

/**
 * The backup file format.
 *
 * Pure — no database, no request — so the exact bytes a backup contains are
 * covered by tests, and the restore script can be proven to read back what this
 * writes.
 *
 * A backup is a ZIP containing, for every table:
 *   json/<table>.json   exact rows, for restoring
 *   csv/<table>.csv     the same rows, for opening in Excel or Google Sheets
 * plus manifest.json describing what is inside and README.txt for a human.
 *
 * JSON is the source of truth for restore. CSV is a convenience for reading, and
 * is lossy by nature (everything becomes text).
 */

export const BACKUP_FORMAT_VERSION = 1;

/**
 * Tables in backup, in RESTORE order: a table appears after any table it has a
 * foreign key to (gallery_photos after gallery_albums).
 *
 * Deliberately excluded:
 *   login_attempts    Short-lived throttle data. Worthless to restore, and it
 *                     would carry forward stale lockouts.
 *   admins            References Supabase auth user ids, which do not exist in a
 *                     fresh project; restoring it would fail or, worse, grant
 *                     admin to whoever later received a colliding id. Admins are
 *                     re-added by hand per SETUP.md.
 *   system_heartbeat  Operational noise.
 */
export const BACKUP_TABLES = [
  "site_settings",
  "content_blocks",
  "class_offerings",
  "testimonials",
  "gallery_albums",
  "gallery_photos",
  "social_links",
  "media_slots",
  "fee_plans",
  "bot_knowledge",
  "students",
  "enquiries",
  "admin_audit_log",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];
export type Row = Record<string, unknown>;

/**
 * Vercel functions cannot return more than 4.5 MB. A little headroom is kept for
 * headers and the chance that measurement and transport disagree.
 */
export const MAX_BACKUP_BYTES = 4.3 * 1024 * 1024;

// ---- CSV ---------------------------------------------------------------------

/**
 * Spreadsheet applications execute a cell beginning with these characters as a
 * formula. An enquiry whose message starts with "=HYPERLINK(...)" would then run
 * when Amit opens the backup in Excel — CSV injection. Such cells are prefixed
 * with an apostrophe, which spreadsheets treat as "this is text".
 */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text =
    typeof value === "string"
      ? value
      : Array.isArray(value) || typeof value === "object"
        ? JSON.stringify(value)
        : String(value);

  if (FORMULA_TRIGGER.test(text)) text = `'${text}`;

  // RFC 4180: quote any cell containing a comma, quote or line break, and
  // double any embedded quotes.
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Rows to CSV. The header is the union of every row's keys in first-seen order,
 * so a row missing an optional column still lines up.
 */
export function toCsv(rows: readonly Row[]): string {
  if (rows.length === 0) return "";

  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }

  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(","));
  }
  // CRLF and a UTF-8 BOM so Excel opens Devanagari and curly quotes correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}

// ---- Manifest ----------------------------------------------------------------

export interface BackupManifest {
  format: "swarangan-backup";
  version: typeof BACKUP_FORMAT_VERSION;
  createdAt: string;
  createdBy: string | null;
  tables: { name: BackupTable; rows: number }[];
  /**
   * Image paths in Supabase Storage referenced by the backed-up rows. The images
   * themselves are NOT in the ZIP — together they would far exceed the 4.5 MB a
   * download can be — so this lists what to fetch separately.
   */
  mediaPaths: string[];
}

function collectMediaPaths(
  data: Partial<Record<BackupTable, Row[]>>,
): string[] {
  const paths = new Set<string>();
  for (const table of ["gallery_photos", "media_slots"] as const) {
    for (const row of data[table] ?? []) {
      if (typeof row.storage_path === "string") paths.add(row.storage_path);
    }
  }
  return [...paths].sort();
}

// ---- ZIP ---------------------------------------------------------------------

const README = `Swarangan database backup
=========================

json/     Exact copies of each table. These are what the restore script uses.
csv/      The same data for opening in Excel or Google Sheets.
manifest.json   When this was made, by whom, and how many rows each table has.

Photos are NOT inside this file (they are too large for one download). They
remain in Supabase Storage; manifest.json lists every photo path in use.

To restore into a Supabase project, see "Restoring a backup" in SETUP.md.
Keep this file somewhere private: it contains students' and enquirers'
contact details.
`;

export interface BuiltBackup {
  bytes: Uint8Array;
  manifest: BackupManifest;
}

export function buildBackup(
  data: Partial<Record<BackupTable, Row[]>>,
  meta: { createdAt: Date; createdBy: string | null },
): BuiltBackup {
  const manifest: BackupManifest = {
    format: "swarangan-backup",
    version: BACKUP_FORMAT_VERSION,
    createdAt: meta.createdAt.toISOString(),
    createdBy: meta.createdBy,
    tables: BACKUP_TABLES.map((name) => ({
      name,
      rows: data[name]?.length ?? 0,
    })),
    mediaPaths: collectMediaPaths(data),
  };

  const files: Record<string, Uint8Array> = {
    "manifest.json": strToU8(JSON.stringify(manifest, null, 2)),
    "README.txt": strToU8(README),
  };

  for (const table of BACKUP_TABLES) {
    const rows = data[table] ?? [];
    files[`json/${table}.json`] = strToU8(JSON.stringify(rows, null, 2));
    files[`csv/${table}.csv`] = strToU8(toCsv(rows));
  }

  return { bytes: zipSync(files, { level: 9 }), manifest };
}

/** "swarangan-backup-2026-09-13-1405.zip", in Singapore time. */
export function backupFilename(createdAt: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(createdAt);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `swarangan-backup-${get("year")}-${get("month")}-${get("day")}-${get("hour")}${get("minute")}.zip`;
}
