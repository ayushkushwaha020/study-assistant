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
