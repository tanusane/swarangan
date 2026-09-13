import { loadCollection } from "@/lib/cms/admin-read";
import type { CollectionKey } from "@/lib/cms/collections";

import { CollectionEditor } from "./collection-editor";

/** Load a collection as the admin and render its editor. */
export async function CollectionSection({
  collectionKey,
}: {
  collectionKey: CollectionKey;
}) {
  const rows = await loadCollection(collectionKey);
  return <CollectionEditor collectionKey={collectionKey} rows={rows} />;
}

/** The heading every admin page opens with. */
export function AdminPageHeading({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-3xl">{title}</h1>
      <p className="text-ink-muted mt-1 max-w-2xl">{children}</p>
    </div>
  );
}
