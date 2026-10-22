# Tap C9 — GitHub Pages + Supabase

This repository is the frontend for Tap C9, a blue-and-white NFC digital business card platform.

## Files
- `index.html` — landing page, directory, and admin UI
- `styles.css` — responsive styling
- `app.js` — Supabase connection, public profiles, authentication, and profile editor
- `supabase-schema.sql` — database tables, trigger, and Row Level Security policies

## A. Create the Supabase project and schema
1. Open your Supabase project.
2. Go to **SQL Editor** → **New query**.
3. Open `supabase-schema.sql` from this repository, copy all of it, paste into the SQL Editor, and click **Run**.
4. In Supabase, go to **Project Settings → API** (or **Connect**, depending on dashboard version). Copy the **Project URL** and the **publishable key**. The legacy `anon` key is also a browser key if your dashboard shows it. Never use `service_role` or a secret key in the frontend.

## B. Configure the frontend
1. Open `app.js` in GitHub and click the pencil (Edit).
2. Replace only these two placeholder values near the top:
   - `PASTE_SUPABASE_PROJECT_URL_HERE`
   - `PASTE_SUPABASE_PUBLISHABLE_KEY_HERE`
3. Commit changes. The URL and publishable/anon key are intended for public frontend use; database security is enforced by RLS. Do not paste passwords or secret keys.

## C. Create your admin login securely
1. In Supabase, go to **Authentication → Users**.
2. Click **Add user** / **Create new user** and create your own admin email and a strong unique password. Do not share that password with anyone.
3. Copy the user's **UUID** from the user row.
4. Open Supabase **SQL Editor → New query**, replace `YOUR-AUTH-USER-UUID-HERE` in this one-line SQL with the UUID you copied, then run it:

```sql
insert into public.admin_users (user_id)
values ('YOUR-AUTH-USER-UUID-HERE');
```

This grants admin permissions only to the specific Supabase user you added. Do not make a public sign-up form for admin accounts. If the SQL reports a duplicate key, that user is already an admin.

## D. Publish using GitHub Pages
1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose branch `main`, folder `/(root)`, then click **Save**.
4. Wait for GitHub Pages to finish. The public URL will look like `https://YOUR-GITHUB-USERNAME.github.io/tap-c9/`.

## E. Use the admin dashboard
1. Open the published site.
2. Scroll to the footer and click **Admin**.
3. Sign in using the user created in Supabase Authentication.
4. Click **New profile**, fill in the details, choose whether it should be published, and click **Save profile**.
5. A published profile link looks like `https://YOUR-GITHUB-USERNAME.github.io/tap-c9/?p=client-slug`. Write that URL to the NFC tag. Do not change the slug after programming the tag unless you also update the tag's URL.

## Important notes
- Changes saved to Supabase appear on the next page load. A client does not need a new NFC tag if the URL remains the same.
- This starter uses a publicly accessible image URL for profile photos. Do not use private photos or URLs that require login. Supabase Storage upload can be added as a later step.
- The contact directory displays only profiles marked **Published**. Published profile contact details are public by design. Obtain client consent before publishing personal contact information.
- If you update a slug, the old NFC link will no longer point to that profile.
- Use HTTPS social links. Avoid putting private information in public profiles.
- GitHub Pages is static hosting. Supabase provides authentication and database operations.
