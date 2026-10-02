-- ===========================================================
-- UTILIZADORES: criar, mudar palavra-passe, desbloquear
-- Cola no Supabase → SQL Editor → Run. Não guardes palavras-passe no GitHub.
-- ===========================================================

-- A) CRIAR UMA PESSOA NOVA ---------------------------------
-- Muda os 5 valores marcados com  <<<  (e só esses).
insert into public.profiles (id, name, login_number, focus, cardio, pin_hash)
values (
  'sofia',                       -- <<< 1. identificador interno: uma palavra em minúsculas, sem espaços, que ninguém repita
  'Sofia',                       -- <<< 2. nome que aparece na app ("Hey, sweetie / aka Sofia")
  'sofiasilva',                  -- <<< 3. NOME DE UTILIZADOR (para entrar): único, sem espaços (maiúsculas/minúsculas é igual)
  'saude',                       -- <<< 4. objetivo: 'hipertrofia', 'definicao', 'emagrecimento' (treino em casa, 3x por semana) ou 'saude'
  'bicicleta',                   --        cardio sugerido no fim dos treinos: 'escadas' ou 'bicicleta'
  extensions.crypt('uma-palavra-passe-forte', extensions.gen_salt('bf'))   -- <<< 5. palavra-passe (4+ caracteres; quanto maior, melhor)
);

-- B) DEFINIR UTILIZADOR + PALAVRA-PASSE DE ALGUÉM QUE JÁ EXISTE (sem perder dados) --
-- 'mariana' é o identificador interno; os registos e medições ficam ligados a ele.
-- update public.profiles
--   set login_number = 'novo-utilizador',
--       pin_hash = extensions.crypt('nova-palavra-passe', extensions.gen_salt('bf')),
--       failed_attempts = 0, locked_until = null
--   where id = 'mariana';

-- C) VER QUEM EXISTE ---------------------------------------
-- select id, login_number as utilizador, name, focus from public.profiles order by name;

-- D) DESBLOQUEAR ALGUÉM (5 palavras-passe erradas = 15 min de bloqueio) --
-- update public.profiles set failed_attempts = 0, locked_until = null where login_number = 'novo-utilizador';
