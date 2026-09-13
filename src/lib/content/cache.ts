/**
 * The cache tag for everything a visitor sees that an admin can edit.
 *
 * Public pages read editable content through a fetch tagged with this; every
 * admin save calls `updateTag(CONTENT_TAG)`. One tag rather than one per table
 * on purpose: the site is small, a full refresh of its content is cheap, and a
 * missed or mistyped per-table tag would mean an edit that silently never
 * appears.
 */
export const CONTENT_TAG = "site-content";

/**
 * Even with on-demand invalidation, cached content also refreshes on its own
 * after a day — insurance against any path that changes the database without
 * going through the admin panel (for example, an edit in the Supabase
 * dashboard).
 */
export const CONTENT_MAX_AGE_SECONDS = 24 * 60 * 60;
