import { DroneLine } from "@/components/layout/drone-line";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SitarLoader } from "@/components/layout/sitar-loader";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { OrganizationSchema } from "@/components/seo/structured-data";

/**
 * Chrome for the public site. A route group, so it adds no segment to any URL:
 * /gallery is still /gallery. It exists so the admin panel does not inherit the
 * visitor-facing header, footer, intro animation or WhatsApp button.
 */
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <a
        href="#main"
        className="focus:bg-magenta-600 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:px-5 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>

      <SitarLoader />
      <OrganizationSchema />
      <DroneLine />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
