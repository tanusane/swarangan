"use server";

import { updateTag } from "next/cache";

import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/dal";
import { CONTENT_TAG } from "@/lib/content/cache";
import {
  collection,
  isCollectionKey,
  type CollectionDef,
} from "@/lib/cms/collections";
import {
  fieldErrors,
  itemSchema,
  neighbourFor,
  uniqueSlug,
  type FormValues,
} from "@/lib/cms/fields";
import { STORAGE_BUCKET } from "@/lib/media/slots";
import { sessionClient } from "@/lib/supabase/clients";

/**
 * The generic content actions, shared by every collection editor.
 *
 * Every action, without exception:
 *   1. re-verifies the caller is an admin (a Server Action is a public endpoint);
 *   2. accepts only a collection named in the registry — the browser cannot
 *      point these at `students` or `admins`;
 *   3. validates input against that collection's own field definitions, which
 *      also strips any column the editor does not expose;
 *   4. confines reads and writes to the collection's scope, so the "videos"
 *      editor can never touch an Instagram row, nor page text outside its page;
 *   5. runs as the signed-in user, so row-level security still applies;
 *   6. records the change in the audit log and refreshes the public pages.
 */

export type ContentResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type Supabase = Awaited<ReturnType<typeof sessionClient>>;

function resolve(key: string): CollectionDef | null {
  return isCollectionKey(key) ? collection(key) : null;
}

/** A query builder narrowed to the collection's scope. */
function scoped(def: CollectionDef, supabase: Supabase) {
  return {
    select: (columns: string) => {
      const query = supabase.from(def.table).select(columns);
      return def.scope ? query.eq(def.scope.column, def.scope.value) : query;
    },
    update: (values: Record<string, unknown>) => {
      const query = supabase.from(def.table).update(values);
      return def.scope ? query.eq(def.scope.column, def.scope.value) : query;
    },
    delete: () => {
      const query = supabase.from(def.table).delete();
      return def.scope ? query.eq(def.scope.column, def.scope.value) : query;
    },
  };
}

async function done(
  action:
    | "content.create"
    | "content.update"
    | "content.delete"
    | "content.reorder"
    | "content.visibility",
  collectionKey: string,
  detail: Record<string, unknown>,
  userId: string,
): Promise<ContentResult> {
  await writeAudit(action, { collection: collectionKey, ...detail }, userId);
  updateTag(CONTENT_TAG);
  return { ok: true };
}

const GENERIC_FAILURE: ContentResult = {
  ok: false,
  error: "Could not save that change. Please try again.",
};

// ---- Create / update -------------------------------------------------------------

export async function saveItem(
  collectionKey: string,
  id: string | null,
  values: FormValues,
): Promise<ContentResult> {
  const admin = await requireAdmin();
  const def = resolve(collectionKey);
  if (!def) return { ok: false, error: "Unknown section." };

  const parsed = itemSchema(def).safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  const supabase = await sessionClient();
  const table = scoped(def, supabase);

  if (id) {
    const { data, error } = await table
      .update(parsed.data)
      .eq(def.idColumn, id)
      .select(def.idColumn);
    if (error) {
      console.error(`[content] update ${collectionKey} failed`, error);
      return GENERIC_FAILURE;
    }
    if (!data?.length)
      return { ok: false, error: "That item no longer exists." };
    return done("content.update", collectionKey, { id }, admin.userId);
  }

  if (!def.canCreate)
    return { ok: false, error: "New items cannot be added here." };

  // New items go to the end of the list.
  const { data: existing, error: readError } = await table.select(
    `${def.idColumn}, sort`,
  );
  if (readError) {
    console.error(`[content] read ${collectionKey} failed`, readError);
    return GENERIC_FAILURE;
  }
  const rows = (existing ?? []) as unknown as Record<string, unknown>[];
  const sort =
    rows.reduce((max, row) => Math.max(max, Number(row.sort ?? 0)), -1) + 1;

  const insert: Record<string, unknown> = {
    ...def.insertDefaults,
    ...(def.scope ? { [def.scope.column]: def.scope.value } : {}),
    ...parsed.data,
    sort,
  };

  if (def.keyFrom) {
    const taken = new Set(rows.map((row) => String(row[def.idColumn])));
    insert[def.idColumn] = uniqueSlug(
      String(parsed.data[def.keyFrom] ?? ""),
      taken,
    );
  }

  const { error } = await supabase.from(def.table).insert(insert);
  if (error) {
    console.error(`[content] create ${collectionKey} failed`, error);
    return GENERIC_FAILURE;
  }
  return done("content.create", collectionKey, {}, admin.userId);
}

// ---- Delete ----------------------------------------------------------------------

/** Remove uploaded files. Committed "/images/…" paths are never touched. */
async function removeUploads(
  supabase: Supabase,
  paths: unknown[],
): Promise<void> {
  const uploaded = paths.filter(
    (path): path is string =>
      typeof path === "string" && path !== "" && !path.startsWith("/"),
  );
  if (uploaded.length === 0) return;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(uploaded);
  // Best effort: an orphaned file wastes a little storage but breaks nothing.
  if (error) console.error("[content] could not remove uploaded files", error);
}

export async function deleteItem(
  collectionKey: string,
  id: string,
): Promise<ContentResult> {
  const admin = await requireAdmin();
  const def = resolve(collectionKey);
  if (!def) return { ok: false, error: "Unknown section." };
  if (!def.canDelete)
    return { ok: false, error: "Items here cannot be deleted." };

  const supabase = await sessionClient();
  const table = scoped(def, supabase);

  // Gather files to remove before the rows disappear.
  const filePaths: unknown[] = [];
  if (def.storageColumn) {
    const { data } = await table.select(def.storageColumn).eq(def.idColumn, id);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      filePaths.push(row[def.storageColumn]);
    }
  }
  if (def.cascadeStorage) {
    const { table: child, foreignKey, storageColumn } = def.cascadeStorage;
    const { data } = await supabase
      .from(child)
      .select(storageColumn)
      .eq(foreignKey, id);
    for (const row of (data ?? []) as unknown as Record<string, unknown>[]) {
      filePaths.push(row[storageColumn]);
    }
  }

  const { data, error } = await table
    .delete()
    .eq(def.idColumn, id)
    .select(def.idColumn);
  if (error) {
    console.error(`[content] delete ${collectionKey} failed`, error);
    return GENERIC_FAILURE;
  }
  if (!data?.length) return { ok: false, error: "That item no longer exists." };

  await removeUploads(supabase, filePaths);
  return done("content.delete", collectionKey, { id }, admin.userId);
}

// ---- Reorder -----------------------------------------------------------------------

export async function moveItem(
  collectionKey: string,
  id: string,
  direction: "up" | "down",
): Promise<ContentResult> {
  const admin = await requireAdmin();
  const def = resolve(collectionKey);
  if (!def) return { ok: false, error: "Unknown section." };
  if (!def.sortable) return { ok: false, error: "The order here is fixed." };

  const supabase = await sessionClient();
  const table = scoped(def, supabase);
  const columns = [def.idColumn, "sort", def.groupColumn]
    .filter(Boolean)
    .join(", ");

  const { data, error } = await table.select(columns);
  if (error) {
    console.error(`[content] read ${collectionKey} for reorder failed`, error);
    return GENERIC_FAILURE;
  }

  const rows = ((data ?? []) as unknown as Record<string, unknown>[]).map(
    (row) => ({
      id: String(row[def.idColumn]),
      sort: Number(row.sort ?? 0),
      group: def.groupColumn ? row[def.groupColumn] : null,
    }),
  );

  const self = rows.find((row) => row.id === id);
  if (!self) return { ok: false, error: "That item no longer exists." };
  const siblings = rows.filter((row) => row.group === self.group);

  // Normalise to 0..n first, so equal or gappy sort values still move cleanly.
  const ordered = [...siblings]
    .sort((a, b) => a.sort - b.sort)
    .map((row, index) => ({ ...row, sort: index }));
  const pair = neighbourFor(ordered, id, direction);
  if (!pair) return { ok: true };

  const updates = ordered.map((row) => {
    const sort =
      row.id === pair.a.id
        ? pair.b.sort
        : row.id === pair.b.id
          ? pair.a.sort
          : row.sort;
    return table.update({ sort }).eq(def.idColumn, row.id);
  });
  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    console.error(`[content] reorder ${collectionKey} failed`, failed.error);
    return GENERIC_FAILURE;
  }

  return done(
    "content.reorder",
    collectionKey,
    { id, direction },
    admin.userId,
  );
}

// ---- Show / hide -------------------------------------------------------------------

export async function setVisibility(
  collectionKey: string,
  id: string,
  visible: boolean,
): Promise<ContentResult> {
  const admin = await requireAdmin();
  const def = resolve(collectionKey);
  if (!def?.visibility)
    return { ok: false, error: "Items here cannot be hidden." };
  if (typeof visible !== "boolean")
    return { ok: false, error: "Invalid value." };

  const supabase = await sessionClient();
  const { data, error } = await scoped(def, supabase)
    .update({ [def.visibility.column]: visible })
    .eq(def.idColumn, id)
    .select(def.idColumn);
  if (error) {
    console.error(`[content] visibility ${collectionKey} failed`, error);
    return GENERIC_FAILURE;
  }
  if (!data?.length) return { ok: false, error: "That item no longer exists." };

  return done(
    "content.visibility",
    collectionKey,
    { id, visible },
    admin.userId,
  );
}
