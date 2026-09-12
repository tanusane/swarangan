import { describe, expect, it } from "vitest";

import {
  classOfferings,
  classesNote,
  introBlocks,
  locationOptions,
  quote,
  teacherBlock,
  whyBlock,
} from "@/content/home";
import { testimonials } from "@/content/testimonials";

/**
 * Content fidelity.
 *
 * The brief was explicit that the existing copy — and the testimonials above
 * all — must carry over from the legacy site unchanged. These are the strings
 * as captured from https://www.swarangan.sg before the rebuild. If a future
 * edit, a "typo fix", or an over-eager reformat alters them, this fails.
 *
 * The expected values are written out in full rather than compared against the
 * source module, because a test that imports the same constant it is checking
 * proves nothing.
 */

describe("testimonials are byte-exact", () => {
  it("has exactly the four testimonials from the legacy site, in order", () => {
    expect(testimonials.map((t) => t.author)).toEqual([
      "Rachana Agarwal",
      "Narendra Bisht",
      "Avani Dayal",
      "Neha Sahai",
    ]);
  });

  it("preserves Rachana Agarwal's words, including the double space", () => {
    expect(testimonials[0]!.body).toEqual([
      "My Daughter has been taking music lessons with Tanuja since a year.  I am extremely impressed with the quality of dedication that Tanuja puts in to make the learning experience enjoyable and positive for kids. Her patience, enthusiasm, and desire for perfection makes her an excellent teacher. Tanuja is not only an exceptional singer but she also has extensive knowledge of various aspects of Indian music. Her teaching is very structured, including the theory part. I would highly recommend her classes to anyone who is interested in learning light or classical Indian music.",
    ]);
  });

  it("preserves Narendra Bisht's words", () => {
    expect(testimonials[1]!.body).toEqual([
      "Tanuja ji is a fine exponent of Indian classical music. Personally she is blessed with an extremely sonorous voice making her a near complete vocal artist.",
      "I am fortunate to have her as my sons classical music teacher for the last two years. She possesses all the ingredients of an ideal Guru ie. indepth knowledge, patience and the art to impart training even to my usually impatient 7 year old. Under her expert guidance my son is progressing very well in his vocal classical training.",
    ]);
  });

  it("preserves Avani Dayal's words, including the curly apostrophe and the ellipsis", () => {
    expect(testimonials[2]!.body).toEqual([
      "It’s been an exhilarating journey in Swarangan that has enriched me with musical knowledge way beyond expectations. Tanuja is an extraordinarily gifted singer and an amazing guide who makes sure that we rectify our individual shortcomings. Always look forward to fun musical sessions with her .... her passion for music is contagious.",
      "Thank You Tanuja and team Swarangan for giving us a platform like this.",
    ]);
  });

  it("preserves Neha Sahai's words, including the double space", () => {
    expect(testimonials[3]!.body).toEqual([
      "I am so glad I found Tanuja Sane to give singing lessons to my daughter.  She's a very warm person and an extremely knowledgeable teacher. She has helped instill confidence in my daughter's singing in a surprisingly short span of time.",
      "Tanuja is also very accommodating and has the skill, patience and interest to motivate a child. I would highly recommend her to anyone from beginner to beyond.",
    ]);
  });
});

describe("home page sequence", () => {
  it("keeps the legacy order of the introductory sections", () => {
    expect(introBlocks.map((block) => block.key)).toEqual([
      "what-is-hindustani-classical-music",
      "hindustani-classical-music",
      "guru-shishya-parampara",
      "gharana",
    ]);
  });

  it("keeps the legacy order and wording of the class offerings", () => {
    expect(classOfferings.map((offering) => offering.title)).toEqual([
      "Beginner classes for children",
      "Advanced classes",
      "Beginner classes for Adults",
    ]);
    expect(classOfferings[0]!.description).toBe(
      "Upto 12 years, with focus on indian or hindustani classical vocal basics and children songs.",
    );
    expect(classOfferings[1]!.description).toBe(
      "Depending on student's level of expertise. Previous basic training required.",
    );
    expect(classOfferings[2]!.description).toBe(
      "Twelve years and above, covers indian classical vocal basics, semi-classical and light songs.",
    );
  });

  it("keeps the class availability note verbatim", () => {
    expect(classesNote).toBe("*Individual and group classes available.");
  });

  it("keeps the three locations verbatim", () => {
    expect(locationOptions.map((option) => option.title)).toEqual([
      "At class location",
      "Home classes",
      "Online classes",
    ]);
    expect(locationOptions[0]!.description).toBe("West coast, Singapore");
    expect(locationOptions[1]!.description).toBe(
      "Classes available at your convenient location in Singapore. Please contact for more details",
    );
    expect(locationOptions[2]!.description).toBe(
      "Online classes available during any time zone. Please contact for more details.",
    );
  });
});

describe("original spellings are preserved, not silently corrected", () => {
  it('keeps "medival" as written on the legacy site', () => {
    const hindustani = introBlocks.find(
      (block) => block.key === "hindustani-classical-music",
    );
    expect(hindustani?.body.at(-1)).toContain("medival period");
  });

  it('keeps "Aamir Khusrou" and "Miya Tansen" as written', () => {
    const hindustani = introBlocks.find(
      (block) => block.key === "hindustani-classical-music",
    );
    expect(hindustani?.body[0]).toContain("Aamir Khusrou");
    expect(hindustani?.body[0]).toContain("Miya Tansen");
  });
});

describe("Tanuja's biography and the closing quote", () => {
  it("keeps the heading exactly as written, spacing included", () => {
    expect(teacherBlock.title).toBe("Tanuja Sane M. A. Music");
  });

  it("names her gurus and gharanas correctly", () => {
    expect(teacherBlock.body[0]).toContain("Late Shri Wamanrao Sadolikar");
    expect(teacherBlock.body[0]).toContain("Mrs. Manjiri Alegaonkar");
    expect(teacherBlock.body[0]).toContain("Jaipur Atrauli Gharana");
    expect(teacherBlock.body[0]).toContain("Mrs. Anuradha Garud");
    expect(teacherBlock.body[0]).toContain("Mrs. Apoorva Gokhale");
    expect(teacherBlock.body[0]).toContain("Gwalior Gharana");
  });

  it("keeps the Vivekananda quote verbatim", () => {
    expect(quote.text).toBe(
      "Music is the highest art and, to those who understand is the highest worship.",
    );
    expect(quote.attribution).toBe("Swami Vivekananda");
  });

  it("keeps the 'why' section verbatim", () => {
    expect(whyBlock.title).toBe("Why Hindustani Classical Music");
    expect(whyBlock.body[0]).toContain(
      "widely considered to be a better foundation for any form of singing",
    );
  });
});
