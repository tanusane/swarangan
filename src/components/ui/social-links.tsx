import {
  FacebookIcon,
  InstagramIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/ui/icons";
import { whatsappHrefFor, type SiteSettings } from "@/lib/cms/settings";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * The social icons — one list, used in the footer, on the contact page and on
 * Social Presence. The URLs come from the admin-editable site settings, so
 * changing a profile link in the admin updates every page at once.
 */
export function socialProfiles(settings: SiteSettings) {
  return [
    {
      key: "instagram",
      label: "Instagram",
      href: settings.instagram,
      Icon: InstagramIcon,
    },
    {
      key: "youtube",
      label: "YouTube",
      href: settings.youtube,
      Icon: YouTubeIcon,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: settings.facebook,
      Icon: FacebookIcon,
    },
  ] as const;
}

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
  settings,
  tone = "light",
  includeWhatsApp = true,
  className,
}: {
  settings: SiteSettings;
  tone?: keyof typeof TONES;
  includeWhatsApp?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {socialProfiles(settings).map(({ key, label, href, Icon }) => (
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
            href={whatsappHrefFor(settings)}
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
