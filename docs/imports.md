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

## Fora do escopo

Esta fase nao implementa scraping do SoFIFA, API-Football, Sportmonks, Cheat Engine, leitura de memoria do jogo, importacao automatica de transferencias, upload de foto de jogador, valores de mercado avancados, login ou permissoes complexas.
