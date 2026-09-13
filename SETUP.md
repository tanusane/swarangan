# Setting up the admin panel

The public website runs with no setup at all. These steps switch on the admin
panel, the database, and the keepalive. Allow about 30 minutes, once.

Everything here uses free tiers. No card is needed at any step.

> **Order matters.** In particular, do step 3 (turn off public sign-ups)
> before sharing the site's URL anywhere.

---

## 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
   - **Region:** Southeast Asia (Singapore) — closest to Tanuja's visitors.
   - **Database password:** generate a strong one and store it in a password
     manager. You will rarely need it, but it cannot be recovered.
2. Wait for the project to finish provisioning (a minute or two).

## 2. Create the database

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of
   `supabase/migrations/20260913000001_init.sql` and click **Run**.
3. It should finish with "Success. No rows returned".

This creates every table, turns on row-level security for all of them, and
creates the `media` storage bucket.

## 3. Turn off public sign-ups — do not skip

By default, anyone who finds your Supabase URL could create an account.

1. **Authentication → Sign In / Providers**.
2. Turn **off** "Allow new users to sign up".

Even if this were left on, a new account could not touch anything — writing
requires being on the admin allow-list, not merely being signed in. But there
is no reason to leave the door open.

## 4. Create the admin account

1. **Authentication → Users → Add user → Create new user**.
2. Enter the admin's email and a strong password, tick **Auto Confirm User**,
   and create it.
3. Copy the new user's **UID** from the users list.
4. Back in **SQL Editor**, run this with the UID pasted in:

   ```sql
   insert into public.admins (user_id) values ('PASTE-THE-UID-HERE');
   ```

A user who is not in this table cannot sign in to the admin panel, even with
the correct password. Repeat for each person who should have access.

## 5. Collect the keys

**Project Settings → API Keys**. You need:

| Value                                | Where it goes                          |
| ------------------------------------ | -------------------------------------- |
| Project URL                          | `NEXT_PUBLIC_SUPABASE_URL`             |
| Publishable key (`sb_publishable_…`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Secret key (`sb_secret_…`)           | `SUPABASE_SECRET_KEY`                  |

> **The secret key bypasses every security rule in the database.** Treat it
> like the database password: never commit it, never paste it into chat or
> email, and never give it a `NEXT_PUBLIC_` name.

Also generate two random secrets. Run this twice and keep both outputs:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

One is `AUTH_THROTTLE_PEPPER`, the other `CRON_SECRET`.

## 6. Local development

Copy `.env.example` to `.env.local`, fill in all five values, then:

```bash
npm run dev
```

Visit http://localhost:3000/admin and sign in.

## 7. Verify the security rules

```bash
npm run verify:rls
```

This attacks your database using only the public key, exactly as an anonymous
visitor could, and fails if anything private is readable or anything is
writable. **Every line must say PASS.** Run it again after any change to the
database policies.

## 8. Production on Vercel

1. In the Vercel project: **Settings → Environment Variables**. Add all five
   values from step 5, plus `NEXT_PUBLIC_SITE_URL=https://www.swarangan.sg`,
   for the **Production** environment.
2. Redeploy.

The daily keepalive in `vercel.json` starts running automatically once
`CRON_SECRET` is set on a production deployment.

## 9. The backup keepalive on GitHub

Supabase pauses a free project after about a week without database activity,
and **restoring it is a manual click in the Supabase dashboard**. Visiting the
website does not count as activity. Two independent daily pings prevent this:
Vercel Cron (step 8) and a GitHub Action.

1. In the GitHub repository: **Settings → Secrets and variables → Actions →
   New repository secret**. Add:
   - `SITE_URL` = `https://www.swarangan.sg`
   - `CRON_SECRET` = the same value used in Vercel
2. **Actions → Supabase keepalive → Run workflow** to test it immediately.
   After that it runs **by itself every day** — nobody needs to press anything.

> **"Keepalive returned HTTP 404"** means `SITE_URL` points at a site that is
> not this app yet — for example www.swarangan.sg while it is still on
> HostGator. Until the domain is moved, set `SITE_URL` to the Vercel address
> (`https://<project>.vercel.app`), then change it back after the move.

The admin dashboard shows when the last ping arrived, and warns if none has
arrived for two days.

> GitHub switches off scheduled workflows after 60 days with no commits to the
> repository. If the dashboard ever shows the GitHub ping has stopped, re-enable
> the workflow from the Actions tab. The Vercel ping is unaffected.

## 10. Get found in Singapore — Google and AI assistants

The website already does its part: structured data describing the school, its
classes, its location in Clementi West and its reviews; a sitemap; a
`robots.txt` that explicitly welcomes Google, Bing and the AI assistants
(ChatGPT, Claude, Perplexity, Apple); and `/llms.txt`, a plain summary for AI
tools.

**No code can guarantee a top search position.** For a local school, what moves
it most happens off the website:

1. **Google Business Profile — the single biggest factor.** This is what
   appears in Google Maps and in "music classes near me" results.
   - Go to [google.com/business](https://www.google.com/business), add
     Swarangan as a **music school** at the studio address.
   - Use exactly the same name, address and phone number as the website.
   - Add photos, the website link, and ask happy parents and students to leave
     Google reviews. Reviews matter more than almost anything else locally.
2. **Google Search Console.** At
   [search.google.com/search-console](https://search.google.com/search-console),
   add `https://www.swarangan.sg`, verify it (the DNS option is simplest), and
   submit `https://www.swarangan.sg/sitemap.xml`.
3. **Bing Webmaster Tools.** At
   [bing.com/webmasters](https://www.bing.com/webmasters), import the site from
   Search Console in one click. ChatGPT Search and Microsoft Copilot draw on
   Bing's index, so this matters for AI answers too.
4. **Optional — instant updates to Bing.** Set `INDEXNOW_KEY` in Vercel and
   `.env.local` (a random string, generated like the secrets in step 5), then
   after publishing changes run:

   ```bash
   npm run indexnow
   ```

> Use the address exactly as the website shows it — **52 West Coast Crescent,
> #07-09 West Bay Condominium, Singapore 128036** — including on the Google
> Business Profile. Search engines cross-check it everywhere it appears.

## 11. Emails — enquiries and password resets (free)

Enquiries from the contact form are **always saved** under
**Admin → Enquiries**. This step makes each one also arrive **by email**, and
makes **"Forgot your password?"** on the admin login send its link.

### A. Enquiry emails — works today, no DNS changes

1. Sign up at [resend.com](https://resend.com) **using the email address that
   should receive enquiries** (for example info@swarangan.sg). Free: 3,000
   emails a month, no card.
2. **API Keys → Create API key** (permission: _Sending access_).
3. Add to `.env.local`, and to Vercel's environment variables:
   ```
   RESEND_API_KEY=re_...
   RESEND_FROM="Swarangan <onboarding@resend.dev>"
   ENQUIRY_NOTIFY_TO=info@swarangan.sg
   ```
   `ENQUIRY_NOTIFY_TO` must be the address you signed up to Resend with — the
   shared `onboarding@resend.dev` sender only delivers to that address.
4. Test it:
   ```bash
   npm run test:email
   ```
   Then send a real message through the contact form. It appears under
   Admin → Enquiries and in the inbox. An enquiry whose email did not go out is
   marked "No email notification was sent".

### B. Password-reset emails

1. Supabase → **Authentication → URL Configuration**:
   - **Site URL**: `https://www.swarangan.sg`
   - **Redirect URLs** → add `https://www.swarangan.sg/admin/auth/confirm` and
     `http://localhost:3000/admin/auth/confirm`
2. Supabase → **Authentication → Emails → SMTP Settings** → enable custom SMTP
   (Supabase's own sender only reaches team members, a couple of times an
   hour):
   - Host `smtp.resend.com`, port `465`, username `resend`
   - Password: the Resend API key from A
   - Sender email: `onboarding@resend.dev` for now (reset emails then reach
     only the Resend sign-up address, which is fine while that is the admin),
     later `enquiries@swarangan.sg`
   - Sender name: `Swarangan`
3. Supabase → **Authentication → Emails → Templates → Reset Password**, replace
   the link in the message with:
   ```
   <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a>
   ```
   This lets the link work even when opened on a different device.
4. Test: on the login page click **Forgot your password?**

### C. Later — send from swarangan.sg (needed for "thank you" emails to visitors)

This does **not** require moving the domain away from HostGator. Add the
records wherever the domain's DNS is managed today.

1. Resend → **Domains → Add domain** → `swarangan.sg`. Add the DNS records it
   shows (they sit on a `send.` subdomain and `resend._domainkey`, so the
   current website and mailboxes are unaffected), then **Verify**.
2. Change `RESEND_FROM="Swarangan <enquiries@swarangan.sg>"` (in `.env.local`
   and Vercel), and the Supabase SMTP sender to the same address.
3. Visitors now also receive a short acknowledgement after enquiring.

> **Before cancelling HostGator:** if the info@swarangan.sg mailbox is hosted
> there, it stops working when the plan ends. Move the mailbox first (for
> example Zoho Mail's free plan) — Resend sends email but does not provide an
> inbox. If you later move the domain's nameservers to Vercel, copy every DNS
> record across first, including Resend's and the mail (MX) records.

## 12. Backups

**Download:** Admin → **Backup**, confirm your password, and a ZIP downloads.
Do this monthly and keep the file somewhere private — it contains students' and
parents' contact details. Every download is recorded in the activity log.

**Restoring a backup** (into this project, or a fresh one after running step 2):

```bash
npm run restore -- path/to/swarangan-backup-2026-09-13-1405.zip
```

That is a dry run showing what would change. Add `--confirm` to write. It is
safe to repeat. Photos are not in the ZIP (they stay in Supabase Storage), the
activity log is not written back, and admins are re-added as in step 4.

---

## If something goes wrong

**"The admin panel has not been set up yet"** — one of the five environment
variables is missing. The server log names which.

**"Too many attempts"** — the brute-force protection has engaged. It releases
on its own: after a minute for the first few mistakes, escalating to at most 15
minutes. Signing in successfully resets it.

**Correct password, still "Invalid email or password"** — the account is
probably not on the admin allow-list. Check step 4.

**The Supabase project was paused anyway** — Supabase dashboard → the project
→ **Restore**. Then check the keepalive status on the admin dashboard to see
which ping stopped.
