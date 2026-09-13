import { describe, expect, it } from "vitest";

import { jsonLd } from "@/lib/json-ld";

describe("jsonLd", () => {
  it("cannot be broken out of by text an admin typed", () => {
    const hostile = {
      reviewBody: 'Lovely teacher</script><script>alert("x")</script>',
    };
    const out = jsonLd(hostile);
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
  });

  it("still parses back to exactly the same value", () => {
    const value = {
      text: "It’s been <b>wonderful</b> — सा रे ग म",
      line: `a${String.fromCharCode(0x2028)}b${String.fromCharCode(0x2029)}c`,
      nested: [1, { ok: true }],
    };
    expect(JSON.parse(jsonLd(value))).toEqual(value);
  });
});
