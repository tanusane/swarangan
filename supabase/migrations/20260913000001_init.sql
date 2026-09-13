-- =============================================================================
-- Swarangan — initial schema
--
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- It is idempotent-safe to read but NOT to re-run; create a new migration file
-- for any later change rather than editing this one.
--
-- SECURITY POSTURE
--   * Row-level security is enabled on EVERY table. A table with RLS on and no
--     policy is readable by nobody except the server's secret key.
--   * Anonymous visitors may only READ published public content.
--   * Only users listed in `public.admins` may write anything. Being signed in
--     is NOT enough — this matters if public sign-ups are ever left enabled.
--   * students, enquiries, login_attempts and the audit log have no anonymous
--     policy of any kind.
--   * Enquiries are NOT insertable with the public key. They are written by the
--     server after validation, rate limiting and a honeypot check, so a bot
--     holding the publishable key cannot spam the table directly.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keeps updated_at honest without every caller remembering to set it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- The allow-list of people who can administer the site.
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Deliberately no policies: nobody reads or edits this list through the API.
-- Add an admin with the snippet in SETUP.md, using the SQL editor.

-- SECURITY DEFINER so policies can consult the allow-list without the caller
-- needing read access to it. search_path is pinned so it cannot be hijacked.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public content
-- Everything a visitor sees. Readable by anyone when published; writable only
-- by admins.
-- ---------------------------------------------------------------------------

create table public.site_settings (
  -- A single row. The check makes a second row impossible.
  id         smallint primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.content_blocks (
  key        text primary key,
  page       text not null default 'home',
  sort       integer not null default 0,
  eyebrow_en text,
  title_en   text not null,
  body_en    text[] not null default '{}',
  -- Hindi and Marathi are nullable and fall back to English until filled in.
  eyebrow_hi text,
  title_hi   text,
  body_hi    text[],
  eyebrow_mr text,
  title_mr   text,
  body_mr    text[],
  published  boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.class_offerings (
  key         text primary key,
  title       text not null,
  audience    text not null check (audience in ('children', 'adults', 'advanced')),
  description text not null,
  sort        integer not null default 0,
  published   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  author     text not null,
  -- Paragraphs, verbatim. The UI never edits existing wording on its own.
  body       text[] not null check (cardinality(body) > 0),
  sort       integer not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_albums (
  key        text primary key,
  title      text not null,
  -- Sort hint only, never displayed. Null when the year was not supplied.
  year       integer,
  sort       integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.gallery_photos (
  id           uuid primary key default gen_random_uuid(),
  album_key    text not null references public.gallery_albums (key) on delete cascade,
  storage_path text not null,
  alt          text not null check (length(trim(alt)) > 0),
  caption      text,
  width        integer not null check (width > 0),
  height       integer not null check (height > 0),
  sort         integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.social_links (
  id             uuid primary key default gen_random_uuid(),
  platform       text not null check (platform in ('youtube', 'instagram', 'facebook')),
  -- A YouTube video id, an Instagram post URL, or a profile URL.
  embed_ref      text not null,
  title          text not null,
  legacy_caption text,
  featured       boolean not null default false,
  enabled        boolean not null default true,
  sort           integer not null default 0,
  updated_at     timestamptz not null default now()
);

-- Every named image position on the site, e.g. 'home.teacher.portrait'.
create table public.media_slots (
  key          text primary key,
  storage_path text not null,
  alt          text not null check (length(trim(alt)) > 0),
  focal_x      real not null default 0.5 check (focal_x between 0 and 1),
  focal_y      real not null default 0.5 check (focal_y between 0 and 1),
  updated_at   timestamptz not null default now()
);

create table public.fee_plans (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  price      text not null,
  cadence    text not null,
  note       text,
  sort       integer not null default 0,
  -- Hidden by default: Tanuja decides when fees become public.
  published  boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.bot_knowledge (
  id         uuid primary key default gen_random_uuid(),
  patterns   text[] not null check (cardinality(patterns) > 0),
  answer     text not null,
  sort       integer not null default 0,
  enabled    boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Private data
-- ---------------------------------------------------------------------------

create table public.students (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  category   text not null check (category in ('children-beginner', 'adults-beginner', 'advanced')),
  level      text not null,
  mode       text not null check (mode in ('studio', 'home', 'online')),
  joined_on  date not null default current_date,
  status     text not null default 'active' check (status in ('active', 'paused', 'left')),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  interest    text,
  mode        text,
  message     text not null,
  status      text not null default 'new' check (status in ('new', 'replied', 'archived')),
  -- Whether the notification email actually went out, so a failed send is
  -- visible in the admin inbox rather than silently lost.
  email_sent  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index enquiries_created_at_idx on public.enquiries (created_at desc);

create table public.admin_audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid references auth.users (id) on delete set null,
  action     text not null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);

-- Login throttling. Keys are salted SHA-256 hashes, never raw emails or IPs.
create table public.login_attempts (
  id         bigint generated always as identity primary key,
  key_hash   text not null,
  key_kind   text not null check (key_kind in ('email', 'ip', 'email_ip')),
  outcome    text not null check (outcome in ('pending', 'failure', 'success', 'blocked')),
  created_at timestamptz not null default now()
);

create index login_attempts_key_time_idx on public.login_attempts (key_hash, created_at desc);

-- The keepalive heartbeat. One row, overwritten by the daily crons.
create table public.system_heartbeat (
  id      smallint primary key default 1 check (id = 1),
  beat_at timestamptz not null default now(),
  source  text not null
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'content_blocks', 'class_offerings', 'testimonials',
    'gallery_albums', 'gallery_photos', 'social_links', 'media_slots',
    'fee_plans', 'bot_knowledge', 'students', 'enquiries'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'content_blocks', 'class_offerings', 'testimonials',
    'gallery_albums', 'gallery_photos', 'social_links', 'media_slots',
    'fee_plans', 'bot_knowledge', 'students', 'enquiries',
    'admin_audit_log', 'login_attempts', 'system_heartbeat'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- -- Public read, published rows only -------------------------------------------
create policy "public reads settings"
  on public.site_settings for select to anon, authenticated using (true);

create policy "public reads published blocks"
  on public.content_blocks for select to anon, authenticated using (published);

create policy "public reads published offerings"
  on public.class_offerings for select to anon, authenticated using (published);

create policy "public reads published testimonials"
  on public.testimonials for select to anon, authenticated using (published);

create policy "public reads albums"
  on public.gallery_albums for select to anon, authenticated using (true);

create policy "public reads published photos"
  on public.gallery_photos for select to anon, authenticated using (published);

create policy "public reads enabled social links"
  on public.social_links for select to anon, authenticated using (enabled);

create policy "public reads media slots"
  on public.media_slots for select to anon, authenticated using (true);

create policy "public reads published fees"
  on public.fee_plans for select to anon, authenticated using (published);

create policy "public reads enabled bot answers"
  on public.bot_knowledge for select to anon, authenticated using (enabled);

-- -- Admins: full access to content and private data ----------------------------
-- One policy per table covering select/insert/update/delete, gated on the
-- allow-list. Admins also see unpublished rows, which the public policies hide.
do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'content_blocks', 'class_offerings', 'testimonials',
    'gallery_albums', 'gallery_photos', 'social_links', 'media_slots',
    'fee_plans', 'bot_knowledge', 'students', 'enquiries'
  ] loop
    execute format(
      'create policy "admins manage %1$s" on public.%1$I
         for all to authenticated
         using ((select public.is_admin()))
         with check ((select public.is_admin()))',
      t
    );
  end loop;
end;
$$;

-- Admins may read the audit trail and the heartbeat, but not rewrite history.
create policy "admins read audit log"
  on public.admin_audit_log for select to authenticated
  using ((select public.is_admin()));

create policy "admins read heartbeat"
  on public.system_heartbeat for select to authenticated
  using ((select public.is_admin()));

-- login_attempts: intentionally NO policies. Server secret key only.

-- ---------------------------------------------------------------------------
-- Storage: one public bucket for site imagery
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  8 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- Public bucket means anyone can fetch an object by URL; these policies govern
-- listing and every kind of write.
create policy "admins upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "admins update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

create policy "admins delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
