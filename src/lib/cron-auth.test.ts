import { describe, expect, it } from "vitest";

import { isAuthorizedCron } from "@/lib/cron-auth";
import { clientIpFrom } from "@/lib/auth/client-ip";
import { describeAge, heartbeatHealth, STALE_AFTER_MS } from "@/lib/heartbeat";

const SECRET = "s".repeat(40);

describe("isAuthorizedCron", () => {
  it("accepts the exact bearer secret", () => {
    expect(isAuthorizedCron(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it.each([
    ["no header", null],
    ["an empty header", ""],
    ["the secret without the Bearer prefix", SECRET],
    ["a different secret", `Bearer ${"x".repeat(40)}`],
    ["a prefix of the secret", `Bearer ${SECRET.slice(0, 20)}`],
    ["the secret with trailing text", `Bearer ${SECRET}extra`],
  ])("rejects %s", (_label, header) => {
    expect(isAuthorizedCron(header, SECRET)).toBe(false);
  });

  it("refuses everything if the secret itself is empty", () => {
    // A missing env var must never turn into "any caller may ping".
    expect(isAuthorizedCron("Bearer ", "")).toBe(false);
  });
});

describe("clientIpFrom", () => {
  it("takes the address Vercel sets", () => {
    expect(clientIpFrom("203.0.113.7")).toBe("203.0.113.7");
  });

  it("takes the first entry if a list ever arrives", () => {
    expect(clientIpFrom("203.0.113.7, 10.0.0.1")).toBe("203.0.113.7");
  });

  it("falls back to a single shared key when absent", () => {
    expect(clientIpFrom(null)).toBe("unknown");
    expect(clientIpFrom("   ")).toBe("unknown");
  });
});

describe("heartbeatHealth", () => {
  const now = new Date("2026-09-13T12:00:00Z");

  it("reports missing before the first ping", () => {
    expect(heartbeatHealth(null, now)).toEqual({ status: "missing" });
  });

  it("is healthy within two days", () => {
    const beat = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(heartbeatHealth(beat, now).status).toBe("healthy");
  });

  it("goes stale after two missed days — well before the ~7-day pause", () => {
    const beat = new Date(now.getTime() - STALE_AFTER_MS - 1);
    expect(heartbeatHealth(beat, now).status).toBe("stale");
  });

  it("describes ages coarsely", () => {
    expect(describeAge(30_000)).toBe("just now");
    expect(describeAge(5 * 60_000)).toBe("5 minutes ago");
    expect(describeAge(60 * 60_000)).toBe("1 hour ago");
    expect(describeAge(3 * 24 * 60 * 60_000)).toBe("3 days ago");
  });
});
