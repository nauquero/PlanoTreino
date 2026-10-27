-- ===========================================================
-- Perfil (nome, genero, data de nascimento, ciclo menstrual)
-- Cola no Supabase -> SQL Editor -> Run. E seguro repetir; nao apaga dados.
-- ===========================================================
alter table public.profiles add column if not exists profile_data jsonb not null default '{}'::jsonb;

-- leitura (devolve tambem o perfil)
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
    'version', 5,
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

grant execute on function public.get_data(text, text) to anon;

-- guardar o perfil
create or replace function public.set_profile(p_profile text, p_pin text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare r text := public.auth_pin(p_profile, p_pin);
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or length(p_data::text) > 4000 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  update public.profiles set profile_data = p_data where id = p_profile;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.set_profile(text, text, jsonb) to anon;
