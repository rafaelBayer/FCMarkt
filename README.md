# FCMarkt - Modo Carreira Fictício

FCMarkt é uma plataforma focada em dados avançados de jogadores e equipes de futebol, inspirada no Transfermarkt. O projeto permite aos usuários criar e acompanhar suas próprias linhas do tempo em um modo carreira fictício. Nele, os usuários podem realizar transferências de jogadores entre equipes, salvar todas as transferências no banco de dados e visualizar os dados de jogadores e equipes ao longo das temporadas.

## Tecnologias Utilizadas

- **Frontend**: Vue.js, Axios, Tailwind CSS
- **Backend**: Node.js, Express
- **Banco de Dados**: MySQL (rodando via Docker)

## Funcionalidades

- Visualizar dados avançados de jogadores e equipes.
- Realizar transferências de jogadores entre equipes.
- Salvar transferências no banco de dados para construção de uma linha do tempo.
- Acompanhar a evolução de sua carreira por temporada, visualizando detalhes de transferências e jogos.

## Como Rodar o Projeto

### Pré-requisitos

- **Node.js** (versão recomendada: 16.x ou superior)
- **Docker** (para o banco de dados MySQL)

### Passo a Passo de Instalação

#### Para Linux:

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/FCMarkt.git
   cd FCMarkt
   ```

2. Navegue até a pasta `frontend` e instale as dependências:
   ```bash
   cd frontend
   npm install
   ```

3. Navegue até a pasta `backend` e instale as dependências:
   ```bash
   cd ../backend
   npm install
   ```

4. Em seguida, configure o Docker para rodar o banco de dados MySQL:
   - Certifique-se de que o Docker esteja rodando:
     ```bash
     sudo systemctl start docker
     ```

   - Na pasta raiz do projeto, execute o comando para iniciar os containers:
     ```bash
     sudo docker-compose up -d
     ```

5. Com o banco de dados rodando, volte para a pasta `backend` e inicie o servidor:
   ```bash
   npm run dev
   ```

6. Agora, no terminal da pasta `frontend`, inicie o servidor de desenvolvimento Vue.js:
   ```bash
   cd ../frontend
   npm run serve
   ```

7. O projeto estará disponível no navegador em `http://localhost:8080`.

#### Para Windows:

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/FCMarkt.git
   cd FCMarkt
   ```

2. Navegue até a pasta `frontend` e instale as dependências:
   ```bash
   cd frontend
   npm install
   ```

3. Navegue até a pasta `backend` e instale as dependências:
   ```bash
   cd ../backend
   npm install
   ```

4. Inicie o Docker Desktop e execute o comando para rodar os containers:
   ```bash
   docker-compose up -d
   ```

5. No terminal, na pasta `backend`, inicie o servidor:
   ```bash
   npm run dev
   ```

6. No terminal da pasta `frontend`, inicie o servidor de desenvolvimento Vue.js:
   ```bash
   cd ../frontend
   npm run serve
   ```

7. O projeto estará disponível no navegador em `http://localhost:8080`.

## Licença

Este projeto é licenciado sob a Licença Pública Geral GNU v3.0 - veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

