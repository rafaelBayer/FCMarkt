import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.ts";
import {
  DEFAULT_EAFC26_IMPORT_DIR,
  buildImportPlan,
  executeImportPlan,
  findCsvFiles,
  parseCsvFile,
  writeImportReport,
  type ExistingPlayerKey,
  type MappedPlayer
} from "../src/services/eafc26-import.ts";

type AppSupabaseClient = SupabaseClient<Database>;

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes("--execute");
  const dryRun = args.includes("--dry-run") || process.env.EAFC26_IMPORT_DRY_RUN === "1" || !execute;
  const importDir = path.resolve(process.cwd(), DEFAULT_EAFC26_IMPORT_DIR);
  const supabase = createOptionalSupabaseClient();

  console.log("FCMarkt - importacao de jogadores EAFC26");
  console.log(`Modo: ${dryRun ? "dry run" : "importacao real"}`);
  console.log(`Pasta: ${importDir}`);

  if (!dryRun && !supabase) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY antes da importacao real.");
  }

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

  const { existingPlayers, knownTeamNames } = supabase
    ? await loadReferenceData(supabase, dryRun)
    : { existingPlayers: [], knownTeamNames: [] };

  if (!supabase) {
    console.log("Supabase nao configurado. O dry run seguira sem comparar duplicados ja existentes no banco.");
  }

  for (const filePath of files) {
    const parsed = await parseCsvFile(filePath);
    const fileName = path.basename(filePath);
    const plan = buildImportPlan(parsed.rows, parsed.headers, fileName, dryRun, {
      existingPlayers,
      knownTeamNames
    });
    const result = await executeImportPlan(plan, {
      insertPlayers: async (players) => insertPlayers(supabase, players)
    });
    const reportPath = await writeImportReport(result);

    existingPlayers.push(...plan.playersToCreate);
    printReport(result, reportPath);
  }
}

async function getExistingPlayers(supabase: AppSupabaseClient): Promise<ExistingPlayerKey[]> {
  const { data, error } = await supabase
    .from("players")
    .select("name, known_name, birth_date, nationality, main_position, external_source, external_id");

  if (error) {
    throw new Error(`Erro ao buscar jogadores existentes: ${error.message}`);
  }

  return data ?? [];
}

async function getKnownTeamNames(supabase: AppSupabaseClient) {
  const { data, error } = await supabase.from("teams").select("name, short_name");

  if (error) {
    throw new Error(`Erro ao buscar times existentes: ${error.message}`);
  }

  return (data ?? []).flatMap((team) => [team.name, team.short_name].filter(Boolean) as string[]);
}

async function loadReferenceData(supabase: AppSupabaseClient, dryRun: boolean) {
  try {
    const [existingPlayers, knownTeamNames] = await Promise.all([
      getExistingPlayers(supabase),
      getKnownTeamNames(supabase)
    ]);

    return { existingPlayers, knownTeamNames };
  } catch (error) {
    if (!dryRun) {
      throw error;
    }

    console.log(
      "Nao foi possivel consultar o Supabase. O dry run seguira sem comparar dados ja existentes no banco."
    );
    console.log(error instanceof Error ? error.message : String(error));
    return { existingPlayers: [], knownTeamNames: [] };
  }
}

async function insertPlayers(supabase: AppSupabaseClient | null, players: MappedPlayer[]) {
  if (!supabase) {
    throw new Error("Supabase nao configurado.");
  }

  const { error } = await supabase.from("players").insert(players);

  if (error) {
    throw new Error(`Erro ao inserir jogadores: ${error.message}`);
  }

  return players.length;
}

function createOptionalSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient<Database>(url, key);
}

function loadEnvFile(fileName: string) {
  const filePath = path.resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  });
}

function printReport(result: Awaited<ReturnType<typeof executeImportPlan>>, reportPath: string) {
  console.log("");
  console.log(`Arquivo processado: ${result.fileName}`);
  console.log(`Linhas lidas: ${result.totalRows}`);
  console.log(`Jogadores validos: ${result.validPlayers}`);
  console.log(`Jogadores invalidos: ${result.invalidPlayers}`);
  console.log(`Jogadores que seriam criados: ${result.wouldCreate}`);
  console.log(`Jogadores inseridos: ${result.insertedPlayers}`);
  console.log(`Ignorados por duplicidade: ${result.duplicates}`);
  console.log(`Jogadores com campos ausentes: ${result.missingFields}`);
  console.log(`Times nao encontrados: ${result.notFoundTeams.length}`);
  console.log(`Erros: ${result.errors.length}`);
  console.log(`Relatorio salvo em: ${reportPath}`);

  if (result.examples.length > 0) {
    console.log("Exemplos importaveis:");
    result.examples.forEach((player) => {
      console.log(`- ${player.known_name || player.name} (${player.nationality ?? "sem nacionalidade"})`);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
