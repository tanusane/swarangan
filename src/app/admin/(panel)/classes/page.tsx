import type { Metadata } from "next";

import {
  AdminPageHeading,
  CollectionSection,
} from "../content/collection-section";

export const metadata: Metadata = { title: "Classes and fees" };

export default function ClassesAndfeesPage() {
  return (
    <div className="space-y-12">
      <AdminPageHeading title="Classes and fees">
        Class descriptions, and fees and timings when you are ready to publish
        them.
      </AdminPageHeading>
      <CollectionSection collectionKey="classes" />
      <CollectionSection collectionKey="fees" />
    </div>
  );
}
