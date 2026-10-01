-- ===========================================================
-- GabyFit Special Edition: preparar a base de dados
-- Cola no Supabase -> SQL Editor -> Run. E seguro repetir; nao apaga dados.
-- Este ficheiro NAO cria a Gabriela nem define palavras-passe (isso faz-se a parte, ver abaixo).
-- ===========================================================

-- Cada perfil pertence a uma app: 'butts' (a original) ou 'gaby' (esta).
alter table public.profiles add column if not exists app text not null default 'butts';

-- O login passa a devolver a app do perfil (cada app recusa contas da outra).
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
  select id into pid from public.profiles where lower(login_number) = lower(trim(p_number));
  if pid is null then return jsonb_build_object('ok', false, 'error', 'invalid_pin'); end if;
  r := public.auth_pin(pid, p_pin);
  if r <> 'ok' then return jsonb_build_object('ok', false, 'error', r); end if;
  select * into prof from public.profiles where id = pid;
  return jsonb_build_object('ok', true, 'profile', jsonb_build_object(
    'id', prof.id, 'name', prof.name, 'focus', prof.focus, 'cardio', prof.cardio, 'app', prof.app));
end;
$$;

grant execute on function public.login_user(text, text) to anon;

-- ===========================================================
-- CRIAR A GABRIELA (corre esta parte com a palavra-passe escolhida; NAO a guardes no GitHub)
-- ===========================================================
-- insert into public.profiles (id, name, login_number, focus, cardio, app, pin_hash)
-- values ('gabriela', 'Gabriela', 'gabrielapereira', 'emagrecimento', 'bicicleta', 'gaby',
--         extensions.crypt('A-PALAVRA-PASSE-AQUI', extensions.gen_salt('bf')));
--
-- Mudar a palavra-passe mais tarde:
-- update public.profiles set pin_hash = extensions.crypt('nova-palavra-passe', extensions.gen_salt('bf')),
--   failed_attempts = 0, locked_until = null where id = 'gabriela';
