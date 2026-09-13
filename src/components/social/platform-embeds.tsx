import { cn } from "@/lib/utils";

/**
 * Previews of Instagram posts and of the Facebook page, using each platform's
 * own public embed pages. Neither needs an API key, an app, or a paid widget:
 * these are the same embeds the platforms offer under "Embed" on a public post
 * or page. Lazily loaded, so they cost nothing until scrolled into view.
 */

/** One Instagram post or reel. `embedRef` is "p/CODE" or "reel/CODE". */
export function InstagramEmbed({
  embedRef,
  title,
  className,
}: {
  embedRef: string;
  title: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-sand-300 overflow-hidden rounded-(--radius-card) border bg-white",
        className,
      )}
    >
      <iframe
        src={`https://www.instagram.com/${embedRef}/embed/`}
        title={`Instagram: ${title}`}
        loading="lazy"
        className="block h-[560px] w-full"
        // Embeds run in a sandbox: they may play media and open Instagram in a
        // new tab, but cannot navigate or script this site.
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}

/** Facebook's Page Plugin: the page header and its latest posts. */
export function FacebookPagePreview({
  pageUrl,
  className,
}: {
  pageUrl: string;
  className?: string;
}) {
  const params = new URLSearchParams({
    href: pageUrl,
    tabs: "timeline",
    width: "500",
    height: "620",
    small_header: "false",
    adapt_container_width: "true",
    hide_cover: "false",
    show_facepile: "false",
  });

  return (
    <div
      className={cn(
        "border-sand-300 mx-auto w-full max-w-[500px] overflow-hidden rounded-(--radius-card) border bg-white",
        className,
      )}
    >
      <iframe
        src={`https://www.facebook.com/plugins/page.php?${params}`}
        title="Swarangan on Facebook"
        loading="lazy"
        className="block h-[620px] w-full"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
