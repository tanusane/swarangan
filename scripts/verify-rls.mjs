/**
 * Row-level security verification.
 *
 * Attacks the live database exactly as an anonymous visitor could — using ONLY
 * the public (publishable) key that ships to every browser — and fails if
 * anything private can be read or anything at all can be written.
 *
 *   npm run verify:rls
 *
 * HOW IT AVOIDS FALSE PASSES
 *   - Reads are tested against real data. A SELECT on a hidden table returns
 *     zero rows rather than an error, so "no rows came back" proves nothing on
 *     an empty table. The script therefore plants clearly-labelled canary rows
 *     with the SECRET key, tries to read them with the PUBLIC key, and deletes
 *     them afterwards. The secret key is used only to plant and remove canaries;
 *     every check itself uses the public key alone.
 *   - A write only passes if Postgres refused it for row-level security
 *     (error 42501). Any other error — above all "table does not exist", which
 *     is what a failed migration looks like — is a FAIL, not a pass.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

// ---- Load .env.local without adding a dependency ---------------------------
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secretKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in .env.local first.",
  );
  process.exit(2);
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const anon = createClient(url, publishableKey, options);
const planter = createClient(url, secretKey, options);

const MARK = `rls-canary-${Date.now()}`;
let failures = 0;
const pass = (msg) => console.log(`  PASS  ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};

const isRlsRefusal = (error) =>
  error?.code === "42501" || /row-level security/i.test(error?.message ?? "");

// ---- 0. Plant canaries ------------------------------------------------------
console.log("\nPlanting canary rows (secret key)");
const cleanup = [];

async function plant(table, row, idColumn = "id") {
  const { data, error } = await planter
    .from(table)
    .insert(row)
    .select(idColumn)
    .single();
  if (error) {
    fail(
      `${table}: could not plant a canary (${error.code}: ${error.message}) — has the migration run?`,
    );
    return false;
  }
  cleanup.push({ table, idColumn, id: data[idColumn] });
  pass(`${table}: canary planted`);
  return true;
}

await plant("students", {
  name: MARK,
  category: "advanced",
  level: "canary",
  mode: "online",
});
await plant("enquiries", {
  name: MARK,
  email: "canary@example.com",
  message: MARK,
});
await plant("login_attempts", {
  key_hash: MARK,
  key_kind: "ip",
  outcome: "failure",
});
await plant("admin_audit_log", { action: MARK, detail: {} });
await plant("testimonials", { author: MARK, body: [MARK], published: false });
await plant("fee_plans", {
  title: MARK,
  price: "0",
  cadence: MARK,
  published: false,
});
await plant("social_links", {
  platform: "youtube",
  embed_ref: MARK,
  title: MARK,
  enabled: false,
});
await plant("bot_knowledge", {
  patterns: [MARK],
  answer: MARK,
  enabled: false,
});

// ---- 1. Private tables must be unreadable ----------------------------------
console.log("\nPrivate tables are unreadable with the public key");
for (const [table, column] of [
  ["students", "name"],
  ["enquiries", "name"],
  ["login_attempts", "key_hash"],
  ["admin_audit_log", "action"],
]) {
  const { data, error } = await anon.from(table).select("*").eq(column, MARK);
  if (error && !isRlsRefusal(error))
    fail(`${table}: unexpected error (${error.code}: ${error.message})`);
  else if ((data ?? []).length === 0) pass(`${table}: canary is invisible`);
  else fail(`${table}: CANARY IS READABLE by the public key`);
}

for (const table of ["admins", "system_heartbeat"]) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  if (error && !isRlsRefusal(error))
    fail(`${table}: unexpected error (${error.code}: ${error.message})`);
  else if ((data ?? []).length === 0) pass(`${table}: nothing visible`);
  else fail(`${table}: ROWS ARE READABLE by the public key`);
}

// ---- 2. Unpublished content must stay hidden -------------------------------
console.log("\nUnpublished content is hidden from the public key");
for (const [table, column] of [
  ["testimonials", "author"],
  ["fee_plans", "title"],
  ["social_links", "title"],
  ["bot_knowledge", "answer"],
]) {
  const { data, error } = await anon.from(table).select("*").eq(column, MARK);
  if (error)
    fail(`${table}: unexpected error (${error.code}: ${error.message})`);
  else if ((data ?? []).length === 0)
    pass(`${table}: unpublished canary is hidden`);
  else fail(`${table}: UNPUBLISHED CANARY IS READABLE`);
}

// ---- 3. Nothing may be written anonymously ---------------------------------
console.log("\nNothing is writable with the public key");
const probes = {
  enquiries: { name: MARK, email: "probe@example.com", message: MARK },
  testimonials: { author: MARK, body: [MARK] },
  students: { name: MARK, category: "advanced", level: "1", mode: "online" },
  site_settings: { id: 1, data: { hijacked: true } },
  login_attempts: { key_hash: MARK, key_kind: "ip", outcome: "success" },
  admins: { user_id: "00000000-0000-0000-0000-000000000000" },
  media_slots: { key: MARK, storage_path: "x", alt: "probe" },
};

for (const [table, row] of Object.entries(probes)) {
  const { error } = await anon.from(table).insert(row);
  if (isRlsRefusal(error))
    pass(`${table}: insert refused by row-level security`);
  else if (error)
    fail(
      `${table}: insert failed for the WRONG reason (${error.code}: ${error.message})`,
    );
  else fail(`${table}: ANONYMOUS INSERT SUCCEEDED`);
}

// An UPDATE that RLS hides simply matches no rows; that is the pass condition.
const { data: updated, error: updateError } = await anon
  .from("testimonials")
  .update({ author: "hijacked" })
  .eq("author", MARK)
  .select();
if (updateError && !isRlsRefusal(updateError))
  fail(`testimonials update: unexpected error (${updateError.message})`);
else if ((updated ?? []).length === 0)
  pass("testimonials: update matched nothing");
else fail("testimonials: ANONYMOUS UPDATE SUCCEEDED");

const { data: deleted, error: deleteError } = await anon
  .from("students")
  .delete()
  .eq("name", MARK)
  .select();
if (deleteError && !isRlsRefusal(deleteError))
  fail(`students delete: unexpected error (${deleteError.message})`);
else if ((deleted ?? []).length === 0) pass("students: delete matched nothing");
else fail("students: ANONYMOUS DELETE SUCCEEDED");

// ---- 4. The admin check must say no ----------------------------------------
console.log("\nThe admin allow-list rejects the public key");
const { data: isAdmin, error: rpcError } = await anon.rpc("is_admin");
if (rpcError) fail(`is_admin(): unexpected error (${rpcError.message})`);
else if (isAdmin === false) pass("is_admin() is false for an anonymous caller");
else fail("is_admin() returned TRUE for an anonymous caller");

// ---- 5. Storage writes must be refused -------------------------------------
console.log("\nMedia storage refuses anonymous uploads");
// A genuine 1x1 PNG with an explicit image type, so the bucket's file-type
// filter lets it through and the security policy is what actually decides.
const PNG_1PX = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);
const { error: uploadError } = await anon.storage
  .from("media")
  .upload(`${MARK}.png`, new Blob([PNG_1PX], { type: "image/png" }), {
    contentType: "image/png",
  });
if (
  uploadError &&
  /row-level security|unauthorized|403/i.test(
    `${uploadError.message} ${uploadError.statusCode ?? ""}`,
  )
) {
  pass("media bucket: upload refused");
} else if (uploadError) {
  fail(
    `media bucket: upload failed for an unexpected reason (${uploadError.message}) — does the bucket exist?`,
  );
} else {
  fail("media bucket: ANONYMOUS UPLOAD SUCCEEDED");
  await planter.storage.from("media").remove([`${MARK}.png`]);
}

// ---- 6. Admin account exists -----------------------------------------------
console.log("\nSetup");
const { count, error: adminError } = await planter
  .from("admins")
  .select("*", { count: "exact", head: true });
if (adminError) fail(`admins: could not count (${adminError.message})`);
else if ((count ?? 0) > 0)
  pass(`admins: ${count} admin account(s) on the allow-list`);
else
  fail(
    "admins: NO ADMIN on the allow-list yet — nobody can sign in (SETUP.md step 4)",
  );

// ---- Clean up canaries ------------------------------------------------------
for (const { table, idColumn, id } of cleanup) {
  const { error } = await planter.from(table).delete().eq(idColumn, id);
  if (error)
    console.log(
      `  WARN  could not remove canary from ${table} (${error.message}) — delete rows marked ${MARK}`,
    );
}
console.log(`\nRemoved ${cleanup.length} canary row(s).`);

console.log(
  failures === 0
    ? "\nAll row-level security checks passed.\n"
    : `\n${failures} check(s) FAILED. Do not deploy until fixed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
