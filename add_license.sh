#!/bin/bash

# Defina o texto do comentário de licença
LICENSE_TEXT="/*
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
 */"

# Encontre todos os arquivos de código e adicione o comentário de licença
for file in $(find . -type f \( -iname "*.js" -o -iname "*.php" -o -iname "*.html" -o -iname "*.css" \)); do
  # Adicionar o comentário no início do arquivo
  echo -e "$LICENSE_TEXT\n$(cat $file)" > $file
  echo "Licença adicionada a: $file"
done
