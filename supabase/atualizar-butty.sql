-- ===========================================================
-- Butty: humor diario ("Como te sentiste hoje?") e check-in de alimentacao ("Comi bem hoje?").
-- Cola no Supabase -> SQL Editor -> Run. E seguro repetir; nao apaga dados.
-- ===========================================================

create table if not exists public.mood_logs (
  profile text not null references public.profiles(id) on delete cascade,
  day date not null,
  mood int not null check (mood between 1 and 5),
  primary key (profile, day)
);

create table if not exists public.meal_checkins (
  profile text not null references public.profiles(id) on delete cascade,
  day date not null,
  ate int not null check (ate between 0 and 2), -- 0 = nem por isso, 1 = mais ou menos, 2 = comi bem
  primary key (profile, day)
);

alter table public.mood_logs enable row level security;
alter table public.meal_checkins enable row level security;

-- leitura (devolve tambem o humor e a alimentacao)
create or replace function public.get_data(p_profile text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  return jsonb_build_object(
    'ok', true,
    'version', 6,
    'profile', coalesce((select profile_data from public.profiles where id = p_profile), '{}'::jsonb),
    'measurements', coalesce((
      select jsonb_agg(to_jsonb(m) - 'profile' order by m.date)
      from public.measurements m where m.profile = p_profile), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'exercise', l.exercise, 'date', l.date,
                                          'sets', l.sets, 'reps', l.reps, 'weight', l.weight,
                                          'minutes', l.minutes, 'distance', l.distance, 'note', l.note,
                                          'sets_json', l.sets_json)
                       order by l.date desc, l.id desc)
      from public.workout_logs l where l.profile = p_profile), '[]'::jsonb),
    'gym_days', coalesce((
      select jsonb_agg(g.day order by g.day)
      from public.gym_days g where g.profile = p_profile), '[]'::jsonb),
    'sleep', coalesce((
      select jsonb_agg(jsonb_build_object('day', s.day, 'hours', s.hours, 'quality', s.quality, 'bed_time', s.bed_time, 'wake_time', s.wake_time) order by s.day desc)
      from public.sleep_logs s where s.profile = p_profile), '[]'::jsonb),
    'moods', coalesce((
      select jsonb_agg(jsonb_build_object('day', mo.day, 'mood', mo.mood) order by mo.day desc)
      from public.mood_logs mo where mo.profile = p_profile), '[]'::jsonb),
    'meals', coalesce((
      select jsonb_agg(jsonb_build_object('day', me.day, 'ate', me.ate) order by me.day desc)
      from public.meal_checkins me where me.profile = p_profile), '[]'::jsonb),
    'custom_exercises', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'group_key', c.group_key, 'name', c.name, 'kind', c.kind,
                                          'effort', c.effort, 'distance_unit', c.distance_unit) order by c.id)
      from public.custom_exercises c where c.profile = p_profile), '[]'::jsonb),
    'goals', coalesce((
      select jsonb_agg(jsonb_build_object('month', g.month, 'days', g.days) order by g.month)
      from public.monthly_goals g where g.profile = p_profile), '[]'::jsonb)
  );
end;
$$;

-- guardar o humor do dia
create or replace function public.set_mood(p_profile text, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r text := public.auth_pin(p_profile, p_pin);
  d date := (p_entry->>'day')::date;
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  if d > public.today_pt() then return jsonb_build_object('ok', false, 'error', 'future_date'); end if;
  insert into public.mood_logs (profile, day, mood)
  values (p_profile, d, (p_entry->>'mood')::int)
  on conflict (profile, day) do update set mood = excluded.mood;
  return jsonb_build_object('ok', true);
end;
$$;

-- guardar o check-in de alimentacao do dia
create or replace function public.set_meal(p_profile text, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r text := public.auth_pin(p_profile, p_pin);
  d date := (p_entry->>'day')::date;
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  if d > public.today_pt() then return jsonb_build_object('ok', false, 'error', 'future_date'); end if;
  insert into public.meal_checkins (profile, day, ate)
  values (p_profile, d, (p_entry->>'ate')::int)
  on conflict (profile, day) do update set ate = excluded.ate;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.get_data(text, text)        to anon;
grant execute on function public.set_mood(text, text, jsonb) to anon;
grant execute on function public.set_meal(text, text, jsonb) to anon;
