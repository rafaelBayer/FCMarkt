import { normalizeName } from "../utils/normalize-name.ts";
import type { CsvRow, ParsedCsv } from "@/services/eafc26-import";

export const EAFC26_DEFAULT_TEAM_CSV = "imports/kaggle/eafc26/EAFC26-Men.csv";
export const EAFC26_TEAM_RECONCILIATION_REPORT =
  "imports/reports/eafc26-team-reconciliation.json";

export type TeamAliasMap = Record<string, string>;

export type TeamReference = {
  id: string;
  name: string;
  short_name?: string | null;
  leagues?: {
    name: string;
    countries?: {
      name: string;
    } | null;
  } | null;
};

export type CsvClubSummary = {
  csvTeam: string;
  playerCount: number;
};

export type ReconciledTeam = CsvClubSummary & {
  teamId: string;
  teamName: string;
  leagueName: string | null;
  countryName: string | null;
};

export type AliasMatch = ReconciledTeam & {
  aliasTarget: string;
};

export type PossibleMatch = CsvClubSummary & {
  candidates: Array<{
    teamId: string;
    teamName: string;
    leagueName: string | null;
    countryName: string | null;
    score: number;
  }>;
};

export type MissingTeam = CsvClubSummary & {
  aliasTarget?: string | null;
};

export type AliasWarning = {
  csvTeam: string;
  aliasTarget: string;
  message: string;
};

export type DuplicateTeamGroup = {
  normalizedName: string;
  teams: Array<{
    teamId: string;
    teamName: string;
    leagueName: string | null;
    countryName: string | null;
  }>;
};

export type TeamReconciliationReport = {
  sourceFile: string;
  clubColumn: string;
  totalRows: number;
  invalidClubRows: number;
  uniqueClubs: number;
  exactMatches: ReconciledTeam[];
  aliasMatches: AliasMatch[];
  possibleMatches: PossibleMatch[];
  missingTeams: MissingTeam[];
  aliasWarnings: AliasWarning[];
  possibleDuplicates: DuplicateTeamGroup[];
  topClubs: CsvClubSummary[];
};

const CLUB_COLUMN_ALIASES = ["club", "club_name", "team", "team_name"];

export function findClubColumn(headers: string[]) {
  return (
    headers.find((header) => CLUB_COLUMN_ALIASES.includes(normalizeColumn(header))) ?? null
  );
}

export function extractCsvClubs(parsed: ParsedCsv, clubColumn = findClubColumn(parsed.headers)) {
  if (!clubColumn) {
    throw new Error("Nao foi possivel identificar a coluna de clube/time no CSV.");
  }

  const counts = new Map<string, number>();
  let invalidClubRows = 0;

  parsed.rows.forEach((row) => {
    const club = getClubName(row, clubColumn);

    if (!club) {
      invalidClubRows += 1;
      return;
    }

    counts.set(club, (counts.get(club) ?? 0) + 1);
  });

  const clubs = [...counts.entries()]
    .map(([csvTeam, playerCount]) => ({ csvTeam, playerCount }))
    .sort((a, b) => b.playerCount - a.playerCount || a.csvTeam.localeCompare(b.csvTeam));

  return { clubColumn, clubs, invalidClubRows };
}

export function buildTeamReconciliationReport({
  sourceFile,
  parsed,
  teams,
  aliases
}: {
  sourceFile: string;
  parsed: ParsedCsv;
  teams: TeamReference[];
  aliases: TeamAliasMap;
}): TeamReconciliationReport {
  const { clubColumn, clubs, invalidClubRows } = extractCsvClubs(parsed);
  const exactTeamMap = buildExactTeamMap(teams);
  const normalizedTeamMap = buildNormalizedTeamMap(teams);
  const aliasMap = buildNormalizedAliasMap(aliases);
  const exactMatches: ReconciledTeam[] = [];
  const aliasMatches: AliasMatch[] = [];
  const possibleMatches: PossibleMatch[] = [];
  const missingTeams: MissingTeam[] = [];
  const aliasWarnings: AliasWarning[] = [];

  clubs.forEach((club) => {
    const exactTeam = exactTeamMap.get(exactKey(club.csvTeam));

    if (exactTeam) {
      exactMatches.push(toReconciledTeam(club, exactTeam));
      return;
    }

    const aliasTarget = aliasMap.get(normalizeName(club.csvTeam));

    if (aliasTarget) {
      const aliasTeam =
        exactTeamMap.get(exactKey(aliasTarget)) ?? normalizedTeamMap.get(normalizeName(aliasTarget))?.[0];

      if (aliasTeam) {
        aliasMatches.push({
          ...toReconciledTeam(club, aliasTeam),
          aliasTarget
        });
        return;
      }

      aliasWarnings.push({
        csvTeam: club.csvTeam,
        aliasTarget,
        message: "Alias aponta para um time que nao existe no Supabase."
      });
      missingTeams.push({ ...club, aliasTarget });
      return;
    }

    const candidates = getPossibleCandidates(club.csvTeam, teams);

    if (candidates.length > 0) {
      possibleMatches.push({ ...club, candidates });
      return;
    }

    missingTeams.push(club);
  });

  return {
    sourceFile,
    clubColumn,
    totalRows: parsed.rows.length,
    invalidClubRows,
    uniqueClubs: clubs.length,
    exactMatches,
    aliasMatches,
    possibleMatches,
    missingTeams,
    aliasWarnings,
    possibleDuplicates: findPossibleDuplicateTeams(teams),
    topClubs: clubs.slice(0, 20)
  };
}

function getClubName(row: CsvRow, clubColumn: string) {
  return String(row[clubColumn] ?? "").trim();
}

function normalizeColumn(value: string) {
  return normalizeName(value).replace(/\s+/g, "_");
}

function exactKey(value: string) {
  return value.trim().toLowerCase();
}

function buildExactTeamMap(teams: TeamReference[]) {
  const map = new Map<string, TeamReference>();

  teams.forEach((team) => {
    map.set(exactKey(team.name), team);

    if (team.short_name) {
      map.set(exactKey(team.short_name), team);
    }
  });

  return map;
}

function buildNormalizedTeamMap(teams: TeamReference[]) {
  const map = new Map<string, TeamReference[]>();

  teams.forEach((team) => {
    const names = [team.name, team.short_name].filter(Boolean) as string[];

    names.forEach((name) => {
      const key = normalizeName(name);
      map.set(key, [...(map.get(key) ?? []), team]);
    });
  });

  return map;
}

function buildNormalizedAliasMap(aliases: TeamAliasMap) {
  const map = new Map<string, string>();

  Object.entries(aliases).forEach(([csvName, targetName]) => {
    map.set(normalizeName(csvName), targetName);
  });

  return map;
}

function toReconciledTeam(club: CsvClubSummary, team: TeamReference): ReconciledTeam {
  return {
    ...club,
    teamId: team.id,
    teamName: team.name,
    leagueName: team.leagues?.name ?? null,
    countryName: team.leagues?.countries?.name ?? null
  };
}

function getPossibleCandidates(csvTeam: string, teams: TeamReference[]) {
  const normalizedCsvTeam = normalizeName(csvTeam);

  return teams
    .map((team) => {
      const score = Math.max(
        similarityScore(normalizedCsvTeam, normalizeName(team.name)),
        team.short_name ? similarityScore(normalizedCsvTeam, normalizeName(team.short_name)) : 0
      );

      return {
        teamId: team.id,
        teamName: team.name,
        leagueName: team.leagues?.name ?? null,
        countryName: team.leagues?.countries?.name ?? null,
        score
      };
    })
    .filter((candidate) => candidate.score >= 0.78)
    .sort((a, b) => b.score - a.score || a.teamName.localeCompare(b.teamName))
    .slice(0, 5);
}

function similarityScore(a: string, b: string) {
  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  if (a.includes(b) || b.includes(a)) {
    return 0.9;
  }

  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function levenshteinDistance(a: string, b: string) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function findPossibleDuplicateTeams(teams: TeamReference[]): DuplicateTeamGroup[] {
  const groups = new Map<string, TeamReference[]>();

  teams.forEach((team) => {
    const key = normalizeName(team.name);
    groups.set(key, [...(groups.get(key) ?? []), team]);
  });

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([normalizedName, group]) => ({
      normalizedName,
      teams: group.map((team) => ({
        teamId: team.id,
        teamName: team.name,
        leagueName: team.leagues?.name ?? null,
        countryName: team.leagues?.countries?.name ?? null
      }))
    }));
}
