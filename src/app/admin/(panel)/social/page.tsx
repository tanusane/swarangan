import type { Metadata } from "next";

import {
  AdminPageHeading,
  CollectionSection,
} from "../content/collection-section";

export const metadata: Metadata = { title: "Social media" };

export default function SocialMediaPage() {
  return (
    <div className="space-y-12">
      <AdminPageHeading title="Social media">
        What appears on the Social Presence page. To switch a whole platform on
        or off, use Settings.
      </AdminPageHeading>
      <CollectionSection collectionKey="videos" />
      <CollectionSection collectionKey="instagramPosts" />
    </div>
  );
}
