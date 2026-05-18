/*
 * Copyright (C) 2025 Rafael Bayer
 * 
 * This file is part of FCMarkt.
 * 
 * FCMarkt is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * FCMarkt is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with FCMarkt.  If not, see <https://www.gnu.org/licenses/>.
 */
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
