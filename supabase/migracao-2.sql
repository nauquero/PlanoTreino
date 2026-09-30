-- Atualização 2 do Plano de Treino: cola tudo no SQL Editor do Supabase e carrega em Run.

-- ===== MIGRAÇÃO 2 =====
-- Apagar/corrigir registos, desportos (minutos/distância), datas futuras bloqueadas.
-- Seguro para correr mais do que uma vez. Não mexe nos PINs nem nos dados.

alter table public.workout_logs alter column sets   drop not null;
alter table public.workout_logs alter column reps   drop not null;
alter table public.workout_logs alter column weight drop not null;
alter table public.workout_logs add column if not exists minutes  numeric;
alter table public.workout_logs add column if not exists distance numeric;
alter table public.workout_logs add column if not exists note     text;

-- "hoje" em Portugal (o servidor está em UTC)
create or replace function public.today_pt()
returns date language sql stable as $$ select (now() at time zone 'Europe/Lisbon')::date $$;
revoke execute on function public.today_pt() from public, anon, authenticated;

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
    'version', 2,
    'measurements', coalesce((
      select jsonb_agg(to_jsonb(m) - 'profile' order by m.date)
      from public.measurements m where m.profile = p_profile), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object('id', l.id, 'exercise', l.exercise, 'date', l.date,
                                          'sets', l.sets, 'reps', l.reps, 'weight', l.weight,
                                          'minutes', l.minutes, 'distance', l.distance, 'note', l.note)
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
  if (select count(*) from public.measurements where profile = p_profile) <= 1 then
    return jsonb_build_object('ok', false, 'error', 'last_measurement');
  end if;
  delete from public.measurements where profile = p_profile and date = p_date;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end;
$$;

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
  insert into public.workout_logs (profile, exercise, date, sets, reps, weight, minutes, distance, note)
  values (
    p_profile, p_entry->>'exercise', d,
    (p_entry->>'sets')::numeric, (p_entry->>'reps')::numeric, (p_entry->>'weight')::numeric,
    (p_entry->>'minutes')::numeric, (p_entry->>'distance')::numeric, left(p_entry->>'note', 60)
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
    note = left(p_entry->>'note', 60)
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

grant execute on function public.login(text, text)                  to anon;
grant execute on function public.get_data(text, text)               to anon;
grant execute on function public.add_measurement(text, text, jsonb) to anon;
grant execute on function public.delete_measurement(text, text, date) to anon;
grant execute on function public.add_log(text, text, jsonb)         to anon;
grant execute on function public.update_log(text, text, bigint, jsonb) to anon;
grant execute on function public.delete_log(text, text, bigint)     to anon;
grant execute on function public.toggle_gym_day(text, text, date)   to anon;
