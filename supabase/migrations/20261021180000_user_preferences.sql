-- Persistent SONA preferences for each signed-in student.
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  assistant_name text not null default 'SONA' check (char_length(assistant_name) between 1 and 40),
  study_level text not null default 'University student' check (char_length(study_level) <= 80),
  preferred_language text not null default 'English' check (char_length(preferred_language) <= 40),
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.user_preferences enable row level security;
drop policy if exists "Users manage their own preferences" on public.user_preferences;
create policy "Users manage their own preferences" on public.user_preferences
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
revoke all on public.user_preferences from anon;
grant select, insert, update, delete on public.user_preferences to authenticated;
drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at before update on public.user_preferences
for each row execute function public.set_updated_at();
