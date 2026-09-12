"use client";

import { Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { useScrolledPast } from "@/lib/use-external-state";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getImage } from "@/components/ui/swar-image";
import {
  navigation,
  siteConfig,
  telHref,
  whatsappHref,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  /* The header sits over the hero photograph, so it starts transparent and only
     takes a background once the page has scrolled past it. Read live, so a
     restored scroll position is right on the first paint. */
  const scrolled = useScrolledPast(24);

  // Lock the background from scrolling behind the open mobile sheet.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onHome = pathname === "/";
  const transparent = onHome && !scrolled && !open;
  // A real two-colour reversal, not a CSS invert, which would flatten the brand
  // to a white silhouette over the hero photograph.
  const logo = getImage(
    transparent ? "brand/logo-reverse.png" : "brand/logo.png",
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-(--ease-swar)",
        transparent
          ? "bg-transparent"
          : "border-sand-300/70 bg-sand-50/90 border-b backdrop-blur-md",
      )}
    >
      <div className="container-swar flex h-18 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label={`${siteConfig.name} — home`}
          className="shrink-0"
        >
          <Image
            src={logo.src}
            alt={logo.alt}
            width={logo.width}
            height={logo.height}
            priority
            className="h-10 w-auto transition-all duration-300 md:h-12"
          />
        </Link>

        {/* -- Desktop navigation -------------------------------------------- */}
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative rounded-full px-3.5 py-2 text-sm transition-colors",
                      transparent
                        ? "text-sand-100 hover:text-white"
                        : "hover:text-magenta-700 text-blue-800",
                    )}
                  >
                    {item.label}
                    {/* Leaf-tip underline, borrowed from the logo's canopy. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left rounded-full transition-transform duration-300 ease-(--ease-swar)",
                        transparent ? "bg-gold-300" : "bg-magenta-600",
                        active
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* -- Contact affordances ------------------------------------------- */}
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={telHref}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm whitespace-nowrap transition-colors",
              transparent
                ? "text-sand-100 hover:text-white"
                : "hover:text-magenta-700 text-blue-800",
            )}
          >
            <Phone aria-hidden="true" className="size-4" />
            {siteConfig.contact.phoneDisplay}
          </a>
          <ButtonLink
            href={whatsappHref()}
            variant="whatsapp"
            size="sm"
            aria-label="Message Swarangan on WhatsApp"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </ButtonLink>
        </div>

        {/* -- Mobile trigger ------------------------------------------------- */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-full transition-colors lg:hidden",
            transparent
              ? "text-sand-50 hover:bg-white/15"
              : "hover:bg-sand-200 text-blue-800",
          )}
        >
          {open ? (
            <X aria-hidden="true" className="size-6" />
          ) : (
            <Menu aria-hidden="true" className="size-6" />
          )}
        </button>
      </div>

      {/* -- Mobile sheet ---------------------------------------------------- */}
      <div
        id="mobile-navigation"
        hidden={!open}
        className="border-sand-300 bg-sand-50 border-t lg:hidden"
      >
        <nav aria-label="Primary" className="container-swar py-5">
          <ul className="flex flex-col">
            {navigation.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    /* Closed here rather than in an effect on the pathname:
                       navigating is a user action, so the sheet closes as part
                       of that action instead of after a re-render. */
                    onClick={() => setOpen(false)}
                    className={cn(
                      "border-sand-200 block border-b py-3.5 text-xl font-(--font-display) transition-colors",
                      active ? "text-magenta-700" : "text-blue-800",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <ButtonLink href={whatsappHref()} variant="whatsapp">
              <WhatsAppIcon className="size-4" />
              Message us on WhatsApp
            </ButtonLink>
            <ButtonLink href={telHref} variant="secondary">
              <Phone aria-hidden="true" className="size-4" />
              {siteConfig.contact.phoneDisplay}
            </ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
