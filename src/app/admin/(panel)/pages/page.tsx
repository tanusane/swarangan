import type { Metadata } from "next";

import {
  AdminPageHeading,
  CollectionSection,
} from "../content/collection-section";

export const metadata: Metadata = { title: "Page text" };

export default function PagetextPage() {
  return (
    <div className="space-y-12">
      <AdminPageHeading title="Page text">
        The words on the home page. Open a section to edit it; saved text
        appears on the website straight away.
      </AdminPageHeading>
      <CollectionSection collectionKey="introSections" />
      <CollectionSection collectionKey="namedSections" />
      <CollectionSection collectionKey="locations" />
    </div>
  );
}
