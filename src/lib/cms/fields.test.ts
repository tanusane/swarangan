import { describe, expect, it } from "vitest";

import { testimonials } from "@/content/testimonials";
import { introBlocks, teacherBlock } from "@/content/home";
import { COLLECTIONS, isCollectionKey } from "@/lib/cms/collections";
import {
  emptyFormValues,
  itemSchema,
  neighbourFor,
  paragraphsToText,
  parseYouTubeId,
  rowToFormValues,
  slugify,
  textToParagraphs,
  uniqueSlug,
} from "@/lib/cms/fields";

describe("paragraph editing is exactly reversible", () => {
  it("opening and saving every testimonial untouched changes nothing", () => {
    for (const item of testimonials) {
      expect(textToParagraphs(paragraphsToText(item.body))).toEqual(item.body);
    }
  });

  it("opening and saving every page section untouched changes nothing", () => {
    for (const block of [...introBlocks, teacherBlock]) {
      expect(textToParagraphs(paragraphsToText(block.body))).toEqual(
        block.body,
      );
    }
  });

  it("keeps double spaces inside a paragraph", () => {
    expect(textToParagraphs("One.  Two.")).toEqual(["One.  Two."]);
  });

  it("splits on empty lines, including ones with stray spaces or Windows line endings", () => {
    expect(
      textToParagraphs("First\r\n\r\nSecond\n   \nThird\n\n\n\nFourth"),
    ).toEqual(["First", "Second", "Third", "Fourth"]);
  });

  it("drops empty paragraphs", () => {
    expect(textToParagraphs("\n\n  \n")).toEqual([]);
  });
});

describe("parseYouTubeId", () => {
  it.each([
    ["elpU_EG-hN8", "elpU_EG-hN8"],
    ["https://www.youtube.com/watch?v=elpU_EG-hN8", "elpU_EG-hN8"],
    ["https://youtube.com/watch?v=-qhV7DiRF-I&t=42s", "-qhV7DiRF-I"],
    ["https://youtu.be/AO7hukxn2wI?si=abc", "AO7hukxn2wI"],
    ["https://m.youtube.com/watch?v=87c4J06MAIg", "87c4J06MAIg"],
    ["https://www.youtube.com/shorts/NoES1omnTa0", "NoES1omnTa0"],
    ["https://www.youtube-nocookie.com/embed/nJ-zUb4UyCk", "nJ-zUb4UyCk"],
  ])("reads %s", (input, id) => {
    expect(parseYouTubeId(input)).toBe(id);
  });

  it.each([
    "",
    "hello",
    "https://vimeo.com/123456789",
    "https://www.youtube.com/channel/UCRUFat39YgpIP3JmSa0dlQA",
    "https://evil.example/watch?v=elpU_EG-hN8",
    "javascript:alert(1)",
  ])("rejects %j", (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });
});

describe("item validation", () => {
  it("validates a testimonial and turns its text into paragraphs", () => {
    const parsed = itemSchema(COLLECTIONS.testimonials).parse({
      author: "  Neha Sahai ",
      body: "First paragraph.\n\nSecond  paragraph.",
    });
    expect(parsed).toEqual({
      author: "Neha Sahai",
      body: ["First paragraph.", "Second  paragraph."],
    });
  });

  it("refuses a testimonial with no text", () => {
    const result = itemSchema(COLLECTIONS.testimonials).safeParse({
      author: "X",
      body: "\n\n",
    });
    expect(result.success).toBe(false);
  });

  it("stores a video as its ID, whatever form the link was pasted in", () => {
    const parsed = itemSchema(COLLECTIONS.videos).parse({
      embed_ref: "https://youtu.be/AO7hukxn2wI",
      title: "Raag Bhairav Tarana",
      legacy_caption: "",
      featured: true,
    });
    expect(parsed).toEqual({
      embed_ref: "AO7hukxn2wI",
      title: "Raag Bhairav Tarana",
      legacy_caption: null,
      featured: true,
    });
  });

  it("refuses a non-YouTube video link", () => {
    expect(
      itemSchema(COLLECTIONS.videos).safeParse({
        embed_ref: "https://vimeo.com/1",
        title: "x",
        legacy_caption: "",
        featured: false,
      }).success,
    ).toBe(false);
  });

  it("treats a blank optional year as no year, and rejects nonsense", () => {
    const schema = itemSchema(COLLECTIONS.albums);
    expect(
      schema.parse({ title: "Annual Function 2026", year: "" }).year,
    ).toBeNull();
    expect(
      schema.parse({ title: "Annual Function 2026", year: "2026" }).year,
    ).toBe(2026);
    expect(schema.safeParse({ title: "x", year: "twenty" }).success).toBe(
      false,
    );
  });

  it("only accepts the fields the collection defines", () => {
    const parsed = itemSchema(COLLECTIONS.classes).parse({
      title: "Advanced classes",
      description: "Depending on student's level of expertise.",
      // Attempting to smuggle a column the editor does not expose:
      audience: "children",
      published: false,
    });
    expect(parsed).not.toHaveProperty("audience");
    expect(parsed).not.toHaveProperty("published");
  });
});

describe("form values", () => {
  it("round-trips a row through the edit form", () => {
    const def = COLLECTIONS.testimonials;
    const row = {
      id: "1",
      author: testimonials[0]!.author,
      body: [...testimonials[0]!.body],
    };
    const values = rowToFormValues(def, row);
    expect(itemSchema(def).parse(values)).toEqual({
      author: row.author,
      body: row.body,
    });
  });

  it("starts a new item empty", () => {
    expect(emptyFormValues(COLLECTIONS.videos)).toEqual({
      embed_ref: "",
      title: "",
      legacy_caption: "",
      featured: false,
    });
  });
});

describe("keys and ordering", () => {
  it("slugifies album names", () => {
    expect(slugify("Annual Function 2026!")).toBe("annual-function-2026");
    expect(slugify("Guru Pūrṇimā")).toBe("guru-purnima");
  });

  it("never reuses a taken key", () => {
    const taken = new Set(["af2026", "annual-function", "annual-function-2"]);
    expect(uniqueSlug("Annual Function", taken)).toBe("annual-function-3");
    expect(uniqueSlug("!!!", new Set())).toBe("item");
  });

  it("swaps with the neighbour in display order, and stops at the edges", () => {
    const rows = [
      { id: "c", sort: 30 },
      { id: "a", sort: 10 },
      { id: "b", sort: 20 },
    ];
    expect(neighbourFor(rows, "b", "up")).toEqual({ a: rows[2], b: rows[1] });
    expect(neighbourFor(rows, "b", "down")).toEqual({ a: rows[2], b: rows[0] });
    expect(neighbourFor(rows, "a", "up")).toBeNull();
    expect(neighbourFor(rows, "c", "down")).toBeNull();
    expect(neighbourFor(rows, "missing", "up")).toBeNull();
  });

  it("recognises only registered collections", () => {
    expect(isCollectionKey("testimonials")).toBe(true);
    expect(isCollectionKey("students")).toBe(false);
    expect(isCollectionKey("__proto__")).toBe(false);
  });
});
