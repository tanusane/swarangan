/**
 * Serialise structured data for a <script type="application/ld+json"> tag.
 *
 * JSON.stringify alone is not safe here: it leaves "</script>" untouched, so a
 * testimonial or setting containing it would close the tag early and let the
 * rest run as HTML: stored cross-site scripting through the admin panel.
 * Escaping "<" (plus U+2028 and U+2029, which JavaScript treats as line breaks)
 * keeps the output valid JSON that parses back to exactly the same value.
 */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

export function jsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029");
}
