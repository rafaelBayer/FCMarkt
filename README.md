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
```

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
