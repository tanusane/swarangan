import { after, NextResponse, type NextRequest } from "next/server";

import { writeAudit } from "@/lib/audit";
import { clientIpFrom } from "@/lib/auth/client-ip";
import { getAdmin } from "@/lib/auth/dal";
import { beginAttempt, settleAttempt, throttleKeys } from "@/lib/auth/throttle";
import { passwordMatches, readAllTables } from "@/lib/backup/export";
import {
  MAX_BACKUP_BYTES,
  backupFilename,
  buildBackup,
} from "@/lib/backup/format";

/**
 * POST /admin/backup/download — the full database backup, as a ZIP.
 *
 * The most sensitive thing the site can hand out (every student's and
 * enquirer's contact details), so it takes more than a session:
 *   1. same-origin requests only (no cross-site form can trigger it);
 *   2. a signed-in admin;
 *   3. the admin's password, re-entered — a borrowed unlocked laptop is not
 *      enough — checked under the same lockout as the sign-in page;
 *   4. an audit entry for every download and every refusal.
 * The response is never cached.
 */

const NO_STORE = { "Cache-Control": "no-store" };

function refuse(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: NO_STORE });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return refuse(403, "Please start the download from the Backup page.");
  }

  const admin = await getAdmin();
  if (!admin?.email) return refuse(401, "Please sign in again.");

  let password = "";
  try {
    const form = await request.formData();
    password = String(form.get("password") ?? "");
  } catch {
    return refuse(400, "Invalid request.");
  }
  if (!password || password.length > 256) {
    return refuse(400, "Please enter your password.");
  }

  const ip = clientIpFrom(request.headers.get("x-forwarded-for"));
  const { ids, decision } = await beginAttempt(throttleKeys(admin.email, ip));

  if (decision.retryAfterSeconds > 0) {
    await settleAttempt(ids, "blocked");
    after(() =>
      writeAudit("backup.denied", { reason: "locked" }, admin.userId),
    );
    return refuse(
      429,
      "Too many attempts. Please wait a few minutes and try again.",
    );
  }

  if (!(await passwordMatches(admin.email, admin.userId, password))) {
    await settleAttempt(ids, "failure");
    after(() =>
      writeAudit("backup.denied", { reason: "password" }, admin.userId),
    );
    return refuse(403, "That password is not correct.");
  }
  await settleAttempt(ids, "success");

  const createdAt = new Date();
  let backup;
  try {
    backup = buildBackup(await readAllTables(), {
      createdAt,
      createdBy: admin.email,
    });
  } catch (error) {
    console.error("[backup] failed", error);
    return refuse(500, "The backup could not be created. Please try again.");
  }

  if (backup.bytes.byteLength > MAX_BACKUP_BYTES) {
    after(() =>
      writeAudit(
        "backup.denied",
        { reason: "too_large", bytes: backup.bytes.byteLength },
        admin.userId,
      ),
    );
    return refuse(
      413,
      "The backup is larger than a single download allows. Please use the backup script described in SETUP.md.",
    );
  }

  after(() =>
    writeAudit(
      "backup.download",
      { bytes: backup.bytes.byteLength, tables: backup.manifest.tables },
      admin.userId,
    ),
  );

  return new NextResponse(Buffer.from(backup.bytes), {
    status: 200,
    headers: {
      ...NO_STORE,
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${backupFilename(createdAt)}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
