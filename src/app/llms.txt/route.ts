import {
  classOfferings,
  classesNote,
  locationOptions,
  teacherBlock,
} from "@/content/home";
import { testimonials } from "@/content/testimonials";
import { formattedAddress, navigation, siteConfig } from "@/lib/site-config";

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

export function GET() {
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

> ${siteConfig.description}

Swarangan is a Hindustani classical music school in Singapore, founded and led
by Tanuja Sane (M.A. Music). The studio is at ${formattedAddress()}, in the
West Coast / Clementi area of Singapore's West Region. Classes are also taught
at students' homes across Singapore and online in any time zone.

## Classes

${classes}

${classesNote}

## Where classes happen

${formats}

## The teacher

${teacherBlock.body.join("\n\n")}

## What students and parents say

${testimonials.length} testimonials are published at ${absolute("/testimonials")}.

## Contact

- Phone and WhatsApp: ${siteConfig.contact.phoneDisplay}
- Email: ${siteConfig.contact.email}
- Instagram: ${siteConfig.social.instagram}
- YouTube: ${siteConfig.social.youtube}
- Facebook: ${siteConfig.social.facebook}

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
