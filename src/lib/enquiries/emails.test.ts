import { describe, expect, it } from "vitest";

import {
  acknowledgementEmail,
  notificationEmail,
  singleLine,
} from "@/lib/enquiries/emails";

const enquiry = {
  name: "Asha Rao",
  email: "asha@example.com",
  phone: "+65 9123 4567",
  interest: "Beginner classes for children",
  mode: "Online",
  message: "Hello,\n\nMy daughter is 8.",
};

describe("enquiry emails", () => {
  it("strips line breaks from anything that reaches a header", () => {
    const hostile = { ...enquiry, name: "Eve\r\nBcc: victim@example.com" };
    const { subject } = notificationEmail(hostile, "https://x/admin");
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject).toBe("New enquiry: Eve Bcc: victim@example.com");
  });

  it("includes every field the visitor gave, and the message verbatim", () => {
    const { text } = notificationEmail(enquiry, "https://x/admin/enquiries");
    expect(text).toContain("Phone:    +65 9123 4567");
    expect(text).toContain("Where:    Online");
    expect(text).toContain("Hello,\n\nMy daughter is 8.");
    expect(text).toContain("https://x/admin/enquiries");
  });

  it("leaves out fields that were not given", () => {
    const { text } = notificationEmail(
      { ...enquiry, phone: "", interest: null, mode: undefined },
      "https://x",
    );
    expect(text).not.toContain("Phone:");
    expect(text).not.toContain("Interest:");
    expect(text).not.toContain("Where:");
  });

  it("acknowledges by first name without echoing the message", () => {
    const { text } = acknowledgementEmail(enquiry);
    expect(text.startsWith("Dear Asha,")).toBe(true);
    expect(text).not.toContain("daughter");
  });

  it("truncates long single lines", () => {
    expect(singleLine("a".repeat(100), 10)).toBe(`${"a".repeat(9)}…`);
  });
});
