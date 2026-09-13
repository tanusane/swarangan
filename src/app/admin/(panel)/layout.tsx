import { LogOut } from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/ui/brand-logo";
import { requireAdmin } from "@/lib/auth/dal";

import { signOut } from "./actions";

/**
 * The signed-in admin shell.
 *
 * `requireAdmin()` here protects every page in the panel at render time. It does
 * NOT protect Server Actions, which can be called without rendering this layout
 * — so each action calls `requireAdmin()` itself as well. See lib/auth/dal.ts.
 */
export default async function PanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  return (
    <>
      <header className="border-sand-300 border-b bg-white">
        <div className="container-swar flex h-16 items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <BrandLogo alt="Swarangan" className="h-9 w-auto" />
            <span className="text-ink-muted border-sand-300 hidden border-l pl-3 text-sm sm:inline">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-muted hidden sm:inline">
              {admin.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="hover:bg-sand-200 inline-flex items-center gap-2 rounded-full px-3 py-2 text-blue-800 transition-colors"
              >
                <LogOut aria-hidden="true" className="size-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="container-swar py-10">{children}</main>
    </>
  );
}
