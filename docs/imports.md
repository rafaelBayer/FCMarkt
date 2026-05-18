# Importacoes locais

Esta fase adiciona importacao controlada de jogadores por CSV local. O primeiro formato suportado e o dataset do Kaggle `flynn28/eafc26-player-database`.

## Fonte

Baixe manualmente o dataset no Kaggle e coloque os arquivos CSV em:

```txt
imports/kaggle/eafc26/
```

A pasta `imports/` fica no `.gitignore`. Os CSVs baixados e os relatorios gerados nao devem ser versionados.

## Analise do CSV

Antes de importar, rode:

```bash
npm run analyze:eafc26
```

O script lista os CSVs encontrados, colunas detectadas, quantidade de linhas e exemplos das primeiras linhas. Ele nao acessa o banco e nao insere dados.

## Dry Run

Rode primeiro:

```bash
npm run import:eafc26:players:dry
```

ou:

```bash
npm run import:eafc26:players -- --dry-run
```

O dry run le os CSVs, valida os jogadores, detecta duplicidades possiveis e gera relatorio sem inserir nada no banco.

## Importacao Real

Depois de conferir o dry run, execute explicitamente:

```bash
npm run import:eafc26:players -- --execute
```

Sem `--execute`, o importador fica em dry run por seguranca.

## Dados importados

O importador cria somente jogadores validos em `players`:

- `name`
- `known_name`
- `nationality`
- `birth_date`
- `main_position`
- `overall`
- `potential`
- `photo_url`
- `external_source`
- `external_id`

Jogadores podem ser importados sem time. Nesta fase, o importador nao cria times, ligas, transferencias ou vinculos de elenco.

## Duplicidade

Quando houver `external_source` e `external_id`, o importador usa esses campos para evitar duplicidade. Quando nao houver ID externo, ele usa heuristicas simples por nome e data de nascimento, ou por nome, nacionalidade e posicao.

O banco possui indice unico parcial para `players(external_source, external_id)` quando ambos os campos existem.

## Relatorios

Os relatorios sao salvos em:

```txt
imports/reports/
```

Cada relatorio mostra:

- arquivo processado;
- total de linhas lidas;
- jogadores validos e invalidos;
- jogadores que seriam criados;
- jogadores ignorados por duplicidade;
- campos ausentes;
- times nao encontrados;
- erros e avisos;
- exemplos de jogadores importaveis.

## Reconciliacao de times

A reconciliacao compara os clubes encontrados no CSV com os times cadastrados no Supabase. Ela serve para revisar nomes diferentes antes de qualquer tentativa futura de criar vinculos de elenco.

Rode:

```bash
npm run analyze:eafc26:teams
```

O script usa o arquivo:

```txt
imports/kaggle/eafc26/EAFC26-Men.csv
```

Ele identifica a coluna de clube/time, conta jogadores por clube, busca os times existentes no Supabase e gera um relatorio com:

- matches exatos;
- matches por alias manual;
- possiveis matches por normalizacao;
- clubes nao encontrados;
- aliases que apontam para times inexistentes;
- possiveis duplicados no Supabase.

O arquivo de aliases fica em:

```txt
src/data/import-maps/team-aliases.json
```

Cada alias aponta do nome encontrado no CSV para o nome esperado no Supabase:

```json
{
  "Manchester Utd": "Manchester United"
}
```

O relatorio JSON e salvo em:

```txt
imports/reports/eafc26-team-reconciliation.json
```

Times nao encontrados devem ser revisados manualmente. Esta fase nao cria times, ligas, jogadores, vinculos de elenco ou transferencias automaticamente.

## Fora do escopo

Esta fase nao implementa scraping do SoFIFA, API-Football, Sportmonks, Cheat Engine, leitura de memoria do jogo, importacao automatica de transferencias, upload de foto de jogador, valores de mercado avancados, login ou permissoes complexas.
