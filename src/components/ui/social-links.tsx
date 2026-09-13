import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/ui/icons";
import { siteConfig, whatsappHref } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * The social icons — one list, used in the footer, on the contact page and on
 * Social Presence. Adding a platform here puts it in every place at once, so the
 * pages can never disagree about where Swarangan can be found.
 */
export const SOCIAL_PROFILES = [
  {
    key: "instagram",
    label: "Instagram",
    href: siteConfig.social.instagram,
    Icon: InstagramIcon,
  },
  {
    key: "youtube",
    label: "YouTube",
    href: siteConfig.social.youtube,
    Icon: YouTubeIcon,
  },
  {
    key: "facebook",
    label: "Facebook",
    href: siteConfig.social.facebook,
    Icon: FacebookIcon,
  },
] as const;

const TONES = {
  /** On the deep-blue footer. */
  dark: "border-sand-200/20 text-sand-200 hover:border-gold-300 hover:text-gold-300",
  /** On ivory and sand pages. */
  light:
    "border-sand-300 text-blue-800 hover:border-magenta-600 hover:text-magenta-700",
} as const;

const BASE =
  "inline-flex size-10 items-center justify-center rounded-full border transition-colors";

export function SocialLinks({
  tone = "light",
  includeWhatsApp = true,
  className,
}: {
  tone?: keyof typeof TONES;
  includeWhatsApp?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {SOCIAL_PROFILES.map(({ key, label, href, Icon }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${siteConfig.name} on ${label}`}
            className={cn(BASE, TONES[tone])}
          >
            <Icon aria-hidden="true" className="size-5" />
          </a>
        </li>
      ))}
      {includeWhatsApp && (
        <li>
          <a
            href={whatsappHref()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message Swarangan on WhatsApp"
            className={cn(
              BASE,
              tone === "dark"
                ? "border-sand-200/20 text-sand-200"
                : "border-sand-300 text-blue-800",
              "hover:border-[#25D366] hover:text-[#1a9e4b]",
            )}
          >
            <WhatsAppIcon className="size-5" />
          </a>
        </li>
      )}
    </ul>
  );
}
