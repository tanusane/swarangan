import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";

import {
  BACKUP_TABLES,
  backupFilename,
  buildBackup,
  toCsv,
} from "@/lib/backup/format";

describe("toCsv", () => {
  it("writes a header from the union of keys, in first-seen order", () => {
    const csv = toCsv([
      { a: 1, b: 2 },
      { a: 3, c: 4 },
    ]);
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines).toEqual(["a,b,c", "1,2,", "3,,4"]);
  });

  it("quotes commas, quotes and line breaks per RFC 4180", () => {
    const csv = toCsv([{ message: 'He said "hello", then\nleft' }]);
    expect(csv).toContain('"He said ""hello"", then\nleft"');
  });

  it("neutralises CSV injection so Excel never runs an enquiry as a formula", () => {
    const csv = toCsv([
      { message: '=HYPERLINK("http://evil","click")' },
      { message: "+1 234" },
      { message: "-2+3" },
      { message: "@SUM(A1)" },
    ]);
    const body = csv.replace(/^﻿/, "").split("\r\n").slice(1, 5);
    for (const line of body) {
      // Every dangerous cell starts with an apostrophe (possibly inside quotes).
      expect(line.replace(/^"/, "").startsWith("'")).toBe(true);
    }
  });

  it("serialises arrays and objects as JSON rather than [object Object]", () => {
    const csv = toCsv([{ body: ["para one", "para two"], data: { x: 1 } }]);
    expect(csv).toContain('"[""para one"",""para two""]"');
    expect(csv).not.toContain("[object Object]");
  });

  it("writes null and undefined as empty cells", () => {
    expect(toCsv([{ a: null, b: undefined, c: 0 }])).toContain("\r\n,,0");
  });

  it("starts with a UTF-8 BOM so Excel reads Devanagari correctly", () => {
    expect(toCsv([{ swara: "सा" }]).charCodeAt(0)).toBe(0xfeff);
  });

  it("returns an empty file for an empty table", () => {
    expect(toCsv([])).toBe("");
  });
});

describe("buildBackup", () => {
  const data = {
    testimonials: [
      {
        id: "t1",
        author: "Neha Sahai",
        body: ["I am so glad I found Tanuja Sane…"],
      },
    ],
    gallery_photos: [
      { id: "p1", storage_path: "gallery/a.jpg" },
      { id: "p2", storage_path: "gallery/b.jpg" },
    ],
    media_slots: [{ key: "home.hero", storage_path: "gallery/a.jpg" }],
    students: [{ id: "s1", name: "Aarav", notes: "=cmd" }],
  };

  const createdAt = new Date("2026-09-13T06:05:00Z");
  const { bytes, manifest } = buildBackup(data, {
    createdAt,
    createdBy: "admin@example.com",
  });
  const files = unzipSync(bytes);

  it("contains a JSON and a CSV file for every table, plus manifest and readme", () => {
    for (const table of BACKUP_TABLES) {
      expect(files[`json/${table}.json`]).toBeDefined();
      expect(files[`csv/${table}.csv`]).toBeDefined();
    }
    expect(files["manifest.json"]).toBeDefined();
    expect(files["README.txt"]).toBeDefined();
  });

  it("round-trips rows exactly through JSON", () => {
    const restored = JSON.parse(strFromU8(files["json/testimonials.json"]!));
    expect(restored).toEqual(data.testimonials);
    // Empty tables are still present, as an empty array.
    expect(JSON.parse(strFromU8(files["json/fee_plans.json"]!))).toEqual([]);
  });

  it("records row counts, author and time in the manifest", () => {
    const stored = JSON.parse(strFromU8(files["manifest.json"]!));
    expect(stored).toEqual(manifest);
    expect(manifest.createdBy).toBe("admin@example.com");
    expect(manifest.createdAt).toBe("2026-09-13T06:05:00.000Z");
    expect(manifest.tables.find((t) => t.name === "students")?.rows).toBe(1);
  });

  it("lists referenced photo paths once each, since photos are not in the ZIP", () => {
    expect(manifest.mediaPaths).toEqual(["gallery/a.jpg", "gallery/b.jpg"]);
  });

  it("never includes the tables that must not be restored", () => {
    const names = Object.keys(files).join(" ");
    expect(names).not.toMatch(/login_attempts|admins\.|system_heartbeat/);
  });

  it("restores parent tables before children", () => {
    expect(BACKUP_TABLES.indexOf("gallery_albums")).toBeLessThan(
      BACKUP_TABLES.indexOf("gallery_photos"),
    );
  });
});

describe("backupFilename", () => {
  it("uses Singapore time, so a late-evening backup gets that day's date", () => {
    // 16:30 UTC is 00:30 the next day in Singapore.
    expect(backupFilename(new Date("2026-09-13T16:30:00Z"))).toBe(
      "swarangan-backup-2026-09-14-0030.zip",
    );
  });
});
