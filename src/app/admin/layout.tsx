import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Swarangan admin" },
  // Belt and braces with robots.txt: never index anything under /admin, even if
  // a link to it leaks somewhere public.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="bg-sand-100 min-h-svh">{children}</div>;
}
