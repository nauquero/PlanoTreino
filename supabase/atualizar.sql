-- Plano de Treino: ficheiro de atualização.

-- =====================================================================
-- ATUALIZAÇÃO (cola tudo no SQL Editor e carrega em Run)
-- Seguro para correr mais do que uma vez. NÃO apaga dados nem PINs.
-- Inclui: apagar/corrigir, desportos, datas seguras, login por número,
-- séries por dia, sono, exercícios personalizados e limpeza de marcas futuras.
-- =====================================================================

-- ---------- tabelas e colunas ----------
alter table public.workout_logs alter column sets   drop not null;
alter table public.workout_logs alter column reps   drop not null;
alter table public.workout_logs alter column weight drop not null;
alter table public.workout_logs add column if not exists minutes   numeric;
alter table public.workout_logs add column if not exists distance  numeric;
alter table public.workout_logs add column if not exists note      text;
alter table public.workout_logs add column if not exists sets_json jsonb;

alter table public.profiles add column if not exists login_number text;
alter table public.profiles add column if not exists focus  text not null default 'saude';
alter table public.profiles add column if not exists cardio text not null default 'bicicleta';
create unique index if not exists profiles_login_number_key on public.profiles (login_number);
-- números de utilizador iniciais (só se ainda não tiverem)
update public.profiles set login_number = '1', focus = 'hipertrofia', cardio = 'escadas'   where id = 'mariana' and login_number is null;
update public.profiles set login_number = '2', focus = 'definicao',   cardio = 'bicicleta' where id = 'elia'    and login_number is null;

create table if not exists public.sleep_logs (
  profile text not null references public.profiles(id),
  day     date not null,
  hours   numeric not null check (hours > 0 and hours <= 16),
  quality int not null check (quality between 1 and 5),
  primary key (profile, day)
);

create table if not exists public.custom_exercises (
  id            bigint generated always as identity primary key,
  profile       text not null references public.profiles(id),
  group_key     text not null,
  name          text not null,
  kind          text not null check (kind in ('strength', 'time', 'hold')),
  effort        text not null check (effort in ('alto', 'medio-alto', 'medio', 'baixo')),
  distance_unit text check (distance_unit in ('km', 'm')),
  created_at    timestamptz not null default now()
);
create unique index if not exists custom_exercises_unique on public.custom_exercises (profile, group_key, lower(name));

alter table public.sleep_logs       enable row level security;
alter table public.custom_exercises enable row level security;
revoke all on public.sleep_logs, public.custom_exercises from anon, authenticated;

-- ---------- "hoje" em Portugal ----------
create or replace function public.today_pt()
returns date language sql stable as $$ select (now() at time zone 'Europe/Lisbon')::date $$;
revoke execute on function public.today_pt() from public, anon, authenticated;

-- limpeza: dias marcados no futuro (feitos antes de o site bloquear datas futuras)
delete from public.gym_days where day > public.today_pt();

-- ---------- login por número de utilizador ----------
create or replace function public.login_user(p_number text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  pid  text;
  r    text;
  prof public.profiles;
begin
  select id into pid from public.profiles where login_number = trim(p_number);
  if pid is null then return jsonb_build_object('ok', false, 'error', 'invalid_pin'); end if;
  r := public.auth_pin(pid, p_pin);
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  select * into prof from public.profiles where id = pid;
  return jsonb_build_object('ok', true, 'profile', jsonb_build_object(
    'id', prof.id, 'name', prof.name, 'focus', prof.focus, 'cardio', prof.cardio));
end;
$$;

-- ---------- leitura ----------
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
    'version', 3,
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
      select jsonb_agg(jsonb_build_object('day', s.day, 'hours', s.hours, 'quality', s.quality) order by s.day desc)
      from public.sleep_logs s where s.profile = p_profile), '[]'::jsonb),
    'custom_exercises', coalesce((
      select jsonb_agg(jsonb_build_object('id', c.id, 'group_key', c.group_key, 'name', c.name, 'kind', c.kind,
                                          'effort', c.effort, 'distance_unit', c.distance_unit) order by c.id)
      from public.custom_exercises c where c.profile = p_profile), '[]'::jsonb)
  );
end;
$$;

-- ---------- medições ----------
create or replace function public.add_measurement(p_profile text, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  if (p_entry->>'date')::date > public.today_pt() then
    return jsonb_build_object('ok', false, 'error', 'future_date');
  end if;
  insert into public.measurements (profile, date, weight, bmi, body_fat, sub_fat, visceral, water, muscle, bone, bmr)
  values (
    p_profile, (p_entry->>'date')::date,
    (p_entry->>'weight')::numeric,   (p_entry->>'bmi')::numeric,
    (p_entry->>'body_fat')::numeric, (p_entry->>'sub_fat')::numeric,
    (p_entry->>'visceral')::numeric, (p_entry->>'water')::numeric,
    (p_entry->>'muscle')::numeric,   (p_entry->>'bone')::numeric,
    (p_entry->>'bmr')::numeric
  )
  on conflict (profile, date) do update set
    weight = excluded.weight, bmi = excluded.bmi, body_fat = excluded.body_fat,
    sub_fat = excluded.sub_fat, visceral = excluded.visceral, water = excluded.water,
    muscle = excluded.muscle, bone = excluded.bone, bmr = excluded.bmr;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.delete_measurement(p_profile text, p_pin text, p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  delete from public.measurements where profile = p_profile and date = p_date;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- registos de treino ----------
create or replace function public.add_log(p_profile text, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r text := public.auth_pin(p_profile, p_pin);
  d date := (p_entry->>'date')::date;
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  if d > public.today_pt() then return jsonb_build_object('ok', false, 'error', 'future_date'); end if;
  insert into public.workout_logs (profile, exercise, date, sets, reps, weight, minutes, distance, note, sets_json)
  values (
    p_profile, left(p_entry->>'exercise', 60), d,
    (p_entry->>'sets')::numeric, (p_entry->>'reps')::numeric, (p_entry->>'weight')::numeric,
    (p_entry->>'minutes')::numeric, (p_entry->>'distance')::numeric, left(p_entry->>'note', 60),
    nullif(p_entry->'sets_json', 'null'::jsonb)
  );
  -- um registo marca automaticamente o dia como dia de treino
  insert into public.gym_days (profile, day) values (p_profile, d) on conflict do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.update_log(p_profile text, p_pin text, p_id bigint, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r text := public.auth_pin(p_profile, p_pin);
  d date := (p_entry->>'date')::date;
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  if d > public.today_pt() then return jsonb_build_object('ok', false, 'error', 'future_date'); end if;
  update public.workout_logs set
    date = d,
    sets = (p_entry->>'sets')::numeric, reps = (p_entry->>'reps')::numeric, weight = (p_entry->>'weight')::numeric,
    minutes = (p_entry->>'minutes')::numeric, distance = (p_entry->>'distance')::numeric,
    note = left(p_entry->>'note', 60),
    sets_json = nullif(p_entry->'sets_json', 'null'::jsonb)
  where id = p_id and profile = p_profile;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  insert into public.gym_days (profile, day) values (p_profile, d) on conflict do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.delete_log(p_profile text, p_pin text, p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  delete from public.workout_logs where id = p_id and profile = p_profile;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.toggle_gym_day(p_profile text, p_pin text, p_day date)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  delete from public.gym_days where profile = p_profile and day = p_day;
  if found then return jsonb_build_object('ok', true, 'on', false); end if;
  if p_day > public.today_pt() then return jsonb_build_object('ok', false, 'error', 'future_date'); end if;
  insert into public.gym_days (profile, day) values (p_profile, p_day);
  return jsonb_build_object('ok', true, 'on', true);
end;
$$;

-- ---------- sono ----------
create or replace function public.set_sleep(p_profile text, p_pin text, p_entry jsonb)
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
  insert into public.sleep_logs (profile, day, hours, quality)
  values (p_profile, d, (p_entry->>'hours')::numeric, (p_entry->>'quality')::int)
  on conflict (profile, day) do update set hours = excluded.hours, quality = excluded.quality;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.delete_sleep(p_profile text, p_pin text, p_day date)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  delete from public.sleep_logs where profile = p_profile and day = p_day;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- exercícios personalizados ----------
create or replace function public.add_custom_exercise(p_profile text, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r text := public.auth_pin(p_profile, p_pin);
  n text := trim(p_entry->>'name');
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  if n is null or char_length(n) < 2 or char_length(n) > 40 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  if exists (select 1 from public.custom_exercises
             where profile = p_profile and group_key = p_entry->>'group_key' and lower(name) = lower(n)) then
    return jsonb_build_object('ok', false, 'error', 'duplicate');
  end if;
  insert into public.custom_exercises (profile, group_key, name, kind, effort, distance_unit)
  values (p_profile, left(p_entry->>'group_key', 30), n, p_entry->>'kind', p_entry->>'effort',
          nullif(p_entry->>'distance_unit', ''));
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.delete_custom_exercise(p_profile text, p_pin text, p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  delete from public.custom_exercises where id = p_id and profile = p_profile;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- permissões ----------
grant execute on function public.login(text, text)                       to anon;
grant execute on function public.login_user(text, text)                  to anon;
grant execute on function public.get_data(text, text)                    to anon;
grant execute on function public.add_measurement(text, text, jsonb)      to anon;
grant execute on function public.delete_measurement(text, text, date)    to anon;
grant execute on function public.add_log(text, text, jsonb)              to anon;
grant execute on function public.update_log(text, text, bigint, jsonb)   to anon;
grant execute on function public.delete_log(text, text, bigint)          to anon;
grant execute on function public.toggle_gym_day(text, text, date)        to anon;
grant execute on function public.set_sleep(text, text, jsonb)            to anon;
grant execute on function public.delete_sleep(text, text, date)          to anon;
grant execute on function public.add_custom_exercise(text, text, jsonb)  to anon;
grant execute on function public.delete_custom_exercise(text, text, bigint) to anon;
