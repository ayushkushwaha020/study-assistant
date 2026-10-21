# StudyOS — AI Study Assistant

A responsive student productivity dashboard built with Next.js and React. It includes a study task list, local persistence, a focus timer, subject progress cards, and an optional server-side AI tutor endpoint.

## Features

- Responsive dashboard for desktop and mobile
- Add, complete, and remove tasks; task state persists in the current browser
- Focus timer with pause, resume, and reset
- Subject progress overview and study shortcuts
- AI tutor API route with input validation, request timeout, and server-only API key
- Clear empty-configuration behavior: planner and focus tools still work without an AI key
- TypeScript, strict type checking, and deployment-friendly Next.js configuration

## Stack

- Next.js App Router + React + TypeScript
- Supabase Auth and PostgreSQL (optional until project environment variables are configured)
- Lucide icons
- Optional OpenAI-compatible Chat Completions endpoint
- Vercel recommended for hosting
- Supabase recommended for the next phase: real accounts, database, and synchronized student data

## Run locally

Requires Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. AI tutoring requires a valid `OPENAI_API_KEY` in `.env.local`. Email sign-in and cloud sync require `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, plus the SQL migration in `supabase/migrations/`. Never expose provider secrets through a `NEXT_PUBLIC_*` variable or commit secrets.

## Configure Supabase cloud accounts

1. Create a Supabase project in your chosen organization and select a nearby region such as \`ap-south-1\` when available.
2. Open the Supabase SQL Editor and run \`supabase/migrations/20261021000000_initial_student_data.sql\` from this repository.
3. In Project Settings / Connect, copy the Project URL and publishable key.
4. Set \`NEXT_PUBLIC_SUPABASE_URL\` and \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\` in \`.env.local\` and in Vercel Project Settings → Environment Variables for Preview and Production.
5. In Supabase Authentication → URL Configuration, set your deployed app URL as the Site URL and add the exact callback URLs \`https://YOUR-DEPLOYMENT-DOMAIN/auth/callback\` and \`http://localhost:3000/auth/callback\` to Redirect URLs.
6. Redeploy after changing Vercel environment variables, then test account creation, email confirmation, sign-in, task create/complete/delete, and sign-out.
7. Check the database's security advisors and verify that two separate test users cannot read or modify each other's records.

The migration creates tasks, subjects, study sessions, notes, and flashcards tables with ownership columns, constraints, indexes, row-level security policies, and least-privilege grants. The dashboard currently synchronizes task records when a user is signed in. Other data tables are schema foundations for upcoming features.

**Never put a Supabase secret/service-role key in a \`NEXT_PUBLIC_*\` variable.** This app uses the publishable key with authenticated user sessions and relies on RLS for row isolation.

## Checks

```bash
npm run typecheck
npm run build
```

## Deploy on Vercel

1. Import `ayushkushwaha020/study-assistant` at https://vercel.com/new.
2. Keep the root directory at the repository root.
3. Add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in Project Settings → Environment Variables if you want live AI tutoring.
4. Deploy. Vercel will create preview deployments for changes and production deployments from the configured production branch.
5. Test the deployed URL on mobile and desktop before sharing it publicly.

## Current data and production-readiness notes

The task list currently supports browser-local persistence. Supabase email authentication and a row-level-secured database schema are included as the cloud-sync foundation, but they become active only after you configure a Supabase project and apply the migration. Subject analytics and streak values are illustrative UI data. Before a public multi-user launch, finish cloud task synchronization, validate all server inputs, configure rate limiting for AI requests, and add privacy/retention and account-deletion flows.

The AI route keeps the API key on the server, validates message length, uses a request timeout, avoids caching answers, and returns safe user-facing errors. Production use should add per-user quotas, abuse monitoring, and provider spending limits.

## Suggested next phase

1. Finish Supabase task synchronization and verify Auth end-to-end
2. Apply and audit the database migration and RLS policies
3. PDF upload and document extraction
4. Flashcards, quiz attempts, and spaced repetition
5. Calendar integration with explicit OAuth consent
6. End-to-end tests, rate limiting, and monitoring

## License

Choose and add a license before accepting external contributions.
