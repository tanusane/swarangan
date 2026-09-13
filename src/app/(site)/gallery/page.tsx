import type { Metadata } from "next";

import { PhotoGrid } from "@/components/gallery/photo-grid";
import { PageHeader } from "@/components/ui/page-header";
import { BreadcrumbSchema } from "@/components/seo/structured-data";
import { getGallery } from "@/lib/cms/repository";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs from Swarangan's annual functions in Singapore — students and teachers of Hindustani classical and semi-classical vocal music on stage.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const { albums, photos } = await getGallery();

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
        lead="Moments from our annual functions — the evenings when a year of riyaz meets an audience."
        image="events/af2024-ensemble.jpg"
      />

      <section className="py-(--spacing-section)">
        <div className="container-swar">
          <PhotoGrid albums={albums} photos={photos} />
        </div>
      </section>
    </>
  );
}
