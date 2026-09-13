import { WhatsAppIcon } from "@/components/ui/icons";
import { getSettings } from "@/lib/cms/repository";
import { whatsappHrefFor } from "@/lib/cms/settings";

/**
 * Floating WhatsApp action, mobile only.
 *
 * On desktop the header already carries a WhatsApp button, so this would be
 * redundant clutter; on a phone, WhatsApp is how enquiries actually arrive.
 *
 * Sits above the left drone line and clear of the Phase 4 Swarangan.AI launcher,
 * which takes the bottom-right corner.
 */
export async function WhatsAppFab() {
  const settings = await getSettings();
  if (!settings.showWhatsApp) return null;
  return (
    <a
      href={whatsappHrefFor(settings)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message Swarangan on WhatsApp"
      className="fixed bottom-5 left-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-[#04371d] shadow-(--shadow-lift-lg) transition-transform duration-200 ease-(--ease-swar) hover:scale-105 active:scale-95 lg:hidden"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
