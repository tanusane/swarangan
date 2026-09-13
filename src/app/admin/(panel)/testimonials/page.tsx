import type { Metadata } from "next";

import {
  AdminPageHeading,
  CollectionSection,
} from "../content/collection-section";

export const metadata: Metadata = { title: "Testimonials" };

export default function TestimonialsPage() {
  return (
    <div className="space-y-12">
      <AdminPageHeading title="Testimonials">
        What parents and students have said. Changes appear on the website
        straight away.
      </AdminPageHeading>
      <CollectionSection collectionKey="testimonials" />
    </div>
  );
}
