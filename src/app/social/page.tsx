import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

import { BreadcrumbSchema } from "@/components/seo/structured-data";
import { YouTubeFacade } from "@/components/social/youtube-facade";
import { ButtonLink } from "@/components/ui/button";
import { FacebookIcon, YouTubeIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { featuredVideos, INSTAGRAM_ENABLED } from "@/content/social";
import { latestChannelUploads } from "@/lib/youtube-feed";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Social Presence",
  description:
    "Watch Swarangan's Hindustani classical and semi-classical vocal performances on YouTube, and follow the school on Facebook.",
  alternates: { canonical: "/social" },
};

/* Revalidated hourly: the channel feed is the only thing on this page that
   changes on its own, and it does not change often. */
export const revalidate = 3600;

export default async function SocialPage() {
  const featured = featuredVideos.filter((video) => video.featured);
  const archive = featuredVideos.filter((video) => !video.featured);

  // Keyless public RSS. Returns [] if YouTube is unreachable, so the page
  // renders its curated content regardless.
  const uploads = await latestChannelUploads();
  const curatedIds = new Set(featuredVideos.map((video) => video.youtubeId));
  const recent = uploads
    .filter((upload) => !curatedIds.has(upload.youtubeId))
    .slice(0, 6);

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

      {/* -- Featured performances ------------------------------------------- */}
      <Section
        eyebrow="On YouTube"
        title="Featured performances"
        swaraIndex={0}
      >
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href={siteConfig.social.youtube} variant="primary">
              <YouTubeIcon className="size-5" />
              Visit our YouTube channel
              <ExternalLink aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink href={siteConfig.social.facebook} variant="secondary">
              <FacebookIcon className="size-5" />
              Follow on Facebook
              <ExternalLink aria-hidden="true" className="size-4" />
            </ButtonLink>
          </div>
        </Reveal>
      </Section>

      {/* -- More from the archive ------------------------------------------- */}
      {archive.length > 0 && (
        <Section
          eyebrow="From the archive"
          title="More recordings"
          swaraIndex={1}
          ground="sand"
        >
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
        </Section>
      )}

      {/* -- Latest uploads, straight from the channel ----------------------- */}
      {recent.length > 0 && (
        <Section
          eyebrow="Fresh from the channel"
          title="Latest uploads"
          swaraIndex={2}
        >
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((video, i) => (
              <Reveal key={video.youtubeId} as="li" delay={i * 0.07}>
                <YouTubeFacade
                  youtubeId={video.youtubeId}
                  title={video.title}
                />
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {/* -- Instagram: built, waiting on an account ------------------------- */}
      {INSTAGRAM_ENABLED && siteConfig.social.instagram && (
        <Section
          eyebrow="On Instagram"
          title="Latest posts"
          swaraIndex={3}
          ground="sand"
        >
          <p className="text-ink-muted">
            Instagram posts appear here once curated in the admin panel.
          </p>
        </Section>
      )}
    </>
  );
}
