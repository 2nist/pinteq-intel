# Pinteq Development Next Steps

## Immediate

1. Put this folder under Git and connect it to a GitHub repo.
2. Import the GitHub repo into Vercel.
3. In Vercel, use `npm run build` as the build command and `dist` as the output directory.
4. Add `pinteq.co` and `www.pinteq.co` in Vercel Domains, then update DNS at the registrar.
5. Decide what should be public versus private before publishing the OSINT library, workflow diagrams, proposal material, or client portal views.

## Recommended Platform

Use Vercel for the public marketing site and application frontend. It is the right fit now because the current site is static, deployment is simple, and it leaves a path to Next.js, serverless functions, authentication, and database-backed portal features later.

For the client portal, do not keep using static mock login logic or hardcoded users. Move portal functionality behind real authentication before handling client data.

## Recommended Tech Stack

- Public site: Next.js on Vercel once content stabilizes.
- Styling: Tailwind CSS or plain CSS modules, using the current visual direction as the brand baseline.
- Auth: Clerk, Auth0, or Supabase Auth.
- Database: Supabase Postgres or Neon Postgres.
- File storage: Supabase Storage, Vercel Blob, or S3-compatible storage.
- Case/client portal: Next.js app router with protected routes.
- Internal OSINT knowledge base: database-backed source library with tagging, notes, legal/ethical status, jurisdiction, confidence, and update dates.

## Content Priorities

1. Clarify the public offer: who Pinteq serves, what outcomes it produces, and what the first paid engagement looks like.
2. Convert the Charles Ayres II proposal into a meeting-ready page or PDF summary.
3. Separate public trust-building content from private operational intelligence material.
4. Define portal objects: clients, matters, subjects, sources, findings, reports, tasks, invoices, and secure uploads.
5. Add compliance language around lawful OSINT, data handling, retention, and client authorization.
