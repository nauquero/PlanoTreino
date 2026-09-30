-- =====================================================================
-- Plano de Treino — configuração da base de dados (Supabase / Postgres)
--
-- Como usar: Supabase → SQL Editor → New query → cola este ficheiro
-- inteiro → Run. Pode ser executado mais do que uma vez sem estragar
-- dados existentes.
--
-- Segurança:
--  * As tabelas têm RLS ligado e NENHUMA policy: a chave pública (anon)
--    não consegue ler nem escrever nelas diretamente.
--  * Todo o acesso passa pelas funções abaixo, que exigem perfil + PIN.
--  * Os PINs ficam só na base de dados (com hash). Não estão no site.
--  * 5 PINs errados seguidos bloqueiam o perfil durante 15 minutos.
--
-- Os PINs NÃO são definidos aqui (para não ficarem no GitHub).
-- Depois de correr este ficheiro, corre a parte "DEFINIR PINs" do README.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- tabelas ----------

create table if not exists public.profiles (
  id              text primary key,
  name            text not null,
  pin_hash        text,
  failed_attempts int  not null default 0,
  locked_until    timestamptz
);

insert into public.profiles (id, name)
values ('mariana', 'Mariana'), ('elia', 'Élia')
on conflict (id) do nothing;

create table if not exists public.measurements (
  profile   text not null references public.profiles(id),
  date      date not null,
  weight    numeric,
  bmi       numeric,
  body_fat  numeric,
  sub_fat   numeric,
  visceral  numeric,
  water     numeric,
  muscle    numeric,
  bone      numeric,
  bmr       numeric,
  primary key (profile, date)
);

create table if not exists public.workout_logs (
  id        bigint generated always as identity primary key,
  profile   text not null references public.profiles(id),
  exercise  text not null,
  date      date not null,
  sets      numeric not null,
  reps      numeric not null,
  weight    numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists workout_logs_profile_idx on public.workout_logs (profile, exercise, date desc);

create table if not exists public.gym_days (
  profile text not null references public.profiles(id),
  day     date not null,
  primary key (profile, day)
);

-- Medições iniciais (29/09/2026)
insert into public.measurements (profile, date, weight, bmi, body_fat, sub_fat, visceral, water, muscle, bone, bmr) values
  ('mariana', '2026-09-29', 52.90, 19.9, 15.9, 14.9, 2, 57.7, 41.80, 2.67, 1331),
  ('elia',    '2026-09-29', 68.00, 26.6, 35.7, 32.2, 9, 44.1, 41.10, 2.62, 1314)
on conflict (profile, date) do nothing;

-- ---------- segurança das tabelas ----------

alter table public.profiles     enable row level security;
alter table public.measurements enable row level security;
alter table public.workout_logs enable row level security;
alter table public.gym_days     enable row level security;

revoke all on public.profiles, public.measurements, public.workout_logs, public.gym_days
  from anon, authenticated;

-- ---------- autenticação por PIN (interna) ----------
-- Devolve 'ok', 'invalid_pin', 'locked' ou 'not_configured'.
-- Não levanta exceções de propósito: assim o contador de falhas é gravado.

create or replace function public.auth_pin(p_profile text, p_pin text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  prof public.profiles;
begin
  select * into prof from public.profiles where id = p_profile for update;
  if not found then return 'invalid_pin'; end if;
  if prof.pin_hash is null then return 'not_configured'; end if;
  if prof.locked_until is not null and prof.locked_until > now() then return 'locked'; end if;

  if p_pin is not null and prof.pin_hash = crypt(p_pin, prof.pin_hash) then
    update public.profiles set failed_attempts = 0, locked_until = null where id = p_profile;
    return 'ok';
  end if;

  if prof.failed_attempts + 1 >= 5 then
    update public.profiles set failed_attempts = 0, locked_until = now() + interval '15 minutes' where id = p_profile;
    return 'locked';
  end if;
  update public.profiles set failed_attempts = failed_attempts + 1 where id = p_profile;
  return 'invalid_pin';
end;
$$;

revoke execute on function public.auth_pin(text, text) from public, anon, authenticated;

-- ---------- funções expostas ao site ----------

create or replace function public.login(p_profile text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  return jsonb_build_object('ok', true);
end;
$$;

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
    'measurements', coalesce((
      select jsonb_agg(to_jsonb(m) - 'profile' order by m.date)
      from public.measurements m where m.profile = p_profile), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object('exercise', l.exercise, 'date', l.date,
                                          'sets', l.sets, 'reps', l.reps, 'weight', l.weight)
                       order by l.date desc, l.id desc)
      from public.workout_logs l where l.profile = p_profile), '[]'::jsonb),
    'gym_days', coalesce((
      select jsonb_agg(g.day order by g.day)
      from public.gym_days g where g.profile = p_profile), '[]'::jsonb)
  );
end;
$$;

create or replace function public.add_measurement(p_profile text, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
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

create or replace function public.add_log(p_profile text, p_pin text, p_entry jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  insert into public.workout_logs (profile, exercise, date, sets, reps, weight)
  values (
    p_profile, p_entry->>'exercise', (p_entry->>'date')::date,
    (p_entry->>'sets')::numeric, (p_entry->>'reps')::numeric, (p_entry->>'weight')::numeric
  );
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
  insert into public.gym_days (profile, day) values (p_profile, p_day);
  return jsonb_build_object('ok', true, 'on', true);
end;
$$;

grant execute on function public.login(text, text)                 to anon;
grant execute on function public.get_data(text, text)              to anon;
grant execute on function public.add_measurement(text, text, jsonb) to anon;
grant execute on function public.add_log(text, text, jsonb)        to anon;
grant execute on function public.toggle_gym_day(text, text, date)  to anon;
