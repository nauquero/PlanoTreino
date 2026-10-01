# no ifs, just good butts 💋

App de treino, medição corporal, alimentação e calendário para a Mariana e a Élia.
HTML/CSS/JS puro (sem build) + base de dados Supabase, publicada no GitHub Pages.

```
index.html          página única
css/style.css       estilos
js/config.js        URL e chave pública do Supabase  ← preencher
js/data.js          exercícios, refeições, significados (editar textos aqui)
js/api.js           ligação à base de dados (+ modo demo)
js/app.js           lógica da aplicação
supabase/setup.sql  tabelas, segurança e funções     ← correr no Supabase
```

## 1. Base de dados (Supabase, plano gratuito)

1. Cria conta em <https://supabase.com> → **New project** (guarda a password da base de dados).
2. No projeto: **SQL Editor → New query**, cola o conteúdo de `supabase/setup.sql` e carrega em **Run**.
3. Define os PINs. Ainda no SQL Editor, corre isto **com os teus códigos** (não os guardes no GitHub):

   ```sql
   update public.profiles set pin_hash = extensions.crypt('2108', extensions.gen_salt('bf')) where id = 'mariana';
   update public.profiles set pin_hash = extensions.crypt('3010', extensions.gen_salt('bf')) where id = 'elia';
   ```
4. **Project Settings → API**: copia o **Project URL** e a chave **anon / publishable** para `js/config.js`.

Para mudar um PIN mais tarde, repete o passo 3. Para desbloquear um perfil (5 tentativas erradas = 15 min de bloqueio):

```sql
update public.profiles set failed_attempts = 0, locked_until = null where id = 'mariana';
```

### Atualizar a base de dados (quando há novidades)
Quando saírem funcionalidades novas que precisem da base de dados, corre o ficheiro `supabase/atualizar.sql` no SQL Editor (cola tudo e **Run**). É seguro repetir e **não apaga dados nem PINs**. Inclui: apagar/corrigir, desportos, datas seguras, login por número, séries por dia, sono, exercícios personalizados e a limpeza de dias marcados no futuro.

### Pessoas e palavras-passe
O login é por **número de utilizador + palavra-passe**. A splash não mostra nomes. Cada pessoa só vê os seus dados.
- Os números iniciais são `1` (Mariana) e `2` (Élia). A palavra-passe é o código que já tinham (pode ser mais longo e ter letras).
- **Adicionar uma pessoa** (SQL Editor; muda o nome, o número e a palavra-passe). `focus` pode ser `hipertrofia`, `definicao` ou `saude`; `cardio` pode ser `escadas` ou `bicicleta`:

```sql
insert into public.profiles (id, name, login_number, focus, cardio, pin_hash)
values ('sofia', 'Sofia', '3', 'saude', 'bicicleta', extensions.crypt('uma-palavra-passe-forte', extensions.gen_salt('bf')));
```
- **Mudar a palavra-passe ou o número de alguém:**

```sql
update public.profiles set pin_hash = extensions.crypt('nova-palavra-passe', extensions.gen_salt('bf')) where login_number = '1';
update public.profiles set login_number = '10' where login_number = '1';
```

### Como é protegido
- O URL e a chave `anon` **são públicos** (ficam no código do site). Não dão acesso a nada por si só.
- As tabelas têm RLS ligado e sem policies: a chave pública **não consegue** ler nem escrever nelas.
- Todo o acesso passa por funções (`login_user`, `get_data`, `add_log`, `set_sleep`, …) que exigem a palavra-passe, verificada no servidor.
- Os PINs só existem na base de dados, com hash (bcrypt). Não estão no código nem no repositório.
- Limitação: um código de 4 dígitos é proteção leve. Para pessoas novas usa palavras-passe mais longas. O bloqueio após 5 falhas (15 min) dificulta adivinhar.

## 2. Instalar como app (PWA)

O site é uma PWA: pode ser instalado no telemóvel e abre em ecrã inteiro, com ícone próprio.

- **iPhone (Safari):** abre o site → botão Partilhar → **Adicionar ao ecrã principal**.
- **Android (Chrome):** abre o site → menu ⋮ → **Instalar app** (ou "Adicionar ao ecrã inicial").

Sem internet a app abre, mas para entrar e guardar dados é preciso ligação (os dados estão na base de dados online).
O ícone está em `icons/` (podes trocá-lo mantendo os nomes e tamanhos); o cache offline está em `sw.js`.

### Funcionalidades
- **Treino:** Pernas, Glúteos, Costas, Peito, Braços (Bíceps, Tríceps, Ombros), Abs, Cardio e Outros desportos, com aquecimento e alongamento em cada um. Séries por dia (3 por defeito, "+ série" para mais), melhor carga por exercício, corrigir/apagar, botão "+" para criar exercícios próprios.
- **Descanso:** temporizador flutuante com tempo recomendado por tipo de exercício (150 s / 120 s / 90 s / 60 s).
- **Medição, Alimentação (água, proteína, alimentos e quantidades) e Sono** (horas e qualidade por dia).
- **Progresso:** resumo mensal bem-humorado, melhor carga de cada exercício e calendário. Cada registo marca automaticamente o dia; dias futuros nunca contam. Textos em `js/progress.js`.

### Som e visual
- Os botões fazem um "pop" (gerado no próprio browser, sem ficheiros de áudio). O botão do altifalante, no topo, liga e desliga o som e a preferência fica guardada. Em telemóveis com o modo silencioso ligado o iPhone pode não tocar.
- O tipo de letra (Poppins) está em `fonts/`, por isso não depende de servidores externos.
- A meta mensal do calendário (12 idas) está em `js/data.js` (`GYM_GOAL_PER_MONTH`).

## 3. Testar localmente

Os módulos ES não funcionam com `file://`; usa um servidor local:

```bash
npx http-server -p 8080     # ou: python3 -m http.server 8080
```

Sem o `config.js` preenchido, o site corre em **modo demo** (dados só no browser; entra com número `1` e uma palavra-passe de 4+ caracteres; aparece um aviso amarelo).

## 4. Publicar no GitHub Pages

1. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
2. Branch **main**, pasta **/ (root)** → Save.
3. Ao fim de ~1 minuto o site fica em `https://<utilizador-ou-org>.github.io/<nome-do-repo>/`.

Depois de mudares `js/config.js`, faz commit e push e o site atualiza sozinho.
