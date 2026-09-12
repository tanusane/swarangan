import type { Metadata } from "next";

import { PhotoGrid } from "@/components/gallery/photo-grid";
import { PageHeader } from "@/components/ui/page-header";
import { BreadcrumbSchema } from "@/components/seo/structured-data";
import { galleryAlbums, galleryPhotos } from "@/content/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs from Swarangan's annual functions in Singapore — students and teachers of Hindustani classical and semi-classical vocal music on stage.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Gallery", href: "/gallery" },
        ]}
      />

      <PageHeader
        eyebrow="Photographs"
        title="Gallery"
        lead="Concerts and annual functions — the evenings when a year of riyaz meets an audience."
        image="events/guru-vandana-1.jpg"
      />

      <section className="py-(--spacing-section)">
        <div className="container-swar">
          <PhotoGrid albums={galleryAlbums} photos={galleryPhotos} />
        </div>
      </section>
    </>
  );
}
