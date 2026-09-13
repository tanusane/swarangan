import {
  getClassOfferings,
  getLocations,
  getSection,
  getSettings,
  getTestimonials,
} from "@/lib/cms/repository";
import { addressLineFor, type SiteSettings } from "@/lib/cms/settings";
import { navigation, siteConfig } from "@/lib/site-config";

/**
 * /llms.txt — a plain-text briefing for AI assistants.
 *
 * An emerging convention rather than an official standard: some AI tools read
 * it to get a clean, factual summary of a site instead of parsing its HTML.
 * It costs nothing and cannot hurt, but no tool is obliged to use it — the
 * structured data and the pages themselves remain what actually matters.
 *
 * Generated from the same content modules the pages render, so it can never
 * say something the website does not.
 */

export const dynamic = "force-static";

function absolute(path: string): string {
  return new URL(path, siteConfig.url).toString();
}

export async function GET() {
  const [
    settings,
    classOfferings,
    locationOptions,
    teacherBlock,
    testimonials,
  ] = await Promise.all([
    getSettings(),
    getClassOfferings(),
    getLocations(),
    getSection("tanuja-sane"),
    getTestimonials(),
  ]);
  const pages = navigation
    .map((item) => `- [${item.label}](${absolute(item.href)})`)
    .join("\n");

  const classes = classOfferings
    .map((offering) => `- **${offering.title}**: ${offering.description}`)
    .join("\n");

  const formats = locationOptions
    .map((option) => `- **${option.title}**: ${option.description}`)
    .join("\n");

  const body = `# ${siteConfig.name}

> ${settings.description}

Swarangan is a Hindustani classical music school in Singapore, founded and led
by Tanuja Sane (M.A. Music). The studio is at ${addressLineFor(settings)}, in the
West Coast / Clementi area of Singapore's West Region. Classes are also taught
at students' homes across Singapore and online in any time zone.

## Classes

${classes}

${settings.classesNote}

## Where classes happen

${formats}

## The teacher

${teacherBlock ? teacherBlock.body.join("\n\n") : ""}

## What students and parents say

${testimonials.length} testimonials are published at ${absolute("/testimonials")}.

## Contact

${contactLine(settings)}- Email: ${settings.email}
- Instagram: ${settings.instagram}
- YouTube: ${settings.youtube}
- Facebook: ${settings.facebook}

## Pages

${pages}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** The phone line, honouring the admin's show/hide switches. */
function contactLine(settings: SiteSettings): string {
  const channels = [
    settings.showPhone && "Phone",
    settings.showWhatsApp && "WhatsApp",
  ].filter(Boolean);
  return channels.length > 0
    ? `- ${channels.join(" and ")}: ${settings.phoneDisplay}
`
    : "";
}
