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

### Como é protegido
- O URL e a chave `anon` **são públicos** (ficam no código do site). Não dão acesso a nada por si só.
- As tabelas têm RLS ligado e sem policies: a chave pública **não consegue** ler nem escrever nelas.
- Todo o acesso passa por funções (`login`, `get_data`, `add_measurement`, `add_log`, `toggle_gym_day`) que exigem perfil + PIN, verificado no servidor.
- Os PINs só existem na base de dados, com hash (bcrypt). Não estão no código nem no repositório.
- Limitação: um PIN de 4 dígitos é proteção leve (serve para separar perfis, não para dados sensíveis). O bloqueio após 5 falhas dificulta adivinhar.

## 2. Testar localmente

Os módulos ES não funcionam com `file://`; usa um servidor local:

```bash
npx http-server -p 8080     # ou: python3 -m http.server 8080
```

Sem o `config.js` preenchido, o site corre em **modo demo** (dados só no browser, qualquer PIN de 4 dígitos entra, aparece um aviso amarelo).

## 3. Publicar no GitHub Pages

1. No repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
2. Branch **main**, pasta **/ (root)** → Save.
3. Ao fim de ~1 minuto o site fica em `https://<utilizador-ou-org>.github.io/<nome-do-repo>/`.

Depois de mudares `js/config.js`, faz commit e push e o site atualiza sozinho.
