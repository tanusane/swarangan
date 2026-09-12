import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ButtonVariant =
  "primary" | "secondary" | "ghost" | "onDark" | "whatsapp";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-[transform,background-color,border-color,color,box-shadow] " +
  "duration-200 ease-[var(--ease-swar)] " +
  "hover:-translate-y-0.5 active:translate-y-0 " +
  "disabled:pointer-events-none disabled:opacity-55";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-magenta-600 text-white shadow-(--shadow-lift) hover:bg-magenta-700 hover:shadow-(--shadow-lift-lg)",
  secondary:
    "border border-blue-700/25 bg-transparent text-blue-800 hover:border-blue-700/60 hover:bg-blue-50",
  ghost: "text-blue-800 hover:bg-sand-200",
  onDark:
    "border border-white/35 bg-white/10 text-white backdrop-blur-sm hover:border-white/70 hover:bg-white/20",
  /* WhatsApp's own green, because an off-brand WhatsApp button reads as fake. */
  whatsapp:
    "bg-[#25D366] text-[#04371d] shadow-(--shadow-lift) hover:bg-[#1EBE5A]",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-13 px-8 text-lg",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className" | "children">;

/**
 * Destinations that leave the app. Typed as template literals so a typo like
 * "htp://" is still caught, while runtime-built URLs (whatsappHref(), a
 * directions link) remain assignable.
 */
type ExternalHref =
  | `https://${string}`
  | `http://${string}`
  | `mailto:${string}`
  | `tel:${string}`;

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children" | "href"> & {
    /**
     * An internal route — checked against the app's real routes by Next's
     * `typedRoutes` — or an absolute external URL.
     */
    href: LinkHref | ExternalHref;
  };

/** The href type Next generates for real routes in this app. */
type LinkHref = ComponentProps<typeof Link>["href"];

function classesFor(variant: ButtonVariant, size: ButtonSize, extra?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], extra);
}

/**
 * The one button. Renders a <button> normally, and a Next <Link> when given an
 * href — so every call site gets the same focus ring, motion and sizing whether
 * it navigates or submits.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonAsButton) {
  return (
    <button className={classesFor(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: ButtonAsLink) {
  // External destinations bypass the client router; WhatsApp and tel: links in
  // particular must hand off to the OS rather than be prefetched.
  // TypeScript cannot narrow a union by regex, so the two branches each assert
  // the shape the test has already established.
  if (typeof href === "string" && /^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a
        href={href}
        className={classesFor(variant, size, className)}
        {...(href.startsWith("http")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href as LinkHref}
      className={classesFor(variant, size, className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
