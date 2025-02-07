const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();  // Carregar variáveis de ambiente do arquivo .env

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Rota básica
app.get('/', (req, res) => {
  res.send('Servidor backend está funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
