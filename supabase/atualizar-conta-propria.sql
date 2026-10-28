-- ===========================================================
-- Criar conta propria (com codigo de convite)
-- Cola no Supabase -> SQL Editor -> Run. E seguro repetir; nao apaga dados.
-- ===========================================================

-- 1) codigos de convite: so quem tem um codigo valido consegue criar conta
create table if not exists public.invite_codes (
  code     text primary key,
  max_uses int  not null default 25,
  uses     int  not null default 0,
  active   boolean not null default true
);
alter table public.invite_codes enable row level security;
revoke all on public.invite_codes from anon, authenticated;

-- 2) travao contra tentativas de adivinhar codigos (20 falhas em 15 min = pausa)
create table if not exists public.signup_throttle (
  id           int primary key default 1,
  fails        int not null default 0,
  window_start timestamptz not null default now()
);
insert into public.signup_throttle (id) values (1) on conflict (id) do nothing;
alter table public.signup_throttle enable row level security;
revoke all on public.signup_throttle from anon, authenticated;

-- 3) criar conta
create or replace function public.register_user(p_username text, p_password text, p_code text, p_profile jsonb, p_measurement jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  u     text := lower(trim(coalesce(p_username, '')));
  inv   public.invite_codes;
  thr   public.signup_throttle;
  fname text;
begin
  select * into thr from public.signup_throttle where id = 1 for update;
  if thr.window_start < now() - interval '15 minutes' then
    update public.signup_throttle set fails = 0, window_start = now() where id = 1;
    thr.fails := 0;
  end if;
  if thr.fails >= 20 then return jsonb_build_object('ok', false, 'error', 'locked'); end if;

  select * into inv from public.invite_codes
   where lower(code) = lower(trim(coalesce(p_code, ''))) and active for update;
  if not found or inv.uses >= inv.max_uses then
    update public.signup_throttle set fails = fails + 1 where id = 1;
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if u !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then return jsonb_build_object('ok', false, 'error', 'invalid_username'); end if;
  if length(coalesce(p_password, '')) < 6 or length(p_password) > 72 then return jsonb_build_object('ok', false, 'error', 'weak_password'); end if;
  if exists (select 1 from public.profiles where lower(login_number) = u or id = u) then
    return jsonb_build_object('ok', false, 'error', 'username_taken');
  end if;
  if p_profile is null or jsonb_typeof(p_profile) <> 'object' or length(p_profile::text) > 4000 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;

  fname := left(trim(coalesce(p_profile->>'first_name', '')), 30);
  if fname = '' then fname := u; end if;

  insert into public.profiles (id, name, login_number, focus, cardio, pin_hash, profile_data)
  values (u, fname, u, 'saude', 'bicicleta', crypt(p_password, gen_salt('bf')), p_profile);
  update public.invite_codes set uses = uses + 1 where code = inv.code;

  if p_measurement is not null and jsonb_typeof(p_measurement) = 'object' then
    begin
      perform public.add_measurement(u, p_password, p_measurement || jsonb_build_object('date', public.today_pt()));
    exception when others then null;  -- as medidas sao opcionais: nunca impedem a criacao da conta
    end;
  end if;

  return jsonb_build_object('ok', true, 'profile', jsonb_build_object('id', u, 'name', fname, 'focus', 'saude', 'cardio', 'bicicleta'));
end;
$$;

grant execute on function public.register_user(text, text, text, jsonb, jsonb) to anon;

-- 4) CRIAR UM CODIGO DE CONVITE (muda o texto entre aspas e o numero de pessoas; corre so esta linha)
-- insert into public.invite_codes (code, max_uses) values ('O-TEU-CODIGO', 20) on conflict (code) do update set max_uses = excluded.max_uses, active = true;

-- PARAR DE ACEITAR CONTAS NOVAS COM UM CODIGO:
-- update public.invite_codes set active = false where code = 'O-TEU-CODIGO';

-- VER OS CODIGOS E QUANTAS CONTAS CADA UM JA CRIOU:
-- select code, uses, max_uses, active from public.invite_codes;
