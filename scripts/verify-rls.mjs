/**
 * Row-level security verification.
 *
 * Attacks the live database exactly as an anonymous visitor could — using ONLY
 * the public (publishable) key that ships to every browser — and fails if
 * anything private can be read or anything at all can be written.
 *
 * Run after applying the migration, and again after any policy change:
 *
 *   npm run verify:rls
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from
 * .env.local. It never uses the secret key: the whole point is to see the
 * database the way an attacker holding the public key sees it.
 *
 * Note on how RLS denies a read: a SELECT on a table the caller cannot see
 * returns ZERO ROWS, not an error. So "no rows came back" is the pass
 * condition for reads, and this script seeds nothing — run it against a
 * database that actually contains data (e.g. after the first enquiry) for the
 * read checks to be meaningful. Write checks are meaningful immediately.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

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

if (!url || !publishableKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local first.",
  );
  process.exit(2);
}

const anon = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let failures = 0;
const pass = (msg) => console.log(`  PASS  ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  FAIL  ${msg}`);
};

// ---- 1. Private tables must be unreadable ----------------------------------
console.log("\nPrivate tables are unreadable anonymously");
for (const table of [
  "students",
  "enquiries",
  "login_attempts",
  "admin_audit_log",
  "admins",
  "system_heartbeat",
]) {
  const { data, error } = await anon.from(table).select("*").limit(1);
  if (error) pass(`${table}: refused (${error.code ?? error.message})`);
  else if ((data ?? []).length === 0) pass(`${table}: no rows visible`);
  else fail(`${table}: ${data.length} row(s) READABLE by the public key`);
}

// ---- 2. Unpublished content must stay hidden -------------------------------
console.log("\nUnpublished content is hidden");
for (const [table, column] of [
  ["testimonials", "published"],
  ["content_blocks", "published"],
  ["gallery_photos", "published"],
  ["fee_plans", "published"],
  ["social_links", "enabled"],
  ["bot_knowledge", "enabled"],
]) {
  const { data, error } = await anon
    .from(table)
    .select(column)
    .eq(column, false)
    .limit(1);
  if (error) fail(`${table}: unexpected error reading (${error.message})`);
  else if ((data ?? []).length === 0) pass(`${table}: no hidden rows exposed`);
  else fail(`${table}: HIDDEN rows are readable`);
}

// ---- 3. Nothing may be written anonymously ---------------------------------
console.log("\nNothing is writable anonymously");
const probes = {
  enquiries: {
    name: "RLS probe",
    email: "probe@example.com",
    message: "rls verification probe",
  },
  testimonials: { author: "RLS probe", body: ["probe"] },
  students: {
    name: "RLS probe",
    category: "advanced",
    level: "1",
    mode: "online",
  },
  site_settings: { id: 1, data: { hijacked: true } },
  login_attempts: {
    key_hash: "probe",
    key_kind: "ip",
    outcome: "success",
  },
  admins: { user_id: "00000000-0000-0000-0000-000000000000" },
};

for (const [table, row] of Object.entries(probes)) {
  const { error } = await anon.from(table).insert(row);
  if (error) pass(`${table}: insert refused`);
  else fail(`${table}: ANONYMOUS INSERT SUCCEEDED — delete the probe row now`);
}

const { error: updateError, data: updated } = await anon
  .from("site_settings")
  .update({ data: { hijacked: true } })
  .eq("id", 1)
  .select();
if (updateError || (updated ?? []).length === 0)
  pass("site_settings: update refused");
else fail("site_settings: ANONYMOUS UPDATE SUCCEEDED");

// ---- 4. The admin check must say no ----------------------------------------
console.log("\nThe admin allow-list rejects the public key");
const { data: isAdmin, error: rpcError } = await anon.rpc("is_admin");
if (rpcError) fail(`is_admin(): unexpected error (${rpcError.message})`);
else if (isAdmin === false) pass("is_admin() is false for an anonymous caller");
else fail("is_admin() returned TRUE for an anonymous caller");

// ---- 5. Storage writes must be refused -------------------------------------
console.log("\nMedia storage refuses anonymous uploads");
const { error: uploadError } = await anon.storage
  .from("media")
  .upload(`rls-probe-${Date.now()}.txt`, new Blob(["probe"]), {
    contentType: "image/png",
  });
if (uploadError) pass("media bucket: upload refused");
else fail("media bucket: ANONYMOUS UPLOAD SUCCEEDED — remove the probe file");

console.log(
  failures === 0
    ? "\nAll row-level security checks passed.\n"
    : `\n${failures} check(s) FAILED. Do not deploy until fixed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
