import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env");

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY ?? process.env.API_SPORTS_KEY;
const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
const THE_SPORTS_DB_API_KEY = process.env.THE_SPORTS_DB_API_KEY ?? "123";
const THE_SPORTS_DB_BASE_URL = `https://www.thesportsdb.com/api/v1/json/${THE_SPORTS_DB_API_KEY}`;
const REQUEST_DELAY_MS = 2300;

const LEAGUE_SOURCES = [
  source("ENG", ["England"], "Premier League", 39, 2025, 20, ["Premier League"], [
    "English Premier League",
    "English_Premier_League"
  ]),
  source("ES", ["Spain"], "La Liga", 140, 2025, 20, ["La Liga", "LaLiga"], [
    "Spanish La Liga",
    "Spanish_La_Liga",
    "La Liga"
  ]),
  source("DE", ["Germany"], "Bundesliga", 78, 2025, 18, ["Bundesliga"], [
    "German Bundesliga",
    "German_Bundesliga",
    "Bundesliga"
  ]),
  source("IT", ["Italy"], "Serie A", 135, 2025, 20, ["Serie A"], [
    "Italian Serie A",
    "Italian_Serie_A",
    "Serie A"
  ]),
  source("FR", ["France"], "Ligue 1", 61, 2025, 18, ["Ligue 1"], [
    "French Ligue 1",
    "French_Ligue_1",
    "Ligue 1"
  ]),
  source("PT", ["Portugal"], "Liga Portugal", 94, 2025, 18, ["Liga Portugal", "Primeira Liga"], [
    "Portuguese Primeira Liga",
    "Portuguese_Primeira_Liga",
    "Primeira Liga"
  ]),
  source("NL", ["Netherlands"], "Eredivisie", 88, 2025, 18, ["Eredivisie"], [
    "Dutch Eredivisie",
    "Dutch_Eredivisie",
    "Eredivisie"
  ]),
  source("BE", ["Belgium"], "Belgian Pro League", 144, 2025, 16, ["Jupiler Pro League", "Belgian Pro League"], [
    "Belgian Pro League",
    "Belgian_Pro_League",
    "Jupiler Pro League"
  ]),
  source("DK", ["Denmark"], "Danish Superliga", 119, 2025, 12, ["Superliga", "Danish Superliga"], [
    "Danish Superliga",
    "Danish_Superliga",
    "Superliga"
  ]),
  source("SCO", ["Scotland"], "Scottish Premiership", 179, 2025, 12, ["Premiership", "Scottish Premiership"], [
    "Scottish Premiership",
    "Scottish_Premiership"
  ]),
  source("SA", ["Saudi Arabia"], "Saudi Pro League", 307, 2025, 18, ["Saudi Pro League", "Pro League"], [
    "Saudi Pro League",
    "Saudi_Pro_League"
  ]),
  source("US", ["United States", "United States of America"], "Major League Soccer", 253, 2026, 30, [
    "Major League Soccer",
    "MLS"
  ], ["American Major League Soccer", "American_Major_League_Soccer", "Major League Soccer"]),
  source("MX", ["Mexico"], "Liga MX", 262, 2025, 18, ["Liga MX"], [
    "Mexican Liga MX",
    "Mexican_Liga_MX",
    "Liga MX"
  ]),
  source("BR", ["Brazil"], "Campeonato Brasileiro Serie A", 71, 2026, 20, [
    "Serie A",
    "Brasileiro Serie A",
    "Campeonato Brasileiro Serie A"
  ], ["Brazilian Serie A", "Brazilian_Serie_A", "Campeonato Brasileiro Serie A"]),
  source("AR", ["Argentina"], "Liga Profesional de Futbol", 128, 2026, 30, [
    "Liga Profesional Argentina",
    "Liga Profesional",
    "Primera Division"
  ], ["Argentinian Primera Division", "Argentinian_Primera_Division", "Liga Profesional de Futbol"]),
  source("UY", ["Uruguay"], "Liga AUF Uruguaya", 268, 2026, 16, [
    "Primera Division - Apertura",
    "Primera Division",
    "Liga AUF Uruguaya"
  ], ["Uruguayan Primera Division", "Uruguayan_Primera_Division", "Liga AUF Uruguaya"]),
  source("PY", ["Paraguay"], "Division Profesional", 250, 2026, 12, [
    "Division Profesional - Apertura",
    "Division Profesional"
  ], ["Paraguayan Primera Division", "Paraguayan_Primera_Division", "Paraguayan Division Profesional"]),
  source("CL", ["Chile"], "Liga de Primera", 265, 2026, 16, [
    "Primera Division",
    "Liga de Primera"
  ], ["Chilean Primera Division", "Chilean_Primera_Division", "Liga de Primera"]),
  source("CO", ["Colombia"], "Categoria Primera A", 239, 2026, 20, [
    "Primera A",
    "Categoria Primera A"
  ], ["Colombian Categoria Primera A", "Colombian_Categoria_Primera_A", "Categoria Primera A"]),
  source("PE", ["Peru"], "Liga 1", 281, 2026, 18, ["Primera Division", "Liga 1"], [
    "Peruvian Primera Division",
    "Peruvian_Primera_Division",
    "Liga 1 Peru"
  ]),
  source("EC", ["Ecuador"], "LigaPro Serie A", 242, 2026, 16, ["Liga Pro", "LigaPro Serie A", "Serie A"], [
    "Ecuadorian Serie A",
    "Ecuadorian_Serie_A",
    "LigaPro Serie A"
  ]),
  source("BO", ["Bolivia"], "Division Profesional", 344, 2026, 16, [
    "Primera Division",
    "Division Profesional"
  ], ["Bolivian Primera Division", "Bolivian_Primera_Division", "Bolivian Division Profesional"]),
  source("VE", ["Venezuela"], "Liga FUTVE", 299, 2026, 14, ["Primera Division", "Liga FUTVE"], [
    "Venezuelan Primera Division",
    "Venezuelan_Primera_Division",
    "Liga FUTVE"
  ])
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY antes de rodar o seed."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const leagues = await loadLeagues();
const existingTeamsByLeague = await loadExistingTeamsByLeague();
const summary = {
  inserted: 0,
  alreadyExisting: 0,
  skippedLeagues: 0,
  incompleteSources: [],
  emptySources: []
};

for (const sourceConfig of LEAGUE_SOURCES) {
  const league = findLeague(sourceConfig, leagues);

  if (!league) {
    summary.skippedLeagues += 1;
    console.warn(`Liga nao encontrada no Supabase: ${sourceConfig.countryCode} - ${sourceConfig.leagueName}`);
    continue;
  }

  const providerResult = await fetchTeams(sourceConfig);

  if (providerResult.teams.length === 0) {
    summary.emptySources.push(`${sourceConfig.leagueName} (${sourceConfig.countryCode})`);
    console.warn(`Nenhum time encontrado na fonte para ${sourceConfig.leagueName}.`);
    continue;
  }

  if (!hasExpectedTeamCount(providerResult.teams, sourceConfig.expectedTeams)) {
    summary.incompleteSources.push(
      `${sourceConfig.leagueName} (${providerResult.teams.length}/${sourceConfig.expectedTeams}) via ${providerResult.provider}`
    );
    console.warn(
      `Fonte ignorada para ${sourceConfig.leagueName}: retornou ${providerResult.teams.length}, esperado ${sourceConfig.expectedTeams}.`
    );
    continue;
  }

  const existingTeams = existingTeamsByLeague.get(league.id) ?? [];
  const rows = providerResult.teams.map((team) => providerResult.toRow(team, league.id));
  const newRows = rows.filter((row) => !isAlreadyCreated(row, existingTeams));

  if (newRows.length === 0) {
    summary.alreadyExisting += rows.length;
    console.log(`${sourceConfig.leagueName}: todos os ${rows.length} times ja existem.`);
    continue;
  }

  const { error } = await supabase.from("teams").insert(newRows);

  if (error) {
    throw new Error(`Erro ao cadastrar times de ${sourceConfig.leagueName}: ${error.message}`);
  }

  summary.inserted += newRows.length;
  summary.alreadyExisting += rows.length - newRows.length;
  existingTeams.push(...newRows);
  existingTeamsByLeague.set(league.id, existingTeams);
  console.log(
    `${sourceConfig.leagueName}: ${newRows.length} novos, ${rows.length - newRows.length} ja existentes via ${providerResult.provider}.`
  );
}

console.log(`Seed concluido: ${summary.inserted} novos times cadastrados.`);

if (summary.alreadyExisting > 0) {
  console.log(`Times ignorados por ja existirem: ${summary.alreadyExisting}.`);
}

if (summary.skippedLeagues > 0) {
  console.log(`Ligas nao encontradas no banco: ${summary.skippedLeagues}. Rode npm run seed:leagues primeiro.`);
}

if (summary.emptySources.length > 0) {
  console.log("Sem retorno da fonte para:");
  summary.emptySources.forEach((league) => console.log(`- ${league}`));
}

if (summary.incompleteSources.length > 0) {
  console.log("Fontes ignoradas por retorno parcial/inconsistente:");
  summary.incompleteSources.forEach((league) => console.log(`- ${league}`));
}

async function fetchTeams(sourceConfig) {
  if (API_FOOTBALL_KEY) {
    const apiFootballTeams = await fetchTeamsFromApiFootball(sourceConfig);

    if (apiFootballTeams.teams.length > 0) {
      return apiFootballTeams;
    }
  }

  const theSportsDbTeams = await fetchTeamsFromTheSportsDb(sourceConfig);

  if (theSportsDbTeams.teams.length > 0) {
    return theSportsDbTeams;
  }

  return {
    provider: "nenhuma fonte",
    teams: [],
    toRow: () => null
  };
}

async function fetchTeamsFromApiFootball(sourceConfig) {
  const leagueId = sourceConfig.apiFootball.leagueId;
  const data = await fetchApiFootballJson(
    `/teams?league=${leagueId}&season=${sourceConfig.apiFootball.season}`
  );
  const teams = Array.isArray(data.response) ? data.response : [];

  return {
    provider: `API-Football league=${leagueId} season=${sourceConfig.apiFootball.season}`,
    teams,
    toRow: toApiFootballTeamRow
  };
}

async function fetchApiFootballJson(path) {
  const response = await fetch(`${API_FOOTBALL_BASE_URL}${path}`, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY
    }
  });

  if (!response.ok) {
    console.warn(`API-Football respondeu ${response.status} para ${path}.`);
    return { response: [] };
  }

  const data = await response.json();
  const errors = extractApiFootballErrors(data.errors);

  if (errors.length > 0) {
    console.warn(`API-Football retornou erro para ${path}: ${errors.join(" | ")}`);
  }

  return data;
}

async function fetchTeamsFromTheSportsDb(sourceConfig) {
  for (const providerLeague of sourceConfig.theSportsDbLeagues) {
    const teams = await fetchTheSportsDbLeagueTeams(providerLeague);

    if (teams.length > 0) {
      return {
        provider: `TheSportsDB ${providerLeague}`,
        teams,
        toRow: toTheSportsDbTeamRow
      };
    }

    await delay(REQUEST_DELAY_MS);
  }

  return {
    provider: "TheSportsDB",
    teams: [],
    toRow: toTheSportsDbTeamRow
  };
}

async function fetchTheSportsDbLeagueTeams(providerLeague) {
  const url = `${THE_SPORTS_DB_BASE_URL}/search_all_teams.php?l=${encodeURIComponent(providerLeague)}`;
  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`TheSportsDB respondeu ${response.status} para ${providerLeague}.`);
    return [];
  }

  const data = await response.json();
  return Array.isArray(data.teams) ? data.teams.filter((team) => team.strSport === "Soccer") : [];
}

async function loadLeagues() {
  const { data, error } = await supabase.from("leagues").select("id,name,countries(name,code)");

  if (error) {
    throw new Error(`Erro ao buscar ligas: ${error.message}`);
  }

  return data ?? [];
}

async function loadExistingTeamsByLeague() {
  const { data, error } = await supabase.from("teams").select("id,league_id,name,short_name");

  if (error) {
    throw new Error(`Erro ao buscar times existentes: ${error.message}`);
  }

  return (data ?? []).reduce((map, team) => {
    const teams = map.get(team.league_id) ?? [];
    teams.push(team);
    map.set(team.league_id, teams);
    return map;
  }, new Map());
}

function findLeague(sourceConfig, leagues) {
  const sourceLeagueName = normalizeName(sourceConfig.leagueName);
  const countryCodes = new Set([normalizeName(sourceConfig.countryCode)]);
  const countryNames = new Set(sourceConfig.countryNames.map(normalizeName));

  return leagues.find((league) => {
    const leagueCountry = Array.isArray(league.countries) ? league.countries[0] : league.countries;
    const sameLeague = normalizeName(league.name) === sourceLeagueName;
    const sameCountry =
      countryCodes.has(normalizeName(leagueCountry?.code)) ||
      countryNames.has(normalizeName(leagueCountry?.name));

    return sameLeague && sameCountry;
  });
}

function toApiFootballTeamRow(item, leagueId) {
  const commonName = clean(item.team?.name);
  const officialName = commonName;

  return {
    league_id: leagueId,
    name: officialName,
    short_name: commonName,
    city: clean(item.venue?.city) || null,
    stadium: clean(item.venue?.name) || null,
    founded_year: toYear(item.team?.founded),
    logo_url: clean(item.team?.logo) || null,
    description: null
  };
}

function toTheSportsDbTeamRow(team, leagueId) {
  const commonName = clean(team.strTeam);
  const officialName = getOfficialName(team, commonName);

  return {
    league_id: leagueId,
    name: officialName,
    short_name: commonName,
    city: clean(team.strLocation) || null,
    stadium: clean(team.strStadium) || null,
    founded_year: toYear(team.intFormedYear),
    logo_url: clean(team.strBadge) || clean(team.strLogo) || null,
    description: null
  };
}

function getOfficialName(team, commonName) {
  const alternates = clean(team.strTeamAlternate)
    .split(/[,;/]/)
    .map((alternate) => alternate.trim())
    .filter(Boolean);

  const fullName = alternates.find((alternate) => {
    const normalized = normalizeName(alternate);
    return (
      normalized.includes(normalizeName(commonName)) &&
      /\b(fc|cf|ac|sc|cd|club|football club|futbol club|futebol clube)\b/i.test(alternate) &&
      alternate.length >= commonName.length
    );
  });

  return fullName || commonName;
}

function isAlreadyCreated(row, existingTeams) {
  const rowKeys = nameKeys(row.name, row.short_name);

  return existingTeams.some((team) => {
    const existingKeys = nameKeys(team.name, team.short_name);
    return rowKeys.some((rowKey) => existingKeys.includes(rowKey));
  });
}

function nameKeys(...values) {
  return values
    .flatMap((value) => {
      const normalized = normalizeName(value);
      const withoutLegalSuffix = normalized
        .replace(/\b(football club|futbol club|futebol clube|fc|cf|ac|sc|cd|club)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

      return [normalized, withoutLegalSuffix].filter(Boolean);
    })
    .filter((value, index, array) => array.indexOf(value) === index);
}

function hasExpectedTeamCount(teams, expectedTeams) {
  return teams.length === expectedTeams;
}

function toYear(value) {
  const year = Number.parseInt(value, 10);
  return Number.isFinite(year) ? year : null;
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeName(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function source(countryCode, countryNames, leagueName, apiFootballLeagueId, season, expectedTeams, apiFootballAliases, theSportsDbLeagues) {
  return {
    countryCode,
    countryNames,
    leagueName,
    expectedTeams,
    apiFootball: {
      leagueId: apiFootballLeagueId,
      season,
      countryName: countryNames[0],
      aliases: apiFootballAliases
    },
    theSportsDbLeagues
  };
}

function extractApiFootballErrors(errors) {
  if (!errors) {
    return [];
  }

  if (Array.isArray(errors)) {
    return errors.map(String).filter(Boolean);
  }

  if (typeof errors === "string") {
    return errors ? [errors] : [];
  }

  if (typeof errors === "object") {
    return Object.values(errors).map(String).filter(Boolean);
  }

  return [];
}

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");

    if (process.env[key]) {
      continue;
    }

    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}
