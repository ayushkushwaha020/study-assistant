-- StudyOS initial user-owned data schema.
-- Apply in Supabase SQL editor or with the Supabase CLI before enabling cloud sync.

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 240),
  subject text not null default 'Personal' check (char_length(subject) <= 80),
  duration_minutes integer not null default 20 check (duration_minutes between 1 and 600),
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  is_completed boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_created_idx on public.tasks (user_id, created_at desc);
create index if not exists tasks_user_due_idx on public.tasks (user_id, due_at) where due_at is not null;

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  color text not null default 'lilac' check (color in ('lilac', 'mint', 'peach', 'blue')),
  target_minutes_per_week integer not null default 120 check (target_minutes_per_week between 0 and 10080),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index if not exists subjects_user_idx on public.subjects (user_id);

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text not null default 'General' check (char_length(subject_name) <= 80),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  session_type text not null default 'focus' check (session_type in ('focus', 'revision', 'break', 'quiz')),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  constraint study_sessions_end_after_start check (ended_at is null or ended_at >= started_at)
);
create index if not exists study_sessions_user_started_idx on public.study_sessions (user_id, started_at desc);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 240),
  content text not null default '' check (char_length(content) <= 100000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  question text not null check (char_length(trim(question)) between 1 and 4000),
  answer text not null check (char_length(trim(answer)) between 1 and 8000),
  next_review_at timestamptz not null default now(),
  interval_days integer not null default 0 check (interval_days between 0 and 36500),
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor between 1.30 and 4.00),
  repetitions integer not null default 0 check (repetitions between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists flashcards_user_review_idx on public.flashcards (user_id, next_review_at);

-- Enable row-level security on every user-owned table.
alter table public.tasks enable row level security;
alter table public.subjects enable row level security;
alter table public.study_sessions enable row level security;
alter table public.notes enable row level security;
alter table public.flashcards enable row level security;

-- Policies scope every operation to the signed-in owner. UPDATE has both USING and WITH CHECK.
drop policy if exists "Users manage their own tasks" on public.tasks;
create policy "Users manage their own tasks" on public.tasks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own subjects" on public.subjects;
create policy "Users manage their own subjects" on public.subjects
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own study sessions" on public.study_sessions;
create policy "Users manage their own study sessions" on public.study_sessions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own notes" on public.notes;
create policy "Users manage their own notes" on public.notes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their own flashcards" on public.flashcards;
create policy "Users manage their own flashcards" on public.flashcards
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Least-privilege table grants. RLS remains the row-level boundary.
revoke all on public.tasks, public.subjects, public.study_sessions, public.notes, public.flashcards from anon;
grant select, insert, update, delete on public.tasks, public.subjects, public.study_sessions, public.notes, public.flashcards to authenticated;

-- Keep updated_at consistent for edited rows.
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

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes
for each row execute function public.set_updated_at();
drop trigger if exists flashcards_set_updated_at on public.flashcards;
create trigger flashcards_set_updated_at before update on public.flashcards
for each row execute function public.set_updated_at();

-- Do not expose this trigger helper to API roles.
revoke all on function public.set_updated_at() from public, anon, authenticated;
