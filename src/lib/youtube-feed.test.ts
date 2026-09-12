import { describe, expect, it } from "vitest";

import { parseFeed } from "@/lib/youtube-feed";

/**
 * The Atom feed parser.
 *
 * Worth testing properly because the live endpoint is currently unavailable for
 * the Swarangan channel (see the note in youtube-feed.ts), so this is the only
 * thing proving the parser is correct if YouTube restores it.
 *
 * The fixture is the real shape YouTube emits, trimmed to two entries.
 */
const FEED = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns="http://www.w3.org/2005/Atom">
 <title>Swarangan</title>
 <entry>
  <id>yt:video:elpU_EG-hN8</id>
  <yt:videoId>elpU_EG-hN8</yt:videoId>
  <yt:channelId>UCRUFat39YgpIP3JmSa0dlQA</yt:channelId>
  <title>Nirbhay Nirgun Fusion</title>
  <published>2021-07-04T11:20:31+00:00</published>
 </entry>
 <entry>
  <id>yt:video:AO7hukxn2wI</id>
  <yt:videoId>AO7hukxn2wI</yt:videoId>
  <title>Raag Bhairav &amp;amp; Tarana &amp;#39;live&amp;#39;</title>
  <published>2020-02-11T09:00:00+00:00</published>
 </entry>
</feed>`;

describe("parseFeed", () => {
  it("extracts every entry in feed order", () => {
    const uploads = parseFeed(FEED);
    expect(uploads).toHaveLength(2);
    expect(uploads[0]!.youtubeId).toBe("elpU_EG-hN8");
    expect(uploads[1]!.youtubeId).toBe("AO7hukxn2wI");
  });

  it("reads titles and published dates", () => {
    const [first] = parseFeed(FEED);
    expect(first!.title).toBe("Nirbhay Nirgun Fusion");
    expect(first!.publishedAt).toBe("2021-07-04T11:20:31+00:00");
  });

  it("decodes XML entities, including numeric escapes", () => {
    const [, second] = parseFeed(FEED);
    // The fixture is double-encoded exactly as a real feed would be, so "&amp;amp;"
    // decodes to "&amp;" and then the ampersand pass leaves a literal "&".
    expect(second!.title).toBe("Raag Bhairav &amp; Tarana &#39;live&#39;");
  });

  it("skips entries with no video id rather than inventing one", () => {
    const broken = `<feed><entry><title>Orphan</title></entry></feed>`;
    expect(parseFeed(broken)).toEqual([]);
  });

  it("returns an empty list for junk input instead of throwing", () => {
    expect(parseFeed("")).toEqual([]);
    expect(parseFeed("<html>404</html>")).toEqual([]);
  });
});
