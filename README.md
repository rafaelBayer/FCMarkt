# FCMarkt

FCMarkt e uma aplicacao para organizar dados de modo carreira FIFA/EA FC, inspirada no Transfermarkt. O projeto foi refatorado para Next.js + Supabase, mantendo a versao antiga em `legacy/` apenas como referencia historica.

O MVP inicial focava em paises, ligas e times. A Fase 2 adiciona temporadas, jogadores, elencos por temporada e transferencias manuais, ainda sem login, scraping, APIs externas ou importacao automatica de jogadores.

A Fase 3 adiciona administracao basica: edicao, exclusao segura, diagnostico de duplicados e regras de integridade para proteger o historico do modo carreira.

A Fase 4 inicia a importacao controlada de jogadores por CSV local, com dry run obrigatorio por padrao e suporte inicial ao dataset Kaggle EAFC26 Player Database.

A Fase 4.1 adiciona paginacao server-side, busca e filtros basicos nas listagens para evitar leituras grandes no Supabase.

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
- Listagem e cadastro de temporadas
- Listagem, cadastro e perfil de jogadores
- Vinculos de elenco por temporada na pagina do time
- Listagem e cadastro manual de transferencias
- Testes de regras de negocio com Vitest
- Edicao de registros principais
- Exclusao segura com confirmacao visual
- Diagnostico simples de times duplicados em `/admin/duplicates`
- Analise e importacao controlada de jogadores por CSV local
- Paginacao, busca e filtros nas principais listagens

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
- `seasons`: temporadas do universo do modo carreira
- `players`: jogadores cadastrados manualmente, sem `team_id` fixo
- `players.external_source` e `players.external_id`: referencia opcional para importacoes locais
- `squad_memberships`: vinculos de jogadores com times por temporada
- `transfers`: transferencias manuais com data do modo carreira

Buckets publicos usados:

- `team-logos`: logos de clubes
- `league-logos`: logos de ligas

O schema tambem cria indices para buscas por relacionamento e indices unicos para evitar duplicacoes basicas.

Constraints contra duplicidade:

- `countries(code)`
- `leagues(country_id, name)`
- `teams(league_id, name)`
- `seasons(name)`
- `squad_memberships(player_id, team_id, season_id)`
- `players(name, birth_date)`, somente quando `birth_date` existir
- `players(external_source, external_id)`, somente quando ambos existirem

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run test
npm run seed:countries
npm run seed:leagues
npm run seed:teams
npm run analyze:eafc26
npm run analyze:eafc26:teams
npm run import:eafc26:players:dry
npm run import:eafc26:players -- --execute
```

## Rotas principais

- `/countries` e `/countries/new`
- `/leagues`, `/leagues/new` e `/leagues/[id]`
- `/teams`, `/teams/new` e `/teams/[id]`
- `/seasons` e `/seasons/new`
- `/players`, `/players/new` e `/players/[id]`
- `/transfers` e `/transfers/new`
- paginas de edicao em `/countries/[id]/edit`, `/leagues/[id]/edit`, `/teams/[id]/edit`, `/players/[id]/edit`, `/seasons/[id]/edit` e `/transfers/[id]/edit`
- `/admin/duplicates`

## Regras da Fase 2

- Um jogador pode existir sem time atual.
- O time atual do jogador nao e salvo em `players`.
- O time atual e derivado do vinculo de elenco mais recente ou da transferencia mais recente.
- Elencos sao consultaveis por temporada.
- Transferencias exigem jogador, destino, temporada e data manual.
- `from_team_id` e `fee` podem ser nulos.
- Esta fase nao implementa scraping, API externa, importacao automatica de jogadores ou upload de foto de jogador.

## Testes

Os testes usam Vitest e ficam em `src/tests/`.

```bash
npm run test
```

Os testes atuais protegem validacoes de temporadas, jogadores, elencos, transferencias, ordenacao por data e a regra de nao salvar `team_id` em `players`.

Tambem ha testes para parser, mapper e dry run do importador EAFC26.
As regras de paginacao protegem as listagens contra consultas sem limite.

## Listagens com paginacao

As principais listagens usam paginacao server-side e refletem busca/filtros na URL:

- `/players?page=1&search=&position=&nationality=`
- `/teams?page=1&search=&league=&country=`
- `/leagues?page=1&search=&country=`
- `/countries?page=1&search=`
- `/seasons?page=1&search=`
- `/transfers?page=1&search=&season=&team=`

Jogadores usam limite padrao de 50 registros por pagina. As demais listagens usam 20 registros por pagina.

## Importacao EAFC26 por CSV local

Baixe manualmente o dataset `flynn28/eafc26-player-database` no Kaggle e coloque os CSVs em:

```txt
imports/kaggle/eafc26/
```

A pasta `imports/` fica ignorada pelo Git, incluindo CSVs baixados e relatorios.

Analise os arquivos:

```bash
npm run analyze:eafc26
```

Rode o dry run:

```bash
npm run import:eafc26:players:dry
```

Importe de verdade somente depois de conferir o relatorio:

```bash
npm run import:eafc26:players -- --execute
```

O importador cria apenas jogadores em `players`. Ele nao cria times, ligas, transferencias ou elencos automaticamente. Veja mais em [docs/imports.md](docs/imports.md).

Para reconciliar nomes de clubes do CSV com times existentes no Supabase:

```bash
npm run analyze:eafc26:teams
```

Aliases manuais ficam em `src/data/import-maps/team-aliases.json`. O relatorio e salvo em `imports/reports/eafc26-team-reconciliation.json` e nao cria dados automaticamente.

## Exclusao segura

A interface nao usa exclusao em cascata para apagar historico. Antes de excluir, o sistema pede confirmacao visual e verifica se o registro pode ser removido.

Regras principais:

- Pais so pode ser excluido se nao possuir ligas.
- Liga so pode ser excluida se nao possuir times.
- Time so pode ser excluido se nao possuir elenco ou transferencias vinculadas.
- Jogador so pode ser excluido se nao possuir elenco ou transferencias.
- Temporada so pode ser excluida se nao possuir elenco ou transferencias.
- Transferencias e vinculos de elenco podem ser excluidos com confirmacao visual.

Quando um registro nao pode ser excluido, a interface mostra uma mensagem explicando o motivo.

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
  services/            Acesso a dados e regras de negocio
  tests/               Testes de regras de negocio
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
