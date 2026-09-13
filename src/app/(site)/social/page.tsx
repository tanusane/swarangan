import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";

import { BreadcrumbSchema } from "@/components/seo/structured-data";
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
import { getSettings, getVideos } from "@/lib/cms/repository";
import { latestChannelUploads } from "@/lib/youtube-feed";

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
  const [featuredVideos, settings] = await Promise.all([
    getVideos(),
    getSettings(),
  ]);
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
            <ButtonLink href={settings.youtube} variant="primary">
              <YouTubeIcon className="size-5" />
              Visit our YouTube channel
              <ExternalLink aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink href={settings.instagram} variant="secondary">
              <InstagramIcon className="size-5" />
              Follow on Instagram
              <ExternalLink aria-hidden="true" className="size-4" />
            </ButtonLink>
            <ButtonLink href={settings.facebook} variant="secondary">
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

      {/* -- Instagram --------------------------------------------------------
          A link to the profile for now. Showing individual posts and reels on
          this page needs a Meta app access token (Instagram withdrew its public
          embed API in 2020), so that is planned separately rather than faked. */}
      <Section
        eyebrow="On Instagram"
        title="Reels, rehearsals and moments from class"
        swaraIndex={3}
        ground="sand"
      >
        <Reveal>
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
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
    </>
  );
}
