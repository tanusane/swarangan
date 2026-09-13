import type { ReactNode } from "react";

import { BrandLogo } from "@/components/ui/brand-logo";

/**
 * The one layout for "not found", "something went wrong" and similar pages:
 * the logo, a heading, a line of help and a way onward.
 */
export function StatusPage({
  eyebrow,
  title,
  children,
  actions,
  showLogo = true,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  showLogo?: boolean;
}) {
  return (
    <main
      id="main"
      className="flex min-h-[70svh] items-center justify-center px-5 py-24"
    >
      <div className="max-w-lg text-center">
        {showLogo && (
          <BrandLogo alt="Swarangan" className="mx-auto mb-8 h-14 w-auto" />
        )}
        <p className="text-magenta-700 text-xs tracking-[0.3em] uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl">{title}</h1>
        <div className="text-ink-muted mt-4">{children}</div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      </div>
    </main>
  );
}
