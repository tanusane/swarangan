import { describe, expect, it } from "vitest";

import {
  DEFAULT_SETTINGS,
  mergeSettings,
  settingsSchema,
} from "@/lib/cms/settings";

describe("visibility switches", () => {
  it("default to shown, so older stored settings keep everything visible", () => {
    const merged = mergeSettings({ email: "info@swarangan.sg" });
    expect(merged.showPhone).toBe(true);
    expect(merged.showWhatsApp).toBe(true);
    expect(merged.showInstagram).toBe(true);
  });

  it("respect a stored false", () => {
    const merged = mergeSettings({ showPhone: false, showFacebook: false });
    expect(merged.showPhone).toBe(false);
    expect(merged.showFacebook).toBe(false);
    expect(merged.showWhatsApp).toBe(true);
  });

  it("ignore a malformed value rather than hiding anything", () => {
    expect(mergeSettings({ showPhone: "no" }).showPhone).toBe(true);
  });

  it("are required booleans when the admin saves", () => {
    expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
    expect(
      settingsSchema.safeParse({ ...DEFAULT_SETTINGS, showPhone: "false" })
        .success,
    ).toBe(false);
  });
});
