import type { Metadata } from "next";

import { loadAdminSettings } from "@/lib/cms/admin-read";

import { AdminPageHeading } from "../content/collection-section";

import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { settings } = await loadAdminSettings();

  return (
    <div className="space-y-8">
      <AdminPageHeading title="Settings">
        Contact details, address, social links and the short phrases used across
        the website. They update everywhere at once — header, footer, contact
        page, map and search listings.
      </AdminPageHeading>
      <SettingsForm initial={settings} />
    </div>
  );
}
