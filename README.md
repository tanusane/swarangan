# Swarangan

The website and admin panel for **Swarangan**, Mrs. Tanuja Sane's Hindustani
classical vocal music school in Singapore.

It is a public website (home, classes, gallery, social presence, testimonials,
contact) plus a private admin panel where the school edits every piece of
content, manages its student roster and enquiries, and downloads backups. It
runs entirely on free tiers.

| Document                                       | For                                                      |
| ---------------------------------------------- | -------------------------------------------------------- |
| **README.md** (this file)                      | Developers: what it is, how it is built, how to run it   |
| [SETUP.md](SETUP.md)                           | Setting up Supabase, Vercel, emails, backups, the domain |
| [docs/setup-guide.html](docs/setup-guide.html) | The same setup as a clickable checklist                  |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md)               | Tanuja and Amit: using the admin panel day to day        |

---

## Contents

- [Features](#features)
- [Tech stack and costs](#tech-stack-and-costs)
- [Quick start](#quick-start)
- [Full setup, step by step](#full-setup-step-by-step)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Security](#security)
- [Working with images](#working-with-images)
- [Deploying and the domain](#deploying-and-the-domain)
- [Maintenance](#maintenance)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)

---

## Features

**Public website**

- Home, Classes, Gallery, Social Presence, Testimonials and Contact pages.
- Design derived from the logo (magenta tree and songbird, blue wordmark), with
  motion throughout, a sitar intro on the home page and a tanpura cursor.
- Gallery albums with a keyboard- and swipe-friendly lightbox and captions.
- Social Presence with separate YouTube, Instagram and Facebook sections, each
  switchable from the admin.
- Contact form that saves every enquiry and emails the school; WhatsApp buttons
  beside the phone number; a right-sized map.
- SEO for Singapore: structured data (music school, courses, reviews,
  location), sitemap, robots rules welcoming search and AI crawlers,
  `/llms.txt`, IndexNow.
- Accessible (WCAG AA contrast, keyboard use, reduced-motion support) and
  responsive down to small phones.

**Admin panel** (`/admin`)

- Secure sign-in with brute-force lockout, and password reset by email.
- Edit everything: page text, class descriptions, fees (hidden until
  published), testimonials, gallery albums and photos with captions, YouTube
  videos, Instagram posts, replaceable images, contact details, social links.
- Show/hide switches for the phone number, WhatsApp buttons and each social
  platform.
- Student roster with search and filters.
- Enquiries inbox (New / Replied / Archived).
- Dashboard: student and enquiry figures and charts, keepalive health, failed
  sign-in attempts.
- Password-confirmed database backup download, and a restore script.

---

## Tech stack and costs

| Layer     | Choice                                                 | Cost              |
| --------- | ------------------------------------------------------ | ----------------- |
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) | Free, open source |
| Styling   | Tailwind CSS v4                                        | Free              |
| Motion    | `motion` (motion.dev), `anime.js` v4                   | Free              |
| Charts    | Recharts                                               | Free              |
| Hosting   | Vercel — Hobby plan                                    | Free              |
| Database  | Supabase — Postgres, Auth, Storage (free plan)         | Free              |
| Email     | Resend (free plan)                                     | Free              |
| Code, CI  | GitHub, GitHub Actions                                 | Free              |

Running cost: **S$0** plus the yearly domain renewal. Two free-tier rules to
know: Vercel Hobby is for **non-commercial** use (move to Pro if the site
becomes a commercial business site), and Supabase **pauses a free project
after about a week of inactivity** (prevented by the keepalive, see
[Maintenance](#maintenance)).

---

## Quick start

Requirements: **Node.js 20.9 or newer** (developed on Node 24) and npm.

```bash
git clone https://github.com/tanusane/swarangan.git
cd swarangan
npm install
npm run dev
```

Open http://localhost:3000.

**The public website needs no configuration** — it runs on the content and
images committed in the repository. The admin panel, enquiries and emails need
the environment variables below; follow [SETUP.md](SETUP.md).

---

## Full setup, step by step

The complete, click-by-click version is [SETUP.md](SETUP.md). In outline:

1. **Supabase** — create a project (Singapore region), run
   `supabase/migrations/20260913000001_init.sql` in the SQL Editor, turn off
   public sign-ups, create the admin user and add their UID to `public.admins`.
2. **Keys** — copy the project URL, publishable key and secret key; generate
   `AUTH_THROTTLE_PEPPER` and `CRON_SECRET`.
3. **Local** — copy `.env.example` to `.env.local`, fill it in, run
   `npm run dev`, sign in at http://localhost:3000/admin.
4. **Check security** — `npm run verify:rls` must pass on every line.
5. **First sign-in** — on the dashboard click **Import the website's content**
   once, to copy the built-in content into the editable database.
6. **Vercel** — import the GitHub repository, add the environment variables,
   deploy.
7. **Keepalive** — add `SITE_URL` and `CRON_SECRET` as GitHub Actions secrets.
8. **Emails** — Resend account and API key; Supabase SMTP and reset-email
   template for password resets. Test with `npm run test:email`.
9. **Domain** — move DNS to Vercel, re-create email records, verify the domain
   in Resend, update the site URL everywhere.
10. **Search** — Google Business Profile, Search Console, Bing Webmaster Tools.

---

## Environment variables

Set them in `.env.local` for development and in **Vercel → Settings →
Environment Variables** for production. `.env.example` lists them all with
comments. Never commit `.env.local`.

| Variable                               | Required for          | Vercel type | Notes                                                               |
| -------------------------------------- | --------------------- | ----------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                 | Canonical URLs, links | Config      | `https://www.swarangan.sg` in production (no trailing slash)        |
| `NEXT_PUBLIC_SUPABASE_URL`             | Admin, enquiries      | Config      | Supabase → Project Settings → API Keys                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Admin, enquiries      | Config      | `sb_publishable_…`                                                  |
| `SUPABASE_SECRET_KEY`                  | Admin, enquiries      | **Secret**  | `sb_secret_…` — bypasses all database security; server only         |
| `AUTH_THROTTLE_PEPPER`                 | Admin sign-in         | **Secret**  | Random, at least 32 characters                                      |
| `CRON_SECRET`                          | Keepalive             | **Secret**  | Random; same value as the GitHub `CRON_SECRET` secret               |
| `RESEND_API_KEY`                       | Emails (optional)     | **Secret**  | `re_…`                                                              |
| `RESEND_FROM`                          | Emails (optional)     | Config      | `Swarangan <onboarding@resend.dev>` until the domain is verified    |
| `ENQUIRY_NOTIFY_TO`                    | Emails (optional)     | Config      | Inbox for enquiry emails; defaults to the contact email in Settings |
| `INDEXNOW_KEY`                         | `npm run indexnow`    | Config      | Any 32-character hex string; published at `/indexnow.txt`           |

Generate a random secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`NEXT_PUBLIC_…` values are built into the site, so **redeploy after changing
them**.

---

## Scripts

| Command               | What it does                                                         |
| --------------------- | -------------------------------------------------------------------- |
| `npm run dev`         | Development server on http://localhost:3000                          |
| `npm run build`       | Production build                                                     |
| `npm start`           | Serve the production build                                           |
| `npm run verify`      | Typecheck + lint + tests — run before every commit                   |
| `npm test`            | Unit tests (Vitest)                                                  |
| `npm run duplication` | Copy-paste detection (jscpd)                                         |
| `npm run format`      | Prettier                                                             |
| `npm run verify:rls`  | Attacks the live database with the public key; every check must pass |
| `npm run test:email`  | Sends one test email with the configured Resend settings             |
| `npm run restore`     | Restores a backup ZIP (dry run unless `--confirm` is added)          |
| `npm run indexnow`    | Notifies Bing and other IndexNow search engines of changes           |
| `npm run assets`      | Rebuilds images, brand variants, cursors and the image manifest      |
| `npm run palette`     | Regenerates colour ramps and re-checks WCAG contrast                 |

---

## Project structure

```
src/
  app/
    (site)/              public pages: home, classes, gallery, social, testimonials, contact
    admin/
      (auth)/            sign in, forgot password, reset password
      (panel)/           dashboard and every editor (students, enquiries, content, backup…)
      auth/confirm/      password-reset email link handler
      backup/download/   backup ZIP endpoint (POST, password-confirmed)
    api/keepalive/       daily database ping (cron)
    sitemap.ts robots.ts llms.txt/ indexnow.txt/
  components/
    ui/                  shared primitives: button, field, section, image, status pages
    layout/              header, footer, sitar intro, drone line, WhatsApp button
    home/ gallery/ social/ contact/ classes/ seo/
  content/               the original site content (verbatim), used as the database seed
    generated/           image manifest — built by `npm run assets`, do not edit
  lib/
    cms/                 content repository, collection registry, settings, seed
    auth/                sign-in lockout, throttle, admin access check
    backup/ students/ enquiries/ media/ supabase/ admin/
  proxy.ts               session refresh and redirect for /admin (Next 16's middleware)
supabase/migrations/     database schema, row-level security, storage bucket
scripts/                 asset builders, RLS verifier, restore, test email, IndexNow
docs/setup-guide.html    interactive setup checklist
important-photos/        original photographs supplied by the school
assets-source/           originals rescued from the previous website
```

---

## How it works

**Content flows from one repository.** Every public page reads through
`src/lib/cms/repository.ts`:

- Before the one-click import, pages show the content shipped in
  `src/content/`.
- After the import, the database is the source of truth.
- If the database is unreachable, pages fall back to the shipped content, so
  the public site never breaks.

Reads are cached; every admin save invalidates the cache, so changes appear
immediately.

**One editor for every collection.** Testimonials, videos, Instagram posts,
fees, page sections, albums and photos are each described once in
`src/lib/cms/collections.ts` (fields, ordering, visibility, create/delete
rules). A single generic editor renders them and a single set of validated
server actions saves them. Adding an editable collection is a new entry there.

**The original words are protected.** The copy — especially the four
testimonials — was transcribed verbatim from the previous site. Tests assert it
byte-for-byte, and the database import and export are tested to be lossless.

**Engineering rules.** TypeScript strict; Zod validation at every boundary
(forms, server actions, environment); Server Components by default; anything
used more than once is extracted (`npm run duplication` enforces it); every
change must pass `npm run verify` and `npm run build`.

---

## Security

- **Row-level security on every table.** Visitors can read only published
  content; students, enquiries, sign-in attempts and the audit log have no
  public access at all. `npm run verify:rls` proves it against the live
  database.
- **Admin allow-list.** Having a Supabase account is not enough — the user must
  be in `public.admins`. Checked on every admin page and every admin action,
  not only in `proxy.ts`.
- **Brute-force protection.** Sign-in attempts are throttled by email+IP, by IP
  and by email, escalating to 15 minutes; failures look identical and take the
  same time, so the form reveals nothing about which accounts exist. Stored
  keys are peppered hashes, never raw emails or IPs.
- **Password reset** is rate-limited, does not reveal whether an address has an
  account, and only lets allow-listed admins set a new password.
- **Backups** require an admin session, same-origin requests and the password
  re-entered; every download and refusal is audited.
- **Enquiries** are written only by the server after validation, a honeypot
  and a per-address hourly limit.
- **Headers:** Content-Security-Policy (allow-listing only the embeds used),
  HSTS, frame denial, nosniff, strict referrer policy.
- Admin-edited text placed into structured data is escaped against script
  injection; CSV exports are protected against spreadsheet formula injection.

---

## Working with images

Photos **added through the admin panel** (gallery, replaceable images) are
resized in the browser and stored in Supabase Storage — no code involved.

Images **committed to the repository** go through the asset pipeline. Never
drop a file into `public/images/` by hand:

1. Put the original in `important-photos/`.
2. Register it in the `ASSETS` list in `scripts/build-assets.mjs`, with real
   alt text.
3. Run `npm run assets`, then restart the dev server.

This resizes and re-encodes the image and regenerates
`src/content/generated/image-manifest.ts` with its dimensions, alt text and a
blur placeholder. It also builds the logo variants and the favicon.

---

## Deploying and the domain

**Deploying:** Vercel builds from GitHub. Every push to `main` deploys to
production automatically. Pull requests and other branches get preview URLs.

**The domain** (full steps: [SETUP.md step 13](SETUP.md)):

1. Set up a new home for the info@swarangan.sg mailbox and export old email.
2. Add `www.swarangan.sg` and `swarangan.sg` in Vercel (nameservers method).
3. Re-create the email MX/SPF records and add Resend's records in Vercel DNS.
4. At the registrar, switch the nameservers to Vercel's.
5. When it is live, set `NEXT_PUBLIC_SITE_URL`, `RESEND_FROM`, the GitHub
   `SITE_URL` secret and Supabase's Site URL and SMTP sender to the real domain,
   and redeploy.

---

## Maintenance

| How often                              | What                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Automatic, daily                       | Two keepalive pings (Vercel Cron 03:00 UTC, GitHub Action 15:00 UTC) keep Supabase awake |
| Monthly                                | Admin → **Backup** → download and store the ZIP privately                                |
| Occasionally                           | Glance at the dashboard: keepalive health and failed sign-ins                            |
| After changes to the database policies | `npm run verify:rls`                                                                     |
| Before committing                      | `npm run verify` and `npm run build`                                                     |

**Restoring a backup:**

```bash
npm run restore -- path/to/swarangan-backup-YYYY-MM-DD-HHMM.zip            # dry run
npm run restore -- path/to/swarangan-backup-YYYY-MM-DD-HHMM.zip --confirm  # writes
```

Photos stay in Supabase Storage and are not part of the ZIP; the audit log is
not written back; admins are re-added as in SETUP.md step 4.

---

## Troubleshooting

| Symptom                                            | Cause and fix                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Admin says "not set up yet"                        | An environment variable is missing or invalid. Compare with `.env.example`; redeploy on Vercel.                    |
| Admin pages fail, dashboard says "No ping"         | Supabase paused. Supabase dashboard → project → **Restore**; then check both keepalives.                           |
| GitHub keepalive: "HTTP 404"                       | `SITE_URL` points at a site that is not this app. Use the live Vercel or domain address.                           |
| GitHub keepalive: "HTTP 401"                       | `CRON_SECRET` in GitHub differs from Vercel.                                                                       |
| `npm run test:email` refused (403)                 | With `onboarding@resend.dev`, Resend only delivers to its account's own email. Send to that, or verify the domain. |
| Enquiry saved but "No email notification was sent" | Resend variables missing or refused; check Vercel logs and run `npm run test:email`.                               |
| Reset link says expired                            | Links work once, for about an hour. Check Supabase's redirect URLs and the reset template (SETUP.md step 11 B).    |
| A Vercel warning about `NEXT_PUBLIC_` secrets      | Save `NEXT_PUBLIC_…` variables as **Config**, not Secret; they are public by design.                               |
| A new embed does not show                          | Its host must be added to the Content-Security-Policy in `next.config.ts`.                                         |
| Images changed but old ones show locally           | Restart `npm run dev` after `npm run assets`.                                                                      |

---

## Known limitations

- **YouTube "latest uploads"** uses YouTube's public feed, which currently
  returns 404 for this channel. That section hides itself; curated videos are
  unaffected.
- **Visitor "thank you" emails** start only once `swarangan.sg` is verified in
  Resend.
- **Instagram and Facebook** previews are the platforms' public embeds; their
  appearance is controlled by Meta.
- The `bot_knowledge` table exists in the schema from an assistant feature that
  was dropped; it is unused.
