# FCMarkt - Contexto do Projeto

## Objetivo

Criar o FCMarkt, uma plataforma inspirada no Transfermarkt, mas focada em dados do FIFA/EA FC para modo carreira.

O projeto deve começar pequeno, com um MVP simples:

- Cadastro de países
- Cadastro de ligas vinculadas a um país
- Cadastro de times vinculados a uma liga
- Upload e exibição de logos dos times
- Página pública de detalhes de um time

## Stack

- Frontend/Backend: Next.js com App Router
- Banco de dados: Supabase/PostgreSQL
- Upload de imagens: Supabase Storage
- Linguagem: TypeScript
- Estilização: Tailwind CSS

## Regras iniciais do MVP

1. Um país pode ter várias ligas.
2. Uma liga pertence a apenas um país.
3. Um time pertence a apenas uma liga.
4. Um time pode ter uma logo.
5. A logo deve ser salva no Supabase Storage.
6. A tabela de times deve salvar apenas a URL ou path da imagem.
7. No início, não precisa ter login.
8. O foco inicial é CRUD simples e estrutura bem organizada.

## Entidades

### countries

Representa um país.

Campos:

- id
- name
- code
- created_at

Exemplo:

- Brazil / BR
- England / EN
- Spain / ES

### leagues

Representa uma liga/campeonato.

Campos:

- id
- country_id
- name
- logo_url
- created_at

Exemplo:

- Premier League
- Brasileirão Série A
- La Liga

### teams

Representa um time.

Campos:

- id
- league_id
- name
- short_name
- city
- stadium
- founded_year
- logo_url
- description
- created_at
- updated_at

## Estrutura sugerida do projeto

```txt
src/
  app/
    page.tsx

    teams/
      page.tsx
      new/
        page.tsx
      [id]/
        page.tsx

    leagues/
      page.tsx
      new/
        page.tsx

    countries/
      page.tsx
      new/
        page.tsx

  components/
    teams/
      TeamCard.tsx
      TeamForm.tsx

    leagues/
      LeagueForm.tsx

    countries/
      CountryForm.tsx

    ui/

  lib/
    supabase/
      client.ts
      server.ts

  services/
    teams.ts
    leagues.ts
    countries.ts

  types/
    database.ts
```

## SQL inicial

```sql
create table countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  created_at timestamp with time zone default now()
);

create table leagues (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references countries(id) on delete cascade,
  name text not null,
  logo_url text,
  created_at timestamp with time zone default now()
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  name text not null,
  short_name text,
  city text,
  stadium text,
  founded_year int,
  logo_url text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Páginas iniciais

### `/`

Página inicial simples com:

- Nome FCMarkt
- Texto explicando o projeto
- Link para listar times
- Link para cadastrar novo time

### `/countries`

Lista países cadastrados.

### `/countries/new`

Formulário para cadastrar país.

### `/leagues`

Lista ligas cadastradas com país vinculado.

### `/leagues/new`

Formulário para cadastrar liga e selecionar país.

### `/teams`

Lista times cadastrados.

Cada card deve mostrar:

- Logo
- Nome
- Liga
- País

### `/teams/new`

Formulário para cadastrar time.

Campos:

- Nome
- Nome curto
- Liga
- Cidade
- Estádio
- Ano de fundação
- Descrição
- Upload da logo

### `/teams/[id]`

Página pública do time.

Deve mostrar:

- Logo grande
- Nome do time
- Liga
- País
- Cidade
- Estádio
- Ano de fundação
- Descrição

## Supabase Storage

Criar um bucket chamado:

```txt
team-logos
```

No início, pode ser público para facilitar a exibição das imagens.

A imagem enviada no cadastro do time deve ser salva no bucket e a URL pública deve ser salva em `teams.logo_url`.

## Primeira etapa de desenvolvimento

A IA deve começar criando:

1. Projeto Next.js com TypeScript e Tailwind.
2. Configuração do Supabase.
3. Tabelas no Supabase.
4. CRUD de países.
5. CRUD de ligas.
6. CRUD de times.
7. Upload de logo do time.
8. Página pública do time.

## Importante

Não criar funcionalidades avançadas agora.

Evitar neste primeiro momento:

- Jogadores
- Elencos
- Transferências
- Valores de mercado
- Login
- Permissões
- Dashboard complexo
- Scraping
- Integração com API externa

O objetivo agora é criar uma base sólida e simples para evoluir depois.

## Historico - 2026-05-17

Itens finalizados hoje:

- Criada a branch `refactor/next-supabase`.
- Estrutura antiga preservada em `legacy/`, mantendo referencia do frontend Vue, backend Node/Express e banco MySQL/Docker.
- Projeto refatorado para Next.js com App Router, TypeScript e Tailwind CSS.
- Supabase configurado como backend, com helpers de client/server e variaveis de ambiente.
- Criado `supabase/schema.sql` com tabelas `countries`, `leagues` e `teams`.
- Adicionados buckets publicos `team-logos` e `league-logos` no schema.
- Criados services para paises, ligas e times.
- Criadas telas iniciais de listagem e cadastro para paises, ligas e times.
- Criada pagina publica de detalhes do time em `/teams/[id]`.
- Criado `.env.example` sem chaves reais.
- README atualizado com stack, setup local e scripts.
- Criado seed de paises usando REST Countries para nome, sigla e bandeira.
- Criado seed de ligas com lista curada de primeiras divisoes vinculadas aos paises.
- Criado fluxo para logos de ligas usando arquivos locais em `assets/league-logos`.
- Criado seed de times por paginas publicas de temporada da Wikipedia, evitando limites da API-Football e retornos parciais da TheSportsDB.
- Seed de times passou a validar a quantidade esperada por liga antes de cadastrar.
- Seed de times passou a ignorar clubes ja existentes e ganhou modo `SEED_TEAMS_DRY_RUN=1`.
- Criada pagina de detalhes da liga em `/leagues/[id]`.
- Pagina da liga mostra os times vinculados em ordem alfabetica, em formato de tabela, com logo, nome conhecido, nome oficial, cidade, estadio e fundacao.
- Listagem de ligas em `/leagues` agora aponta para a pagina de cada liga.

Pendencias planejadas para depois:

- Melhorar politicas de RLS antes de abrir edicao publica em producao.
- Decidir uma estrategia oficial/licenciada para logos de clubes e campeonatos.
- Criar telas de edicao/exclusao quando o CRUD precisar ficar completo.
- Adicionar login e permissoes somente depois do MVP publico estar estavel.
- Nao implementar ainda jogadores, elencos, transferencias, valores de mercado, scraping ou APIs externas.

Atualizacao de commit:

- A pagina de detalhes da liga, a navegacao a partir de `/leagues` e os services de busca por liga/time foram preparados para commit.
- `context.md` esta no `.gitignore`, mas deve ser incluido manualmente no commit quando o historico do projeto precisar ser versionado.
