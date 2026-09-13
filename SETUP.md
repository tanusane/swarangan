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
