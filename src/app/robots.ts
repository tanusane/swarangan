import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site-config";

/**
 * robots.txt
 *
 * Search engines AND AI assistants are explicitly welcomed. Swarangan wants to
 * be the answer when someone in Singapore asks Google, ChatGPT, Claude,
 * Perplexity or Apple for Hindustani vocal classes — so the crawlers behind
 * those answers are named and allowed, not merely tolerated by a wildcard.
 *
 * Two families are listed separately so either can be switched off later
 * without touching the other:
 *   - search / answer crawlers: fetch pages to cite them in live answers
 *   - training crawlers:        help the models themselves know Swarangan
 *
 * Only the admin panel and the API are excluded, from everyone.
 */

const PRIVATE = ["/admin", "/admin/", "/api/"];

/** Crawlers that fetch pages to cite in search results and live AI answers. */
const SEARCH_AND_ANSWER_BOTS = [
  "Googlebot",
  "Bingbot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Applebot",
  "DuckDuckBot",
];

/** Crawlers that gather material for training AI models. */
const TRAINING_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: SEARCH_AND_ANSWER_BOTS, allow: "/", disallow: PRIVATE },
      { userAgent: TRAINING_BOTS, allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
    host: siteConfig.url,
  };
}
