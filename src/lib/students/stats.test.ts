import { describe, expect, it } from "vitest";

import { studentSchema } from "@/lib/students/schema";
import {
  byCategory,
  byLevel,
  byMode,
  enquiriesByMonth,
  joinsByMonth,
  lastMonths,
  rosterTotals,
} from "@/lib/students/stats";

type Row = Parameters<typeof rosterTotals>[0][number];

const row = (overrides: Partial<Row> = {}): Row => ({
  category: "children-beginner",
  level: "Level 1",
  mode: "studio",
  status: "active",
  joined_on: "2026-09-01",
  ...overrides,
});

const NOW = new Date("2026-09-13T08:00:00Z");

describe("roster statistics", () => {
  const roster = [
    row(),
    row({ category: "adults-beginner", mode: "online" }),
    row({ category: "advanced", level: "Level 10" }),
    row({ level: "level 1" }), // same level, different case
    row({ status: "paused" }),
    row({ status: "left", category: "advanced" }),
  ];

  it("totals every status", () => {
    expect(rosterTotals(roster)).toEqual({
      total: 6,
      active: 4,
      paused: 1,
      left: 1,
    });
  });

  it("counts only ACTIVE students per category, listing every category", () => {
    expect(byCategory(roster).map((s) => [s.key, s.value])).toEqual([
      ["children-beginner", 2],
      ["adults-beginner", 1],
      ["advanced", 1], // the advanced student who left is not counted
    ]);
  });

  it("shows zero for a category with nobody in it", () => {
    expect(byCategory([row()]).find((s) => s.key === "advanced")?.value).toBe(
      0,
    );
  });

  it("counts per mode", () => {
    expect(byMode(roster).map((s) => [s.key, s.value])).toEqual([
      ["studio", 3],
      ["home", 0],
      ["online", 1],
    ]);
  });

  it("groups levels case-insensitively and sorts them naturally", () => {
    expect(byLevel(roster).map((s) => [s.label, s.value])).toEqual([
      ["Level 1", 3],
      ["Level 10", 1], // after Level 1, not between "Level 1" and "Level 2"
    ]);
    expect(
      byLevel([row({ level: "Level 10" }), row({ level: "Level 2" })]).map(
        (s) => s.label,
      ),
    ).toEqual(["Level 2", "Level 10"]);
  });
});

describe("monthly series", () => {
  it("builds the last twelve calendar months, oldest first", () => {
    const months = lastMonths(NOW, 12);
    expect(months).toHaveLength(12);
    expect(months[0]!.month).toBe("2025-10");
    expect(months.at(-1)!.month).toBe("2026-09");
    expect(months.at(-1)!.label).toBe("Sep 26");
  });

  it("crosses the year boundary correctly", () => {
    const months = lastMonths(new Date("2026-02-10T00:00:00Z"), 3);
    expect(months.map((m) => m.month)).toEqual([
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });

  it("buckets joins by month and ignores anything outside the range", () => {
    const series = joinsByMonth(
      [
        row({ joined_on: "2026-09-01" }),
        row({ joined_on: "2026-09-30", status: "left" }), // any status counts
        row({ joined_on: "2026-01-15" }),
        row({ joined_on: "2019-01-01" }), // too old to chart
      ],
      NOW,
    );
    expect(series.at(-1)!.value).toBe(2);
    expect(series.find((m) => m.month === "2026-01")!.value).toBe(1);
    expect(series.reduce((sum, m) => sum + m.value, 0)).toBe(3);
  });

  it("buckets enquiries by their timestamp", () => {
    const series = enquiriesByMonth(
      ["2026-09-12T10:00:00Z", "2026-08-01T00:00:00Z", "2026-08-31T23:59:59Z"],
      NOW,
    );
    expect(series.at(-1)!.value).toBe(1);
    expect(series.at(-2)!.value).toBe(2);
  });
});

describe("studentSchema", () => {
  const valid = {
    name: "Aarav Sharma",
    email: "",
    phone: "",
    category: "children-beginner",
    level: "  Level   2 ",
    mode: "studio",
    status: "active",
    joined_on: "2026-09-01",
    notes: "",
  };

  it("normalises the level so the dashboard groups it tidily", () => {
    expect(studentSchema.parse(valid).level).toBe("Level 2");
  });

  it("stores blank optional fields as null, not empty strings", () => {
    const parsed = studentSchema.parse(valid);
    expect(parsed.email).toBeNull();
    expect(parsed.phone).toBeNull();
    expect(parsed.notes).toBeNull();
  });

  it("lower-cases email", () => {
    expect(
      studentSchema.parse({ ...valid, email: "Parent@Example.COM" }).email,
    ).toBe("parent@example.com");
  });

  it("rejects values the database would refuse", () => {
    for (const bad of [
      { category: "intermediate" },
      { mode: "hybrid" },
      { status: "graduated" },
      { joined_on: "13/09/2026" },
      { email: "not-an-email" },
      { name: "A" },
      { level: "   " },
    ]) {
      expect(studentSchema.safeParse({ ...valid, ...bad }).success).toBe(false);
    }
  });
});
