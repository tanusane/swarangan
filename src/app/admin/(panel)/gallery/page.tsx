import type { Metadata } from "next";

import { loadCollection, mediaBaseUrl } from "@/lib/cms/admin-read";
import { photoSrc } from "@/lib/cms/rows";

import { CollectionEditor } from "../content/collection-editor";
import { AdminPageHeading } from "../content/collection-section";

import { PhotoUploader } from "./photo-uploader";

export const metadata: Metadata = { title: "Gallery" };

/**
 * Admin: gallery albums, and the photos in each — upload, caption, describe,
 * reorder, hide or delete.
 */
export default async function GalleryAdminPage() {
  const [albums, photos] = await Promise.all([
    loadCollection("albums"),
    loadCollection("photos"),
  ]);
  const base = mediaBaseUrl();

  const previews = Object.fromEntries(
    photos.map((photo) => [
      String(photo.id),
      photoSrc(String(photo.storage_path), base),
    ]),
  );

  return (
    <div className="space-y-12">
      <AdminPageHeading title="Gallery">
        Add photos to an album, then open a photo to give it a caption. Photos
        are resized automatically before uploading.
      </AdminPageHeading>

      <CollectionEditor collectionKey="albums" rows={albums} />

      {albums.map((album) => {
        const key = String(album.key);
        const title = String(album.title);
        return (
          <section
            key={key}
            className="border-sand-300 space-y-4 border-t pt-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl">{title}</h2>
              <PhotoUploader albumKey={key} albumTitle={title} />
            </div>
            <CollectionEditor
              collectionKey="photos"
              rows={photos.filter((photo) => photo.album_key === key)}
              previews={previews}
              bare
            />
          </section>
        );
      })}
    </div>
  );
}
