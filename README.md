# FCMarkt

FCMarkt e uma aplicacao para organizar dados de modo carreira FIFA/EA FC, inspirada no Transfermarkt. O MVP atual foca em paises, ligas e times, com upload de logos pelo Supabase Storage e paginas publicas de detalhes dos clubes.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- Supabase como backend
- Supabase PostgreSQL como banco
- Supabase Storage para logos dos times

## MVP

- Cadastro de paises
- Cadastro de ligas vinculadas a paises
- Cadastro de times vinculados a ligas
- Upload de logo dos times no bucket `team-logos`
- Listagem de times
- Pagina publica de detalhes do time

## Como Rodar

1. Instale as dependencias:

   ```bash
   npm install
   ```

2. Copie o arquivo de ambiente:

   ```bash
   cp .env.example .env.local
   ```

3. Preencha as variaveis:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   ```

4. Crie as tabelas e o bucket no Supabase usando o SQL em `supabase/schema.sql`.

5. Rode o projeto:

   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run seed:countries
npm run seed:leagues
npm run seed:teams
```

## Popular Paises

O seed de paises usa a API REST Countries para buscar nome, sigla ISO-2 e bandeira.

1. Rode o SQL atualizado em `supabase/schema.sql` no Supabase SQL Editor. Ele adiciona `countries.flag_url` e o indice unico por `countries.code`.
2. Confirme que `.env.local` tem `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Execute:

   ```bash
   npm run seed:countries
   ```

O script usa `upsert` por `code`, entao pode ser executado novamente para atualizar nomes e bandeiras sem duplicar paises.

## Popular Ligas

O seed de ligas cadastra uma lista curada de primeiras divisoes e vincula cada liga ao pais correspondente.

1. Rode o SQL atualizado em `supabase/schema.sql` no Supabase SQL Editor. Ele cria o indice unico por `leagues.country_id + leagues.name` e o bucket publico `league-logos`.
2. Execute o seed de paises antes, porque as ligas dependem deles:

   ```bash
   npm run seed:countries
   ```

3. Execute:

   ```bash
   npm run seed:leagues
   ```

England e Scotland nao vem da REST Countries como paises independentes. O seed cria essas duas entradas automaticamente com codigos futebolisticos `ENG` e `SCO` caso elas ainda nao existam.

### Logos Das Ligas

Logos de campeonatos sao marcas registradas e podem mudar por patrocinio. Para evitar hotlink fragil ou uso de arquivos sem controle, o seed procura arquivos locais em `assets/league-logos/` e envia para o bucket `league-logos`.

Use estes nomes de arquivo quando tiver os assets oficiais/licenciados:

```txt
premier-league.svg
la-liga.svg
bundesliga.svg
serie-a.svg
ligue-1.svg
liga-portugal.svg
eredivisie.svg
belgian-pro-league.svg
danish-superliga.svg
scottish-premiership.svg
saudi-pro-league.svg
major-league-soccer.svg
liga-mx.svg
campeonato-brasileiro-serie-a.svg
liga-profesional-de-futbol.svg
liga-auf-uruguaya.svg
division-profesional-paraguay.svg
liga-de-primera-chile.svg
categoria-primera-a.svg
liga-1-peru.svg
ligapro-serie-a.svg
division-profesional-bolivia.svg
liga-futve.svg
```

Tambem sao aceitos `.png` e `.webp`.

## Popular Times

O seed de times usa API-Football como fonte principal quando `API_FOOTBALL_KEY` estiver configurada. Essa fonte consulta clubes por liga e temporada, o que evita o problema de retorno parcial de 10 clubes da TheSportsDB. A TheSportsDB fica apenas como fallback e o script rejeita qualquer retorno com quantidade diferente da esperada para a liga.

O script usa:

- `teams.name`: nome oficial/registrado quando a fonte retorna alternativa mais completa.
- `teams.short_name`: nome mais conhecido.
- `teams.city`: localidade retornada pela fonte.
- `teams.stadium`: estadio.
- `teams.founded_year`: ano de fundacao.
- `teams.logo_url`: badge/logo retornado pela fonte.

Antes de rodar, execute o SQL atualizado em `supabase/schema.sql`, pois ele cria o indice unico `teams(league_id, name)`.

Configure a chave da API-Football no `.env.local`:

```env
API_FOOTBALL_KEY=
```

Depois rode:

```bash
npm run seed:countries
npm run seed:leagues
npm run seed:teams
```

O script verifica os times ja cadastrados por liga e ignora os existentes para evitar duplicacao. Se uma fonte retornar lista incompleta ou com times demais, a liga e ignorada e o terminal mostra o motivo.

## Estrutura

```txt
src/
  app/
  components/
  lib/supabase/
  services/
  types/
supabase/
  schema.sql
legacy/
  frontend/
  backend/
  database/
```

## Legado

A estrutura antiga em Vue.js, Node/Express e Docker/MySQL foi movida para `legacy/` para preservar referencia historica sem misturar com a nova stack.

## Licenca

Este projeto e licenciado sob a Licenca Publica Geral GNU v3.0. Veja [LICENSE](./LICENSE).
