import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Database } from "@/types/database";

export const EAFC26_SOURCE = "kaggle_eafc26";
export const DEFAULT_EAFC26_IMPORT_DIR = path.join("imports", "kaggle", "eafc26");
export const DEFAULT_IMPORT_REPORT_DIR = path.join("imports", "reports");

export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

export type MappedPlayer = Database["public"]["Tables"]["players"]["Insert"];

export type ExistingPlayerKey = {
  name: string;
  known_name?: string | null;
  birth_date?: string | null;
  nationality?: string | null;
  main_position?: string | null;
  external_source?: string | null;
  external_id?: string | null;
};

export type ImportPlanOptions = {
  existingPlayers?: ExistingPlayerKey[];
  knownTeamNames?: string[];
};

export type ImportIssue = {
  rowNumber: number;
  message: string;
};

export type ImportPlan = {
  source: string;
  dryRun: boolean;
  fileName: string;
  totalRows: number;
  validPlayers: number;
  invalidPlayers: number;
  wouldCreate: number;
  duplicates: number;
  missingFields: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  notFoundTeams: string[];
  examples: MappedPlayer[];
  playersToCreate: MappedPlayer[];
  transfersToCreate: [];
  squadMembershipsToCreate: [];
};

export type ImportExecutionResult = ImportPlan & {
  insertedPlayers: number;
};

type ColumnRole =
  | "externalId"
  | "name"
  | "knownName"
  | "nationality"
  | "birthDate"
  | "mainPosition"
  | "overall"
  | "potential"
  | "photoUrl"
  | "teamName";

const COLUMN_ALIASES: Record<ColumnRole, string[]> = {
  externalId: ["id", "player_id", "sofifa_id", "ea_id", "uid"],
  name: ["name", "long_name", "full_name", "player_name"],
  knownName: ["known_name", "short_name", "common_name"],
  nationality: ["nationality", "nation", "country"],
  birthDate: ["birth_date", "dob", "date_of_birth"],
  mainPosition: ["main_position", "position", "player_positions", "positions"],
  overall: ["overall", "ovr", "ova", "rating"],
  potential: ["potential", "pot"],
  photoUrl: ["photo_url", "player_face_url", "image_url", "card", "photo"],
  teamName: ["club", "club_name", "team", "team_name"]
};

const USEFUL_ROLES: ColumnRole[] = [
  "externalId",
  "name",
  "knownName",
  "nationality",
  "birthDate",
  "mainPosition",
  "overall",
  "potential",
  "photoUrl",
  "teamName"
];

export async function findCsvFiles(importDir = DEFAULT_EAFC26_IMPORT_DIR) {
  const entries = await readdir(importDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".csv"))
    .map((entry) => path.join(importDir, entry.name))
    .sort();
}

export async function parseCsvFile(filePath: string) {
  const content = await readFile(filePath, "utf8");
  return parseCsv(content);
}

export function parseCsv(content: string): ParsedCsv {
  const normalizedContent = stripBom(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const delimiter = detectDelimiter(normalizedContent);
  const records = parseRecords(normalizedContent, delimiter).filter((record) =>
    record.some((value) => value.trim())
  );

  const [rawHeaders, ...dataRows] = records;
  const headers = (rawHeaders ?? []).map((header) => header.trim());

  const rows = dataRows.map((record) => {
    const row: CsvRow = {};

    headers.forEach((header, index) => {
      row[header] = record[index]?.trim() ?? "";
    });

    return row;
  });

  return { headers, rows };
}

export function analyzeCsvContent(content: string, fileName: string) {
  const parsed = parseCsv(content);
  const usefulColumns = findUsefulColumns(parsed.headers);

  return {
    fileName,
    rowCount: parsed.rows.length,
    headers: parsed.headers,
    usefulColumns,
    sampleRows: parsed.rows.slice(0, 3)
  };
}

export function findUsefulColumns(headers: string[]) {
  return USEFUL_ROLES.map((role) => ({
    role,
    column: findColumn(headers, COLUMN_ALIASES[role])
  })).filter((match) => match.column);
}

export function mapEafc26Row(row: CsvRow, headers = Object.keys(row)) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const name = getValue(row, headers, COLUMN_ALIASES.name);

  if (!name) {
    errors.push("Jogador sem nome.");
  }

  const birthDate = normalizeDate(getValue(row, headers, COLUMN_ALIASES.birthDate));
  const overall = normalizeRating(getValue(row, headers, COLUMN_ALIASES.overall), "Overall", warnings);
  const potential = normalizeRating(
    getValue(row, headers, COLUMN_ALIASES.potential),
    "Potencial",
    warnings
  );
  const positions = getValue(row, headers, COLUMN_ALIASES.mainPosition);
  const sourceTeamName = getValue(row, headers, COLUMN_ALIASES.teamName);
  const externalId = getValue(row, headers, COLUMN_ALIASES.externalId);

  if (birthDate === "invalid") {
    warnings.push("Data de nascimento invalida foi ignorada.");
  }

  if (errors.length > 0) {
    return { player: null, sourceTeamName, warnings, errors };
  }

  const player: MappedPlayer = {
    name,
    known_name: nullableText(getValue(row, headers, COLUMN_ALIASES.knownName)),
    nationality: nullableText(getValue(row, headers, COLUMN_ALIASES.nationality)),
    birth_date: birthDate === "invalid" ? null : birthDate,
    main_position: nullableText(normalizePosition(positions)),
    overall,
    potential,
    photo_url: nullableText(getValue(row, headers, COLUMN_ALIASES.photoUrl)),
    external_source: EAFC26_SOURCE,
    external_id: nullableText(externalId)
  };

  return { player, sourceTeamName, warnings, errors };
}

export function buildImportPlan(
  rows: CsvRow[],
  headers: string[],
  fileName: string,
  dryRun: boolean,
  options: ImportPlanOptions = {}
): ImportPlan {
  const existingPlayers = options.existingPlayers ?? [];
  const knownTeamNames = new Set((options.knownTeamNames ?? []).map(normalizeKey));
  const existingExternalKeys = new Set(
    existingPlayers
      .filter((player) => player.external_source && player.external_id)
      .map((player) => externalKey(player.external_source, player.external_id))
  );
  const existingHeuristicKeys = new Set(existingPlayers.map(heuristicPlayerKey).filter(Boolean));
  const seenExternalKeys = new Set<string>();
  const seenHeuristicKeys = new Set<string>();
  const notFoundTeams = new Set<string>();
  const playersToCreate: MappedPlayer[] = [];
  const errors: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  let validPlayers = 0;
  let invalidPlayers = 0;
  let duplicates = 0;
  let missingFields = 0;

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const mapped = mapEafc26Row(row, headers);

    mapped.warnings.forEach((message) => warnings.push({ rowNumber, message }));

    if (mapped.errors.length > 0 || !mapped.player) {
      invalidPlayers += 1;
      mapped.errors.forEach((message) => errors.push({ rowNumber, message }));
      return;
    }

    const player = mapped.player;
    validPlayers += 1;

    if (!player.nationality || !player.birth_date || !player.main_position || !player.external_id) {
      missingFields += 1;
    }

    if (mapped.sourceTeamName && knownTeamNames.size > 0 && !knownTeamNames.has(normalizeKey(mapped.sourceTeamName))) {
      notFoundTeams.add(mapped.sourceTeamName);
    }

    const externalDuplicateKey = player.external_id
      ? externalKey(player.external_source, player.external_id)
      : null;
    const heuristicKey = heuristicPlayerKey(player);
    const isDuplicate =
      (externalDuplicateKey &&
        (existingExternalKeys.has(externalDuplicateKey) || seenExternalKeys.has(externalDuplicateKey))) ||
      (!externalDuplicateKey &&
        heuristicKey &&
        (existingHeuristicKeys.has(heuristicKey) || seenHeuristicKeys.has(heuristicKey)));

    if (isDuplicate) {
      duplicates += 1;
      return;
    }

    if (externalDuplicateKey) {
      seenExternalKeys.add(externalDuplicateKey);
    }

    if (heuristicKey) {
      seenHeuristicKeys.add(heuristicKey);
    }

    playersToCreate.push(player);
  });

  return {
    source: EAFC26_SOURCE,
    dryRun,
    fileName,
    totalRows: rows.length,
    validPlayers,
    invalidPlayers,
    wouldCreate: playersToCreate.length,
    duplicates,
    missingFields,
    errors,
    warnings,
    notFoundTeams: [...notFoundTeams].sort(),
    examples: playersToCreate.slice(0, 5),
    playersToCreate,
    transfersToCreate: [],
    squadMembershipsToCreate: []
  };
}

export async function executeImportPlan(
  plan: ImportPlan,
  options: {
    insertPlayers: (players: MappedPlayer[]) => Promise<number>;
  }
): Promise<ImportExecutionResult> {
  if (plan.dryRun || plan.playersToCreate.length === 0) {
    return { ...plan, insertedPlayers: 0 };
  }

  const insertedPlayers = await options.insertPlayers(plan.playersToCreate);
  return { ...plan, insertedPlayers };
}

export function ensureSquadLinkRequiresSeason(options: {
  createSquadMembership?: boolean;
  seasonId?: string | null;
}) {
  if (options.createSquadMembership && !nullableText(options.seasonId)) {
    throw new Error("Qualquer vinculo de elenco importado precisa de temporada.");
  }
}

export async function writeImportReport(report: ImportExecutionResult, reportDir = DEFAULT_IMPORT_REPORT_DIR) {
  await mkdir(reportDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(reportDir, `eafc26-player-import-${timestamp}.json`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return reportPath;
}

function stripBom(value: string) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function detectDelimiter(content: string) {
  const [firstLine = ""] = content.split("\n");
  const candidates = [",", ";", "\t"];

  return candidates
    .map((delimiter) => ({
      delimiter,
      count: parseRecords(firstLine, delimiter)[0]?.length ?? 0
    }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ",";
}

function parseRecords(content: string, delimiter: string) {
  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRecord.push(currentValue);
      currentValue = "";
      continue;
    }

    if (char === "\n" && !inQuotes) {
      currentRecord.push(currentValue);
      records.push(currentRecord);
      currentRecord = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue || currentRecord.length > 0) {
    currentRecord.push(currentValue);
    records.push(currentRecord);
  }

  return records;
}

function findColumn(headers: string[], aliases: string[]) {
  const normalizedAliases = new Set(aliases.map(normalizeColumn));
  return headers.find((header) => normalizedAliases.has(normalizeColumn(header))) ?? null;
}

function getValue(row: CsvRow, headers: string[], aliases: string[]) {
  const column = findColumn(headers, aliases);
  return nullableText(column ? row[column] : null) ?? "";
}

function nullableText(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeColumn(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizePosition(value: string | null) {
  const [mainPosition = ""] = String(value ?? "").split(/[,\s/|]+/);
  return mainPosition.toUpperCase();
}

function normalizeRating(value: string | null, label: string, warnings: string[]) {
  const text = nullableText(value);

  if (!text) {
    return null;
  }

  const number = Number(text.replace(",", "."));

  if (!Number.isFinite(number)) {
    warnings.push(`${label} invalido foi ignorado.`);
    return null;
  }

  return Math.trunc(number);
}

function normalizeDate(value: string | null) {
  const text = nullableText(value);

  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ? "invalid" : text;
  }

  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (!match) {
    return "invalid";
  }

  const [, first, second, year] = match;
  const day = Number(first) > 12 ? first : second;
  const month = Number(first) > 12 ? second : first;
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

  return Number.isNaN(Date.parse(`${normalized}T00:00:00Z`)) ? "invalid" : normalized;
}

function externalKey(source?: string | null, id?: string | null) {
  return `${normalizeKey(source)}:${normalizeKey(id)}`;
}

function heuristicPlayerKey(player: ExistingPlayerKey) {
  if (player.birth_date) {
    return `${normalizeKey(player.name)}:${player.birth_date}`;
  }

  if (player.nationality && player.main_position) {
    return `${normalizeKey(player.name)}:${normalizeKey(player.nationality)}:${normalizeKey(player.main_position)}`;
  }

  return "";
}

function normalizeKey(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}
