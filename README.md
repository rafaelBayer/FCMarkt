# FCMarkt

FCMarkt e uma aplicacao para organizar dados de modo carreira FIFA/EA FC, inspirada no Transfermarkt. O projeto foi refatorado para Next.js + Supabase, mantendo a versao antiga em `legacy/` apenas como referencia historica.

O MVP atual foca somente em paises, ligas e times. Jogadores, elencos, transferencias, valores de mercado, login e permissoes ficam fora deste escopo inicial.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Supabase como backend
- Supabase PostgreSQL como banco
- Supabase Storage para logos

## Funcionalidades do MVP

- Listagem e cadastro de paises
- Listagem e cadastro de ligas vinculadas a paises
- Listagem e cadastro de times vinculados a ligas
- Upload de logos de times para o bucket `team-logos`
- Logos de ligas a partir de arquivos locais enviados para `league-logos`
- Paginas publicas de detalhes de ligas e times
- Seeds para paises, ligas e times

## Configuracao local

1. Instale as dependencias:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` a partir do exemplo:

   ```bash
   cp .env.example .env.local
   ```

   No PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. Preencha as variaveis no `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

   Nao versione chaves reais. O `.env.local` fica ignorado pelo Git.

4. No Supabase SQL Editor, execute o arquivo:

   ```txt
   supabase/schema.sql
   ```

5. Rode o projeto:

   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000`.

## Banco e Storage

Tabelas criadas pelo schema:

- `countries`: paises, codigo e bandeira
- `leagues`: ligas vinculadas a paises
- `teams`: times vinculados a ligas

Buckets publicos usados:

- `team-logos`: logos de clubes
- `league-logos`: logos de ligas

O schema tambem cria indices para buscas por relacionamento e indices unicos para evitar duplicacoes basicas.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run seed:countries
npm run seed:leagues
npm run seed:teams
```

## Seeds

### Paises

O seed de paises usa REST Countries para buscar nome, codigo ISO-2 e bandeira.

```bash
npm run seed:countries
```

Ele usa `upsert` por `code`, entao pode ser executado novamente sem duplicar paises.

### Ligas

O seed de ligas cadastra uma lista curada de primeiras divisoes e vincula cada liga ao pais correspondente.

```bash
npm run seed:leagues
```

Execute `npm run seed:countries` antes. England e Scotland sao criadas automaticamente com codigos futebolisticos `ENG` e `SCO` quando necessario.

### Logos das ligas

O seed de ligas procura arquivos locais em `assets/league-logos/` e envia para o bucket `league-logos`. Sao aceitos `.svg`, `.png` e `.webp`.

Exemplos de nomes esperados:

```txt
premier-league.svg
la-liga.svg
bundesliga.svg
serie-a.svg
ligue-1.svg
campeonato-brasileiro-serie-a.svg
liga-profesional-de-futbol.svg
```

Se um arquivo nao existir, a liga e cadastrada sem logo.

### Times

O seed de times usa paginas publicas de temporada da Wikipedia como fonte auditavel. Ele valida a quantidade esperada de clubes antes de cadastrar para evitar listas parciais.

```bash
npm run seed:teams
```

Ordem recomendada:

```bash
npm run seed:countries
npm run seed:leagues
npm run seed:teams
```

Dry run:

```bash
SEED_TEAMS_DRY_RUN=1 npm run seed:teams
```

No PowerShell:

```powershell
$env:SEED_TEAMS_DRY_RUN = "1"
npm run seed:teams
```

## Estrutura

```txt
src/
  app/                 Rotas do App Router
  components/          Componentes de UI e formularios
  lib/supabase/        Helpers de configuracao Supabase
  services/            Acesso a dados de paises, ligas e times
  types/               Tipos do banco e formularios
scripts/               Seeds
supabase/
  schema.sql
assets/
  league-logos/
legacy/
  frontend/
  backend/
  database/
docs/
```

## Historico

O historico publico do projeto fica em `docs/history.md`. O arquivo `context.md` permanece privado e ignorado pelo Git para orientar a IA localmente.

## Licenca

Este projeto e licenciado sob a Licenca Publica Geral GNU v3.0. Veja [LICENSE](./LICENSE).
