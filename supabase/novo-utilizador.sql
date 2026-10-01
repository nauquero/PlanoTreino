-- ===========================================================
-- CRIAR UMA PESSOA NOVA
-- 1) Muda os 5 valores marcados com  <<<  (e só esses).
-- 2) Cola no Supabase → SQL Editor → Run.
-- 3) Entrega à pessoa o NÚMERO e a PALAVRA-PASSE (não os guardes no GitHub).
-- ===========================================================
insert into public.profiles (id, name, login_number, focus, cardio, pin_hash)
values (
  'sofia',                       -- <<< 1. identificador interno: uma palavra em minúsculas, sem espaços e que ninguém repita
  'Sofia',                       -- <<< 2. nome que aparece na app ("Hey, sweetie (aka Sofia)")
  '3',                           -- <<< 3. número de utilizador (para entrar). Tem de ser único: 1 e 2 já existem
  'saude',                       -- <<< 4. objetivo: 'hipertrofia', 'definicao' ou 'saude'
  'bicicleta',                   --        cardio sugerido no fim dos treinos: 'escadas' ou 'bicicleta'
  extensions.crypt('uma-palavra-passe-forte', extensions.gen_salt('bf'))   -- <<< 5. palavra-passe da pessoa (4+ caracteres; quanto maior, melhor)
);

-- ver quem existe (número, nome, objetivo):
-- select login_number, name, focus from public.profiles order by login_number::int;

-- mudar a palavra-passe de alguém (pelo número):
-- update public.profiles set pin_hash = extensions.crypt('nova-palavra-passe', extensions.gen_salt('bf')), failed_attempts = 0, locked_until = null where login_number = '3';

-- desbloquear alguém que errou a palavra-passe 5 vezes (o bloqueio dura 15 min):
-- update public.profiles set failed_attempts = 0, locked_until = null where login_number = '3';
