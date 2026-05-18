import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.ts";
import { parseCsvFile } from "../src/services/eafc26-import.ts";
import {
  EAFC26_DEFAULT_TEAM_CSV,
  EAFC26_TEAM_RECONCILIATION_REPORT,
  buildTeamReconciliationReport,
  type TeamAliasMap,
  type TeamReference
} from "../src/services/eafc26-team-reconciliation.ts";

type AppSupabaseClient = SupabaseClient<Database>;

const ALIASES_FILE = "src/data/import-maps/team-aliases.json";

loadEnvFile(".env.local");
loadEnvFile(".env");

async function main() {
  const sourceFile = path.resolve(process.cwd(), EAFC26_DEFAULT_TEAM_CSV);

  if (!existsSync(sourceFile)) {
    throw new Error(`CSV nao encontrado em ${EAFC26_DEFAULT_TEAM_CSV}. Coloque o arquivo local antes de rodar a analise.`);
  }

  const supabase = createSupabaseClient();
  const parsed = await parseCsvFile(sourceFile);
  const aliases = loadAliases();
  const teams = await getTeams(supabase);
  const report = buildTeamReconciliationReport({
    sourceFile: EAFC26_DEFAULT_TEAM_CSV,
    parsed,
    teams,
    aliases
  });
  const reportPath = await writeReport(report);

  printReport(report, reportPath);
}

async function getTeams(supabase: AppSupabaseClient): Promise<TeamReference[]> {
  const { data, error } = await supabase.from("teams").select("id, name, short_name, leagues(name, countries(name))");

  if (error) {
    throw new Error(`Erro ao buscar times no Supabase: ${error.message}`);
  }

  return (data ?? []) as TeamReference[];
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY antes da analise.");
  }

  return createClient<Database>(url, key);
}

function loadAliases(): TeamAliasMap {
  const aliasesPath = path.resolve(process.cwd(), ALIASES_FILE);

  if (!existsSync(aliasesPath)) {
    return {};
  }

  return JSON.parse(readFileSync(aliasesPath, "utf8")) as TeamAliasMap;
}

async function writeReport(report: Awaited<ReturnType<typeof buildTeamReconciliationReport>>) {
  const reportPath = path.resolve(process.cwd(), EAFC26_TEAM_RECONCILIATION_REPORT);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return EAFC26_TEAM_RECONCILIATION_REPORT;
}

function printReport(
  report: Awaited<ReturnType<typeof buildTeamReconciliationReport>>,
  reportPath: string
) {
  console.log("FCMarkt - reconciliacao de times EAFC26");
  console.log(`Arquivo analisado: ${report.sourceFile}`);
  console.log(`Coluna de clube: ${report.clubColumn}`);
  console.log(`Jogadores lidos: ${report.totalRows}`);
  console.log(`Clubes unicos no CSV: ${report.uniqueClubs}`);
  console.log(`Matches exatos: ${report.exactMatches.length}`);
  console.log(`Matches por alias: ${report.aliasMatches.length}`);
  console.log(`Possiveis matches: ${report.possibleMatches.length}`);
  console.log(`Clubes nao encontrados: ${report.missingTeams.length}`);
  console.log(`Aliases com alerta: ${report.aliasWarnings.length}`);
  console.log(`Possiveis duplicados no Supabase: ${report.possibleDuplicates.length}`);
  console.log(`Relatorio salvo em: ${reportPath}`);

  if (report.topClubs.length > 0) {
    console.log("");
    console.log("Top clubes por quantidade de jogadores:");
    report.topClubs.slice(0, 10).forEach((club) => {
      console.log(`- ${club.csvTeam}: ${club.playerCount}`);
    });
  }

  if (report.aliasWarnings.length > 0) {
    console.log("");
    console.log("Aliases que precisam de revisao:");
    report.aliasWarnings.forEach((warning) => {
      console.log(`- ${warning.csvTeam} -> ${warning.aliasTarget}: ${warning.message}`);
    });
  }

  if (report.missingTeams.length > 0) {
    console.log("");
    console.log("Primeiros clubes nao encontrados:");
    report.missingTeams.slice(0, 20).forEach((club) => {
      console.log(`- ${club.csvTeam} (${club.playerCount})`);
    });
  }
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
