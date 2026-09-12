import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FacebookIcon, WhatsAppIcon, YouTubeIcon } from "@/components/ui/icons";
import { getImage } from "@/components/ui/swar-image";
import {
  formattedAddress,
  mailtoHref,
  navigation,
  siteConfig,
  telHref,
  whatsappHref,
} from "@/lib/site-config";

const SOCIALS = [
  { href: siteConfig.social.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: siteConfig.social.youtube, label: "YouTube", Icon: YouTubeIcon },
] as const;

export function Footer() {
  const logo = getImage("brand/logo-reverse.png");

  return (
    <footer className="text-sand-200 bg-blue-950">
      <div className="container-swar py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* -- Identity ---------------------------------------------------- */}
          <div>
            <Image
              src={logo.src}
              alt={logo.alt}
              width={logo.width}
              height={logo.height}
              className="mb-5 h-12 w-auto"
            />
            <p className="text-sand-300 max-w-xs text-sm">
              {siteConfig.description}
            </p>
            <div className="mt-6 flex gap-2">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${siteConfig.name} on ${label}`}
                  className="border-sand-200/20 text-sand-200 hover:border-gold-300 hover:text-gold-300 inline-flex size-10 items-center justify-center rounded-full border transition-colors"
                >
                  <Icon aria-hidden="true" className="size-5" />
                </a>
              ))}
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Message Swarangan on WhatsApp"
                className="border-sand-200/20 text-sand-200 inline-flex size-10 items-center justify-center rounded-full border transition-colors hover:border-[#25D366] hover:text-[#25D366]"
              >
                <WhatsAppIcon className="size-5" />
              </a>
            </div>
          </div>

          {/* -- Navigation -------------------------------------------------- */}
          <nav aria-label="Footer">
            <h2 className="text-sand-50 mb-4 text-lg font-(--font-display)">
              Explore
            </h2>
            <ul className="space-y-2.5 text-sm">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sand-300 hover:text-gold-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* -- Contact ----------------------------------------------------- */}
          <div>
            <h2 className="text-sand-50 mb-4 text-lg font-(--font-display)">
              Contact us
            </h2>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <MapPin
                  aria-hidden="true"
                  className="text-gold-300 mt-0.5 size-4 shrink-0"
                />
                <address className="text-sand-300 not-italic">
                  {formattedAddress()}
                </address>
              </li>
              <li className="flex items-center gap-3">
                <Phone
                  aria-hidden="true"
                  className="text-gold-300 size-4 shrink-0"
                />
                <a
                  href={telHref}
                  className="text-sand-300 hover:text-gold-300 transition-colors"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
                {/* Amit's request: WhatsApp sits right beside the number. */}
                <a
                  href={whatsappHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Message this number on WhatsApp"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366]/15 px-2.5 py-1 text-xs text-[#5BE39A] transition-colors hover:bg-[#25D366]/25"
                >
                  <WhatsAppIcon className="size-3.5" />
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail
                  aria-hidden="true"
                  className="text-gold-300 size-4 shrink-0"
                />
                <a
                  href={mailtoHref}
                  className="text-sand-300 hover:text-gold-300 transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-sand-200/15 text-sand-400 mt-14 flex flex-col gap-2 border-t pt-7 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p>
            ACRA business registration number {siteConfig.businessRegistration}
          </p>
        </div>
      </div>
    </footer>
  );
}
