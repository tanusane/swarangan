import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

import { BreadcrumbSchema } from "@/components/seo/structured-data";
import {
  FacebookPagePreview,
  InstagramEmbed,
} from "@/components/social/platform-embeds";
import { YouTubeFacade } from "@/components/social/youtube-facade";
import { ButtonLink } from "@/components/ui/button";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SocialLinks } from "@/components/ui/social-links";
import {
  getInstagramPosts,
  getSettings,
  getVideos,
} from "@/lib/cms/repository";
import { latestChannelUploads } from "@/lib/youtube-feed";

export const metadata: Metadata = {
  title: "Social Presence",
  description:
    "Watch Swarangan's Hindustani classical and semi-classical vocal performances on YouTube, and follow the school on Instagram and Facebook.",
  alternates: { canonical: "/social" },
};

/* Revalidated hourly: the channel feed is the only thing on this page that
   changes on its own, and it does not change often. */
export const revalidate = 3600;

const GRID = "grid gap-8 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Social Presence, one section per platform. Each platform's section can be
 * switched off in the admin settings; Instagram posts and YouTube videos are
 * curated in the admin too.
 */
export default async function SocialPage() {
  const [videos, instagramPosts, settings] = await Promise.all([
    getVideos(),
    getInstagramPosts(),
    getSettings(),
  ]);

  const platforms = [
    settings.showYouTube && "youtube",
    settings.showInstagram && "instagram",
    settings.showFacebook && "facebook",
  ].filter((value): value is "youtube" | "instagram" | "facebook" => !!value);

  // Alternate the ground colour down the page, whichever sections are on.
  const groundFor = (platform: (typeof platforms)[number]) =>
    platforms.indexOf(platform) % 2 === 0 ? "ivory" : "sand";

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Social Presence", href: "/social" },
        ]}
      />

      <PageHeader
        eyebrow="Watch and follow"
        title="Social Presence"
        lead="Performances, recordings and everything happening at Swarangan."
        image="events/af2026-thumri-se-ghazal-tak.jpg"
      />

      {platforms.includes("youtube") && (
        <YouTubeSection
          videos={videos}
          channelUrl={settings.youtube}
          ground={groundFor("youtube")}
        />
      )}

      {platforms.includes("instagram") && (
        <Section
          id="instagram"
          eyebrow="On Instagram"
          title="Reels, rehearsals and moments from class"
          swaraIndex={3}
          ground={groundFor("instagram")}
        >
          {instagramPosts.length > 0 && (
            <ul className={GRID}>
              {instagramPosts.map((post, i) => (
                <Reveal key={post.key} as="li" delay={i * 0.07}>
                  <InstagramEmbed embedRef={post.ref} title={post.title} />
                </Reveal>
              ))}
            </ul>
          )}
          <Reveal>
            <div className="mt-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
              <p className="text-ink-muted max-w-xl text-lg">
                Follow{" "}
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-magenta-700 font-medium underline-offset-4 hover:underline"
                >
                  @swarangan.sg
                </a>{" "}
                for the latest from Swarangan.
              </p>
              <ButtonLink href={settings.instagram} size="lg">
                <InstagramIcon className="size-5" />
                Open Instagram
                <ExternalLink aria-hidden="true" className="size-4" />
              </ButtonLink>
            </div>
          </Reveal>
        </Section>
      )}

      {platforms.includes("facebook") && (
        <Section
          id="facebook"
          eyebrow="On Facebook"
          title="News and events"
          swaraIndex={4}
          ground={groundFor("facebook")}
        >
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <FacebookPagePreview pageUrl={settings.facebook} />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="space-y-6">
                <p className="text-ink-muted max-w-md text-lg">
                  Announcements, annual functions and photos from the Swarangan
                  community.
                </p>
                <ButtonLink href={settings.facebook} size="lg">
                  <FacebookIcon className="size-5" />
                  Follow on Facebook
                  <ExternalLink aria-hidden="true" className="size-4" />
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Section>
      )}

      {platforms.length === 0 && (
        <Section title="Find us online" align="center">
          <SocialLinks settings={settings} className="justify-center" />
        </Section>
      )}
    </>
  );
}

async function YouTubeSection({
  videos,
  channelUrl,
  ground,
}: {
  videos: Awaited<ReturnType<typeof getVideos>>;
  channelUrl: `https://${string}`;
  ground: "ivory" | "sand";
}) {
  const featured = videos.filter((video) => video.featured);
  const archive = videos.filter((video) => !video.featured);

  // Keyless public RSS. Returns [] if YouTube is unreachable, so the page
  // renders its curated content regardless.
  const uploads = await latestChannelUploads();
  const curatedIds = new Set(videos.map((video) => video.youtubeId));
  const recent = uploads
    .filter((upload) => !curatedIds.has(upload.youtubeId))
    .slice(0, 6);

  return (
    <Section
      id="youtube"
      eyebrow="On YouTube"
      title="Featured performances"
      swaraIndex={0}
      ground={ground}
    >
      <ul className={GRID}>
        {featured.map((video, i) => (
          <Reveal key={video.key} as="li" variant="leaf" delay={i * 0.07}>
            <YouTubeFacade
              youtubeId={video.youtubeId}
              title={video.title}
              legacyCaption={video.legacyCaption}
            />
          </Reveal>
        ))}
      </ul>

      {archive.length > 0 && (
        <>
          <h3 className="mt-16 mb-8 text-2xl">More recordings</h3>
          <ul className={GRID}>
            {archive.map((video, i) => (
              <Reveal key={video.key} as="li" delay={i * 0.07}>
                <YouTubeFacade
                  youtubeId={video.youtubeId}
                  title={video.title}
                  legacyCaption={video.legacyCaption}
                />
              </Reveal>
            ))}
          </ul>
        </>
      )}

      {recent.length > 0 && (
        <>
          <h3 className="mt-16 mb-8 text-2xl">Latest uploads</h3>
          <ul className={GRID}>
            {recent.map((video, i) => (
              <Reveal key={video.youtubeId} as="li" delay={i * 0.07}>
                <YouTubeFacade
                  youtubeId={video.youtubeId}
                  title={video.title}
                />
              </Reveal>
            ))}
          </ul>
        </>
      )}

      <Reveal delay={0.2}>
        <div className="mt-12">
          <ButtonLink href={channelUrl} variant="secondary">
            <YouTubeIcon className="size-5" />
            Visit our YouTube channel
            <ExternalLink aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>
      </Reveal>
    </Section>
  );
}
