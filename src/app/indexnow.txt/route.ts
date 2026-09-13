/**
 * The IndexNow key file.
 *
 * IndexNow lets a site tell Bing (and Yandex, Seznam and others) the moment a
 * page changes, instead of waiting to be recrawled. Bing's index is what ChatGPT
 * Search and Microsoft Copilot draw on, so this shortens the path from "Tanuja
 * updated the classes page" to "AI assistants know about it".
 *
 * The protocol proves the site owns the key by fetching it from this URL. The
 * key is not a secret — it only authorises *notifying* search engines about
 * URLs on this domain.
 *
 * Returns 404 until INDEXNOW_KEY is set. See `npm run indexnow` and SETUP.md.
 */
export function GET() {
  const key = process.env.INDEXNOW_KEY?.trim();

  if (!key || !/^[a-zA-Z0-9-]{8,128}$/.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
