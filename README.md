# Just Butts (No ifs, just butts)

App de treino, medição corporal, alimentação, sono e calendário para a Mariana, a Élia e a Gabriela.
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
Quando saírem funcionalidades novas que precisem da base de dados, corre o ficheiro `supabase/atualizar.sql` (ou, se já tinhas corrido uma versão anterior, o pequeno `supabase/atualizar-metas.sql`) no SQL Editor (cola tudo e **Run**). É seguro repetir e **não apaga dados nem PINs**. Inclui: apagar/corrigir, desportos, datas seguras, login por utilizador, séries por dia, sono, exercícios personalizados, meta mensal e a limpeza de dias marcados no futuro.

### Pessoas e palavras-passe
O login é por **nome de utilizador + palavra-passe** (o utilizador não distingue maiúsculas de minúsculas). A splash não mostra nomes. Cada pessoa só vê os seus dados.
- **Definir o utilizador e a palavra-passe de quem já existe** (para não perder dados): ver o comando `update` em `supabase/novo-utilizador.sql`. Não guardes palavras-passe no GitHub.
- **Criar uma pessoa nova:** abre `supabase/novo-utilizador.sql`, muda os valores marcados com `<<<` e corre no SQL Editor do Supabase. O ficheiro tem também os comandos para ver quem existe, mudar uma palavra-passe e desbloquear alguém.
- Cada pessoa começa sem dados: define a meta do mês na aba Progresso e adiciona a primeira medição.

### Sono com horas
Cada noite regista a hora a que foste dormir e a hora a que acordaste; a app calcula as horas dormidas (também quando passa da meia-noite). Para ativar corre `supabase/atualizar-sono.sql` no SQL Editor (seguro repetir, não apaga dados). Registos antigos continuam a aparecer com as horas que tinham.

### Treino da Gabriela
Uma pessoa com o objetivo `emagrecimento` (ver `supabase/novo-utilizador.sql`) vê um treino diferente: plano de 12 semanas (5 de outubro a 27 de dezembro) a fazer em casa, 3 sessões por semana. O plano está em `js/gaby-data.js` e os vídeos do treino principal em `plano-principal.json`. Para as restantes pessoas nada muda.

### Desenhos dos exercícios
Cada exercício mostra um desenho (posição inicial e final). Estão em `js/doodles.js`, por tipo de movimento.

### Sessão
Depois de entrar, a sessão fica guardada neste dispositivo e só termina quando carregas em sair (ou se a palavra-passe mudar).

### Meta mensal
No início de cada mês cada pessoa define quantos dias quer treinar (aba **Progresso**; aparece um pontinho na aba enquanto não houver meta). Pode alterá-la durante o mês. Meses passados ficam como estão. A meta aparece no anel do calendário e no resumo.

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
- **Progresso:** meta mensal definida por cada pessoa, resumo mensal bem-humorado, melhor carga de cada exercício e calendário. Cada registo marca automaticamente o dia; dias futuros nunca contam. Textos em `js/progress.js`.

### Som e visual
- Os botões fazem um "pop" (gerado no próprio browser, sem ficheiros de áudio). O botão do altifalante, no topo, liga e desliga o som e a preferência fica guardada. Em telemóveis com o modo silencioso ligado o iPhone pode não tocar.
- O tipo de letra (Poppins) está em `fonts/`, por isso não depende de servidores externos.
- A meta mensal é escolhida por cada pessoa na aba Progresso (as sugestões rápidas 8/12/16/20 estão em `js/data.js`, `GOAL_SUGGESTIONS`).

## 3. Testar localmente

Os módulos ES não funcionam com `file://`; usa um servidor local:

```bash
npx http-server -p 8080     # ou: python3 -m http.server 8080
```

Sem o `config.js` preenchido, o site corre em **modo demo** (dados só no browser; entra com qualquer nome de utilizador e uma palavra-passe de 4+ caracteres; aparece um aviso amarelo).

## 4. Publicar no GitHub Pages

1. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
2. Branch **main**, pasta **/ (root)** → Save.
3. Ao fim de ~1 minuto o site fica em `https://<utilizador-ou-org>.github.io/<nome-do-repo>/`.

Depois de mudares `js/config.js`, faz commit e push e o site atualiza sozinho.
