-- Plano de Treino: acrescenta a META MENSAL (cola tudo no SQL Editor e carrega em Run).
-- Para quem já correu o ficheiro atualizar.sql anterior. Seguro para repetir.

create table if not exists public.monthly_goals (
  profile text not null references public.profiles(id),
  month   text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  days    int  not null check (days between 1 and 31),
  primary key (profile, month)
);
alter table public.monthly_goals enable row level security;
revoke all on public.monthly_goals from anon, authenticated;

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
      select jsonb_agg(jsonb_build_object('day', s.day, 'hours', s.hours, 'quality', s.quality) order by s.day desc)
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

-- ---------- meta mensal ----------
-- Cada pessoa define quantos dias quer treinar em cada mês (mês atual ou o seguinte).
create or replace function public.set_goal(p_profile text, p_pin text, p_month text, p_days int)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r   text := public.auth_pin(p_profile, p_pin);
  cur text := to_char(public.today_pt(), 'YYYY-MM');
  nxt text := to_char(public.today_pt() + interval '1 month', 'YYYY-MM');
  dim int;
begin
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  if p_month is null or p_month !~ '^[0-9]{4}-(0[1-9]|1[0-2])$' or p_month < cur or p_month > nxt then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  dim := extract(day from ((p_month || '-01')::date + interval '1 month' - interval '1 day'))::int;
  if p_days is null or p_days < 1 or p_days > dim then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  insert into public.monthly_goals (profile, month, days) values (p_profile, p_month, p_days)
  on conflict (profile, month) do update set days = excluded.days;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.get_data(text, text)         to anon;
grant execute on function public.set_goal(text, text, text, int) to anon;
