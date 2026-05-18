import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_EAFC26_IMPORT_DIR,
  analyzeCsvContent,
  findCsvFiles
} from "../src/services/eafc26-import.ts";

async function main() {
  const importDir = path.resolve(process.cwd(), DEFAULT_EAFC26_IMPORT_DIR);

  console.log("FCMarkt - analise de CSV EAFC26");
  console.log(`Pasta analisada: ${importDir}`);

  let files: string[] = [];

  try {
    files = await findCsvFiles(importDir);
  } catch {
    console.log("Nenhuma pasta de importacao encontrada.");
    console.log("Crie imports/kaggle/eafc26/ e coloque os CSVs baixados manualmente do Kaggle.");
    return;
  }

  if (files.length === 0) {
    console.log("Nenhum CSV encontrado.");
    return;
  }

  console.log(`Arquivos encontrados: ${files.length}`);

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const content = await readFile(filePath, "utf8");
    const analysis = analyzeCsvContent(content, fileName);

    console.log("");
    console.log(`Arquivo: ${analysis.fileName}`);
    console.log(`Linhas de dados: ${analysis.rowCount}`);
    console.log(`Colunas (${analysis.headers.length}): ${analysis.headers.join(", ")}`);
    console.log("Colunas uteis detectadas:");

    if (analysis.usefulColumns.length === 0) {
      console.log("- Nenhuma coluna reconhecida automaticamente.");
    } else {
      analysis.usefulColumns.forEach((column) => {
        console.log(`- ${column.role}: ${column.column}`);
      });
    }

    console.log("Exemplos:");
    analysis.sampleRows.forEach((row, index) => {
      console.log(`- Linha ${index + 2}: ${JSON.stringify(row)}`);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
