# Swarangan

The website for **Swarangan**, Mrs. Tanuja Sane's Hindustani classical vocal
music school in Singapore — rebuilt from the original
[swarangan.sg](https://www.swarangan.sg) so it can be hosted for free.

|           |                                                          |
| --------- | -------------------------------------------------------- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript (strict) |
| Styling   | Tailwind CSS v4                                          |
| Motion    | `motion` (motion.dev) · `anime.js` v4                    |
| Hosting   | Vercel — free Hobby tier                                 |
| Data      | Supabase — free tier (Postgres, auth, storage)           |
| Email     | Resend — free tier                                       |

Running cost after migration is **S$0** for hosting, database and email. Only the
`swarangan.sg` domain renewal remains.

---

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. **No environment variables are needed** for the
public site: it runs on committed content and assets. The admin panel needs
Supabase — follow [SETUP.md](SETUP.md). How to use the admin is in
[ADMIN_GUIDE.md](ADMIN_GUIDE.md).

### Scripts

| Command               | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Development server                                     |
| `npm run build`       | Production build                                       |
| `npm start`           | Serve the production build                             |
| `npm run verify`      | Typecheck + lint + tests — run this before committing  |
| `npm test`            | Vitest suite                                           |
| `npm run assets`      | Rebuild all images and the image manifest (see below)  |
| `npm run palette`     | Regenerate the colour ramps and re-check WCAG contrast |
| `npm run duplication` | jscpd copy-paste check                                 |
| `npm run format`      | Prettier                                               |
| `npm run verify:rls`  | Attack the live database with the public key           |
| `npm run restore`     | Restore a backup ZIP (dry run unless `--confirm`)      |
| `npm run test:email`  | Send a test email with the enquiry email settings      |
| `npm run indexnow`    | Tell Bing and others the site changed                  |

---

## How the project is organised

```
src/
  app/                 routes (one folder per page) + sitemap, robots, icons
  components/
    ui/                shared primitives — button, field, section, image, reveal
    layout/            header, footer, drone line, WhatsApp action
    home/ gallery/ social/ contact/ classes/   feature components
    seo/               JSON-LD structured data
  content/             ALL page copy, as typed objects
    generated/         image-manifest.ts — built, do not edit by hand
  lib/                 site config, schemas, hooks, the carousel engine
scripts/               asset, brand and palette build scripts
assets-source/legacy/  originals rescued from the old HostGator site
important-photos/      originals supplied by Amit
```

### A few deliberate decisions

**One implementation of each thing.** There is a single carousel engine
(`lib/use-carousel.ts`) driving the hero, the gallery lightbox and everything
else; one `<Field>` that owns all form accessibility wiring; one `<Section>`
that owns page rhythm; one `<SwarImage>`. If something appears twice, it gets
extracted — `npm run duplication` helps catch what slips through.

**Content is separated from presentation.** Every string lives in
`src/content/`, which is also the seed for the database. Pages read through
`src/lib/cms/repository.ts`: before the one-click import they show the shipped
content, afterwards the database, and on any database error they fall back to
the shipped content, so the public site never breaks.

**The copy is not ours to change.** The text was transcribed verbatim from the
legacy site, original spellings included. `src/content/content-fidelity.test.ts`
asserts this byte-for-byte, and the four testimonials especially must never be
reworded — they are other people's words about Tanuja's teaching.

**The design comes from the logo.** The palette is generated from the two
colours sampled out of `Swarangan-Logo/SwaranganLogo.PNG` (magenta `#A02F6C`,
blue `#054B96`) by `scripts/build-palette.mjs`, which also fails if any shipped
text/background pair drops below WCAG AA.

---

## Working with images

Never drop a file into `public/images/` by hand. Instead:

1. Put the original in `important-photos/`.
2. Register it in the `ASSETS` list in `scripts/build-assets.mjs`, with real
   **alt text**.
3. Run `npm run assets`.

That resizes and re-encodes it, and regenerates
`src/content/generated/image-manifest.ts` with its true dimensions, alt text and
a blur placeholder. Components read from the manifest, so no page can cause
layout shift or ship an image without a description.

`npm run assets` also derives three brand variants from the logo, by detecting
its flat studio background rather than assuming one:

- `brand/logo.png` — transparent
- `brand/logo-reverse.png` — ivory wordmark for dark grounds (a real two-colour
  reversal, not a CSS `invert`, which would flatten the brand to a white blob)
- `brand/mark.png` — the tree and songbird alone; this is the favicon

> **Restart the dev server after `npm run assets`.** Turbopack caches the
> generated manifest and will otherwise keep serving the previous version.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — the defaults are
   correct, no configuration needed.
3. Set `NEXT_PUBLIC_SITE_URL` to `https://www.swarangan.sg` in the project's
   environment variables. It drives canonical URLs, `sitemap.xml` and OG tags.
4. Add the domain under **Settings → Domains** and update the DNS records at the
   registrar.

**Keep the old site live until the new one is verified on its Vercel preview
URL.** The DNS cutover is the last step, and it is the only irreversible one.

---

## Status

Complete: the public site; the admin panel (every page's text, testimonials,
classes and fees, gallery photos with captions, YouTube videos, Instagram posts,
images, contact details and visibility switches); the student roster, enquiries
inbox and dashboard charts; password reset; database backup and restore; the
keepalive; security headers and a Content-Security-Policy.

The Swarangan.AI assistant was dropped by decision. The `bot_knowledge` table
remains in the schema, unused.

### How the admin login resists brute force

- Attempts are throttled on three keys — email+IP, IP, and email alone — each
  with its own threshold, so one attacker cannot spray guesses, and cannot lock
  the real admin out either. The policy is a pure, unit-tested function in
  `src/lib/auth/lockout.ts`; the tests were verified by deliberately breaking
  each rule and confirming the matching test fails.
- Every attempt is recorded as pending _before_ the password is checked, which
  closes the race where parallel guesses all read the same pre-lockout count.
- Failures all read identically and every response is padded to the same
  duration, so the form cannot reveal which addresses have accounts.
- Signing in requires being on the `admins` allow-list, not merely having a
  Supabase account. The check runs in the Data Access Layer on every admin page
  and every admin action — `proxy.ts` only does an optimistic redirect.
- Stored throttle keys are peppered HMACs, never raw emails or IP addresses.

### Known items

- **YouTube's "latest uploads" feed** currently returns 404 for the Swarangan
  channel — Google has been restricting that endpoint. The section simply does
  not render; the curated video list is unaffected. See the note in
  `src/lib/youtube-feed.ts`.
- **Vercel Hobby is for non-commercial use.** Fine for the site as it is today;
  move to Pro if it becomes a commercial business site.
