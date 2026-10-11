# Dinesh M. — Portfolio

A responsive React and Vite portfolio with an animated welcome screen, portfolio sections, and an owner dashboard. The supplied photo is served as an optimized `public/profile.jpg`; the original `public/profile.png` is preserved.

## Run locally

Requirements: Node.js 18 or newer and npm.

In PowerShell, open this folder and run:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173/`). The first screen is the animated welcome; choose **Enter Portfolio**, **Skip welcome**, or press **Escape**.

## Available scripts

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run preview
```

There is no lint or unit-test script configured in this starter. Verify production compilation with `npm.cmd run build`.

## Local preview mode

Without Supabase environment variables, the public portfolio runs in local preview mode using starter records stored in this browser. The owner dashboard at `/dashboard` (also `/admin`) is unavailable until Supabase is configured; local preview does not allow unauthenticated dashboard access or editing. This mode is not a published, owner-protected content system.

The starter content includes only the supplied facts: SRM Vadapalani in Chennai; SRM Vadapalani Gameathon, 5th place, score 60.83; team leader/backend developer Pravin Raj; and team member Theeban. Missing personal details, skills, project facts, and contact information are left for the owner to fill in.

## Optional Supabase backend

The app uses Supabase Auth, Postgres, Storage, and row-level security when configured. Private records are filtered by database RLS; private attachments use a private bucket and short-lived signed URLs for the authenticated owner. The browser uses only the project's public anon key. **Never add a service-role key or password to Vite variables or source code.**

1. Create a Supabase project and an owner user in **Authentication → Users**. Keep email confirmation enabled as appropriate for your account.
2. In **SQL Editor**, run [`supabase/setup.sql`](./supabase/setup.sql). Replace `REPLACE_WITH_OWNER_EMAIL` in its final insert with the owner's exact Auth email before running it. The SQL grants owner privileges only to that Auth user.
3. Copy `.env.example` to `.env.local` and fill in:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
   ```

   Both values are available in the Supabase project's API settings. They are public client configuration; keep database access protected by the included RLS policies. Never use `service_role`.
4. Restart the dev server and open `/dashboard` (or `/admin`). Sign in with the owner user created in step 1.
5. To publish, add the same two `VITE_` variables to the hosting provider's environment settings and redeploy. Keep `.env.local` out of source control.

The SQL creates a public portfolio-files bucket and a private bucket. Public record attachments go to the public bucket; private attachments are stored privately. When changing an existing file-backed record from public to private, the app copies the file to private storage and removes its old public copy before updating the record. Supabase setup and live RLS behavior cannot be validated until a real project and owner account are configured.

## Deployment

This is a static Vite site and can be deployed on a free static-hosting tier such as Netlify, Vercel, or Cloudflare Pages:

- Build command: `npm run build`
- Publish/output directory: `dist`
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the host's environment settings only when enabling Supabase.
- For Vercel, set **Root Directory** to the folder containing this `package.json` and `index.html` (the project root). The included `vercel.json` sets the Vite framework, build command, output directory, and dashboard-route rewrites.

The repository does not contain a Vercel project link or deployment credentials. A Vercel account connection and the correct project root are required to deploy it.
