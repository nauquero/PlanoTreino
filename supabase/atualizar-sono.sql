-- ===========================================================
-- Sono com hora de deitar e de acordar
-- Cola no Supabase -> SQL Editor -> Run. E seguro repetir; nao apaga dados.
-- ===========================================================
alter table public.sleep_logs add column if not exists bed_time  text check (bed_time  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.sleep_logs add column if not exists wake_time text check (wake_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- leitura (devolve tambem as horas de deitar e acordar)
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
    'version', 4,
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

-- guardar o sono
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
  insert into public.sleep_logs (profile, day, hours, quality, bed_time, wake_time)
  values (p_profile, d, (p_entry->>'hours')::numeric, (p_entry->>'quality')::int,
          nullif(p_entry->>'bed_time', ''), nullif(p_entry->>'wake_time', ''))
  on conflict (profile, day) do update set hours = excluded.hours, quality = excluded.quality,
    bed_time = excluded.bed_time, wake_time = excluded.wake_time;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.get_data(text, text)       to anon;
grant execute on function public.set_sleep(text, text, jsonb) to anon;
