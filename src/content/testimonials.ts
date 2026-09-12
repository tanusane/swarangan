import type { Testimonial } from "@/content/types";

/**
 * The four testimonials from the legacy site, VERBATIM.
 *
 * These are other people's words about Tanuja's teaching. They are not to be
 * edited, reworded, reordered, re-punctuated or "tidied up" — including the
 * original spacing and the ".... " in Avani Dayal's note. A test in
 * src/content/__tests__/content-fidelity.test.ts asserts they stay byte-exact.
 *
 * Phase 2 moves these into the Supabase `testimonials` table, seeded from here,
 * after which Tanuja can add new ones from the admin panel.
 */
export const testimonials: readonly Testimonial[] = [
  {
    key: "rachana-agarwal",
    author: "Rachana Agarwal",
    body: [
      "My Daughter has been taking music lessons with Tanuja since a year.  I am extremely impressed with the quality of dedication that Tanuja puts in to make the learning experience enjoyable and positive for kids. Her patience, enthusiasm, and desire for perfection makes her an excellent teacher. Tanuja is not only an exceptional singer but she also has extensive knowledge of various aspects of Indian music. Her teaching is very structured, including the theory part. I would highly recommend her classes to anyone who is interested in learning light or classical Indian music.",
    ],
  },
  {
    key: "narendra-bisht",
    author: "Narendra Bisht",
    body: [
      "Tanuja ji is a fine exponent of Indian classical music. Personally she is blessed with an extremely sonorous voice making her a near complete vocal artist.",
      "I am fortunate to have her as my sons classical music teacher for the last two years. She possesses all the ingredients of an ideal Guru ie. indepth knowledge, patience and the art to impart training even to my usually impatient 7 year old. Under her expert guidance my son is progressing very well in his vocal classical training.",
    ],
  },
  {
    key: "avani-dayal",
    author: "Avani Dayal",
    body: [
      "It’s been an exhilarating journey in Swarangan that has enriched me with musical knowledge way beyond expectations. Tanuja is an extraordinarily gifted singer and an amazing guide who makes sure that we rectify our individual shortcomings. Always look forward to fun musical sessions with her .... her passion for music is contagious.",
      "Thank You Tanuja and team Swarangan for giving us a platform like this.",
    ],
  },
  {
    key: "neha-sahai",
    author: "Neha Sahai",
    body: [
      "I am so glad I found Tanuja Sane to give singing lessons to my daughter.  She's a very warm person and an extremely knowledgeable teacher. She has helped instill confidence in my daughter's singing in a surprisingly short span of time.",
      "Tanuja is also very accommodating and has the skill, patience and interest to motivate a child. I would highly recommend her to anyone from beginner to beyond.",
    ],
  },
];
