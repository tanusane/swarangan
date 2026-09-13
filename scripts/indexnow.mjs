/**
 * Tell search engines the site has changed (IndexNow).
 *
 * Run after a deploy that changes content:
 *
 *   npm run indexnow
 *
 * Reads every URL from the live sitemap and submits them in one request. Needs
 * INDEXNOW_KEY (in .env.local or the environment) and the same key set on the
 * deployed site, so https://<site>/indexnow.txt serves it.
 */
import { existsSync, readFileSync } from "node:fs";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const site = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.swarangan.sg"
).replace(/\/+$/, "");
const key = process.env.INDEXNOW_KEY?.trim();

if (!key) {
  console.error("Set INDEXNOW_KEY first (see SETUP.md).");
  process.exit(2);
}

// 1. The key must already be live, or the engines will reject the submission.
const keyResponse = await fetch(`${site}/indexnow.txt`);
const liveKey = keyResponse.ok ? (await keyResponse.text()).trim() : null;
if (liveKey !== key) {
  console.error(
    `${site}/indexnow.txt does not serve this key yet. Set INDEXNOW_KEY on the deployed site and redeploy first.`,
  );
  process.exit(1);
}

// 2. Every URL in the sitemap.
const sitemap = await (await fetch(`${site}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urlList.length === 0) {
  console.error("No URLs found in the sitemap.");
  process.exit(1);
}

// 3. Submit. One request reaches every IndexNow engine.
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(site).host,
    key,
    keyLocation: `${site}/indexnow.txt`,
    urlList,
  }),
});

// 200 = accepted, 202 = accepted and key validation pending.
if (response.status === 200 || response.status === 202) {
  console.log(
    `Submitted ${urlList.length} URLs to IndexNow (HTTP ${response.status}).`,
  );
} else {
  console.error(
    `IndexNow rejected the submission: HTTP ${response.status}`,
    await response.text(),
  );
  process.exit(1);
}
