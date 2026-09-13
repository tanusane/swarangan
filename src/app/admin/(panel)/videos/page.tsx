import type { Metadata } from "next";

import {
  AdminPageHeading,
  CollectionSection,
} from "../content/collection-section";

export const metadata: Metadata = { title: "Videos" };

export default function VideosPage() {
  return (
    <div className="space-y-12">
      <AdminPageHeading title="Videos">
        Performances shown on the Social Presence page.
      </AdminPageHeading>
      <CollectionSection collectionKey="videos" />
    </div>
  );
}
