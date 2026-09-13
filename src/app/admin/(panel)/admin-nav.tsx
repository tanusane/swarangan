"use client";

import {
  BookOpen,
  Camera,
  FileText,
  Images,
  LayoutDashboard,
  MessageSquareQuote,
  Settings,
  Clapperboard,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * Admin sections. One list, so adding an editor is one line here. Kept in its
 * own client component because only the active-tab highlight needs the
 * pathname; the panel layout around it stays a Server Component.
 */
const SECTIONS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/pages", label: "Page text", Icon: FileText },
  { href: "/admin/classes", label: "Classes & fees", Icon: BookOpen },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    Icon: MessageSquareQuote,
  },
  { href: "/admin/gallery", label: "Gallery", Icon: Camera },
  { href: "/admin/videos", label: "Videos", Icon: Clapperboard },
  { href: "/admin/images", label: "Images", Icon: Images },
  { href: "/admin/settings", label: "Settings", Icon: Settings },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="container-swar">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {SECTIONS.map(({ href, label, Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-magenta-600 text-magenta-700"
                    : "text-ink-muted border-transparent hover:text-blue-800",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
