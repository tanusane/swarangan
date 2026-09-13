import { describe, expect, it } from "vitest";

import { imageManifest } from "@/content/generated/image-manifest";
import {
  MEDIA_SLOTS,
  clampFocal,
  fitWithin,
  isSlotKey,
  publicMediaUrl,
  resolveSlot,
  slotStoragePath,
} from "@/lib/media/slots";

const URL = "https://abcd.supabase.co";
const KEY = "home.teacher.portrait" as const;

describe("resolveSlot", () => {
  it("shows the committed fallback when nothing has been uploaded", () => {
    const slot = resolveSlot(KEY, null, URL);
    expect(slot.replaced).toBe(false);
    expect(slot.src).toBe(imageManifest[MEDIA_SLOTS[KEY].fallback].src);
    expect(slot.blurDataURL).toMatch(/^data:image\/webp;base64,/);
  });

  it("shows the fallback when Supabase is not configured, even if a row exists", () => {
    const row = {
      key: KEY,
      storage_path: "slots/x.jpg",
      alt: "x",
      focal_x: 0.5,
      focal_y: 0.5,
    };
    expect(resolveSlot(KEY, row, null).replaced).toBe(false);
  });

  it("shows the upload, with its alt text and focal point, when one exists", () => {
    const slot = resolveSlot(
      KEY,
      {
        key: KEY,
        storage_path: "slots/home.teacher.portrait/1.jpg",
        alt: "Tanuja performing",
        focal_x: 0.25,
        focal_y: 0.8,
      },
      URL,
    );
    expect(slot.replaced).toBe(true);
    expect(slot.src).toBe(
      "https://abcd.supabase.co/storage/v1/object/public/media/slots/home.teacher.portrait/1.jpg",
    );
    expect(slot.alt).toBe("Tanuja performing");
    expect(slot.objectPosition).toBe("25% 80%");
    expect(slot.blurDataURL).toBeNull();
  });

  it("never renders empty alt text for an upload", () => {
    const slot = resolveSlot(
      KEY,
      {
        key: KEY,
        storage_path: "slots/a.jpg",
        alt: "   ",
        focal_x: 0.5,
        focal_y: 0.5,
      },
      URL,
    );
    expect(slot.alt.length).toBeGreaterThan(0);
  });

  it("treats a blank storage path as no upload", () => {
    const slot = resolveSlot(
      KEY,
      { key: KEY, storage_path: " ", alt: "x", focal_x: 0.5, focal_y: 0.5 },
      URL,
    );
    expect(slot.replaced).toBe(false);
  });
});

describe("helpers", () => {
  it("builds public URLs safely, encoding each path segment", () => {
    expect(publicMediaUrl(`${URL}/`, "slots/a b/ä.jpg")).toBe(
      "https://abcd.supabase.co/storage/v1/object/public/media/slots/a%20b/%C3%A4.jpg",
    );
  });

  it("clamps focal points and defaults nonsense to the centre", () => {
    expect(clampFocal(-1)).toBe(0);
    expect(clampFocal(4)).toBe(1);
    expect(clampFocal("0.3")).toBe(0.3);
    expect(clampFocal(Number.NaN)).toBe(0.5);
    expect(clampFocal(undefined)).toBe(0.5);
  });

  it("gives every upload a fresh path so an old image is never served from cache", () => {
    const a = slotStoragePath(KEY, new Date(1000));
    const b = slotStoragePath(KEY, new Date(2000));
    expect(a).not.toBe(b);
    expect(a).toBe("slots/home.teacher.portrait/1000.jpg");
  });

  it("downscales large photos but never enlarges small ones", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 1500, height: 2000 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(0, 100)).toEqual({ width: 0, height: 0 });
  });

  it("recognises only registered slot keys", () => {
    expect(isSlotKey(KEY)).toBe(true);
    expect(isSlotKey("home.nonexistent")).toBe(false);
    expect(isSlotKey("toString")).toBe(false);
  });
});
