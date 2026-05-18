# Historico do FCMarkt

## 2026-05-17

Itens finalizados:

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

Pendencias planejadas:

- Melhorar politicas de RLS antes de abrir edicao publica em producao.
- Decidir uma estrategia oficial/licenciada para logos de clubes e campeonatos.
- Criar telas de edicao/exclusao quando o CRUD precisar ficar completo.
- Adicionar login e permissoes somente depois do MVP publico estar estavel.
- Nao implementar ainda jogadores, elencos, transferencias, valores de mercado, scraping ou APIs externas.
