"use client";

import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/cms/settings";

/**
 * Site settings for Client Components.
 *
 * Server Components call `getSettings()` directly. The few interactive pieces
 * that run in the browser — the header, the floating WhatsApp button, the map —
 * receive the same values through this context, filled once by the site layout,
 * so an edited phone number reaches every corner of the page from one read.
 */
const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SiteSettingsProvider({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
