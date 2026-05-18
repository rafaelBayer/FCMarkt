import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

loadEnvFile(".env.local");
loadEnvFile(".env");

const REQUEST_DELAY_MS = 800;
const DRY_RUN = ["1", "true", "yes"].includes(String(process.env.SEED_TEAMS_DRY_RUN ?? "").toLowerCase());
const EUROPE_2025_26 = "2025\u201326";

const LEAGUE_SOURCES = [
  source("ENG", ["England"], "Premier League", 20, `${EUROPE_2025_26} Premier League`),
  source("ES", ["Spain"], "La Liga", 20, `${EUROPE_2025_26} La Liga`),
  source("DE", ["Germany"], "Bundesliga", 18, `${EUROPE_2025_26} Bundesliga`),
  source("IT", ["Italy"], "Serie A", 20, `${EUROPE_2025_26} Serie A`),
  source("FR", ["France"], "Ligue 1", 18, `${EUROPE_2025_26} Ligue 1`),
  source("PT", ["Portugal"], "Liga Portugal", 18, `${EUROPE_2025_26} Primeira Liga`),
  source("NL", ["Netherlands"], "Eredivisie", 18, `${EUROPE_2025_26} Eredivisie`),
  source("BE", ["Belgium"], "Belgian Pro League", 16, `${EUROPE_2025_26} Belgian Pro League`),
  source("DK", ["Denmark"], "Danish Superliga", 12, `${EUROPE_2025_26} Danish Superliga`),
  source("SCO", ["Scotland"], "Scottish Premiership", 12, `${EUROPE_2025_26} Scottish Premiership`),
  source("SA", ["Saudi Arabia"], "Saudi Pro League", 18, `${EUROPE_2025_26} Saudi Pro League`),
  source("US", ["United States", "United States of America"], "Major League Soccer", 30, "2026 Major League Soccer season"),
  source("MX", ["Mexico"], "Liga MX", 18, `${EUROPE_2025_26} Liga MX season`),
  source("BR", ["Brazil"], "Campeonato Brasileiro Serie A", 20, "2026 Campeonato Brasileiro S\u00e9rie A"),
  source("AR", ["Argentina"], "Liga Profesional de Futbol", 30, "Campeonato de Primera Divisi\u00f3n 2026 (Argentina)", "es"),
  source("UY", ["Uruguay"], "Liga AUF Uruguaya", 16, "2026 Liga AUF Uruguaya"),
  source("PY", ["Paraguay"], "Division Profesional", 12, "2026 Copa de Primera"),
  source("CL", ["Chile"], "Liga de Primera", 16, "2026 Liga de Primera"),
  source("CO", ["Colombia"], "Categoria Primera A", 20, "2026 Categor\u00eda Primera A season"),
  source("PE", ["Peru"], "Liga 1", 18, "2026 Liga 1 (Peru)"),
  source("EC", ["Ecuador"], "LigaPro Serie A", 16, "2026 LigaPro Serie A"),
  source("BO", ["Bolivia"], "Division Profesional", 16, "2026 FBF Divisi\u00f3n Profesional"),
  source("VE", ["Venezuela"], "Liga FUTVE", 14, "2026 Liga FUTVE")
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

  const providerResult = await fetchTeamsFromWikipedia(sourceConfig);

  if (providerResult.teams.length === 0) {
    summary.emptySources.push(`${sourceConfig.leagueName} (${sourceConfig.countryCode})`);
    console.warn(`Nenhum time encontrado na fonte para ${sourceConfig.leagueName}.`);
    continue;
  }

  if (providerResult.teams.length !== sourceConfig.expectedTeams) {
    summary.incompleteSources.push(
      `${sourceConfig.leagueName} (${providerResult.teams.length}/${sourceConfig.expectedTeams}) via ${providerResult.provider}`
    );
    console.warn(
      `Fonte ignorada para ${sourceConfig.leagueName}: retornou ${providerResult.teams.length}, esperado ${sourceConfig.expectedTeams}.`
    );
    continue;
  }

  const existingTeams = existingTeamsByLeague.get(league.id) ?? [];
  const rows = providerResult.teams.map((team) => toTeamRow(team, league.id));
  const shortNameCounts = countRowsByShortName(rows);
  const newRows = rows.filter((row) => {
    const hasAmbiguousShortName = (shortNameCounts.get(normalizeName(row.short_name)) ?? 0) > 1;
    return !isAlreadyCreated(row, existingTeams, hasAmbiguousShortName);
  });

  if (newRows.length === 0) {
    summary.alreadyExisting += rows.length;
    console.log(`${sourceConfig.leagueName}: todos os ${rows.length} times ja existem.`);
    continue;
  }

  if (DRY_RUN) {
    summary.inserted += newRows.length;
    summary.alreadyExisting += rows.length - newRows.length;
    console.log(
      `${sourceConfig.leagueName}: ${newRows.length} seriam cadastrados, ${rows.length - newRows.length} ja existentes via ${providerResult.provider}.`
    );
    await delay(REQUEST_DELAY_MS);
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

  await delay(REQUEST_DELAY_MS);
}

console.log(
  DRY_RUN
    ? `Dry run concluido: ${summary.inserted} novos times seriam cadastrados.`
    : `Seed concluido: ${summary.inserted} novos times cadastrados.`
);

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

async function fetchTeamsFromWikipedia(sourceConfig) {
  const page = await fetchWikipediaPage(sourceConfig);

  if (!page) {
    return {
      provider: "Wikipedia",
      teams: []
    };
  }

  const teams = extractTeamsFromWikipedia(page.html, sourceConfig.expectedTeams);

  return {
    provider: `Wikipedia ${page.title}`,
    teams
  };
}

async function fetchWikipediaPage(sourceConfig) {
  const primaryUrl = toWikipediaUrl(sourceConfig.wikipediaTitle, sourceConfig.wikipediaLanguage);
  const primaryResponse = await fetch(primaryUrl);

  if (primaryResponse.ok) {
    return {
      title: sourceConfig.wikipediaTitle,
      url: primaryUrl,
      html: await primaryResponse.text()
    };
  }

  const searchResult = await searchWikipedia(sourceConfig);

  if (!searchResult) {
    console.warn(`Wikipedia nao encontrou pagina para: ${sourceConfig.wikipediaTitle}.`);
    return null;
  }

  const fallbackResponse = await fetch(searchResult.url);

  if (!fallbackResponse.ok) {
    console.warn(`Wikipedia respondeu ${fallbackResponse.status} para ${searchResult.title}.`);
    return null;
  }

  return {
    title: searchResult.title,
    url: searchResult.url,
    html: await fallbackResponse.text()
  };
}

async function searchWikipedia(sourceConfig) {
  const url = new URL(`https://${sourceConfig.wikipediaLanguage}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("namespace", "0");
  url.searchParams.set("limit", "1");
  url.searchParams.set("format", "json");
  url.searchParams.set("search", sourceConfig.wikipediaTitle);

  const response = await fetch(url);

  if (!response.ok) {
    console.warn(`Wikipedia search respondeu ${response.status} para ${sourceConfig.wikipediaTitle}.`);
    return null;
  }

  const data = await response.json();
  const resultTitle = data?.[1]?.[0];
  const resultUrl = data?.[3]?.[0];

  if (!resultTitle || !resultUrl || !isAcceptableSearchResult(sourceConfig, resultTitle)) {
    return null;
  }

  return {
    title: resultTitle,
    url: resultUrl
  };
}

function isAcceptableSearchResult(sourceConfig, resultTitle) {
  const expectedYears = sourceConfig.wikipediaTitle.match(/\b20\d{2}\b|\b\d{2}\b/g) ?? [];
  const normalizedResult = normalizeName(resultTitle);

  return expectedYears.every((year) => normalizedResult.includes(year));
}

function extractTeamsFromWikipedia(html, expectedTeams) {
  const $ = cheerio.load(html);
  const primaryTables = [];
  const fallbackTables = [];

  $("table.wikitable").each((_, table) => {
    const headers = getHeaders($, table);

    if (headers.length === 0) {
      return;
    }

    if (isTeamDetailsTable(headers)) {
      primaryTables.push(parseTeamTable($, table, headers));
      return;
    }

    if (isStandingsTable(headers)) {
      fallbackTables.push(parseTeamTable($, table, headers));
    }
  });

  const exactPrimaryTable = primaryTables.find((teams) => teams.length === expectedTeams);

  if (exactPrimaryTable) {
    return exactPrimaryTable;
  }

  const exactFallbackTable = fallbackTables.find((teams) => teams.length === expectedTeams);

  if (exactFallbackTable) {
    return exactFallbackTable;
  }

  const combinedPrimary = uniqueTeams(primaryTables.flat());

  if (combinedPrimary.length === expectedTeams) {
    return combinedPrimary;
  }

  const combinedFallback = uniqueTeams(fallbackTables.flat());

  if (combinedFallback.length === expectedTeams) {
    return combinedFallback;
  }

  return combinedFallback.length > combinedPrimary.length ? combinedFallback : combinedPrimary;
}

function getHeaders($, table) {
  const firstRow = $(table).find("tr").first();

  return firstRow
    .children("th,td")
    .map((_, header) => normalizeHeader($(header).text()))
    .get()
    .filter(Boolean);
}

function isTeamDetailsTable(headers) {
  const normalized = headers.map(normalizeHeader);
  const hasTeam = hasHeader(normalized, ["team", "club", "equipo"]);
  const hasUsefulDetails = [
    "location",
    "city",
    "stadium",
    "ground",
    "venue",
    "capacity",
    "ciudad",
    "localizacion",
    "ubicacion",
    "estadio",
    "capacidad"
  ].some((header) => hasHeader(normalized, [header]));
  const blockedHeaders = [
    "manager",
    "head coach",
    "captain",
    "kit manufacturer",
    "shirt sponsor",
    "entrenador",
    "director tecnico",
    "capitan",
    "proveedor",
    "patrocinador"
  ];
  const isBlocked = blockedHeaders.some((header) => hasHeader(normalized, [header]));

  return hasTeam && hasUsefulDetails && !isBlocked;
}

function isStandingsTable(headers) {
  const normalized = headers.map(normalizeHeader);
  return (
    hasHeader(normalized, ["team", "club", "equipo"]) &&
    hasHeader(normalized, ["pos", "position", "posicion", "p"])
  );
}

function parseTeamTable($, table, headers) {
  const teamIndex = findHeaderIndex(headers, ["team", "club", "equipo"]);
  const cityIndex = findHeaderIndex(headers, ["location", "city", "ciudad", "localizacion", "ubicacion"]);
  const stadiumIndex = findHeaderIndex(headers, ["stadium", "ground", "venue", "estadio"]);

  return uniqueTeams(
    $(table)
      .find("tr")
      .slice(1)
      .map((_, row) => {
        const cells = $(row).children("th,td");
        const teamCell = cells.eq(teamIndex >= 0 ? teamIndex : 0);
        const team = extractTeamName($, teamCell);

        if (!team.shortName || !/[a-zA-Z\u00c0-\u024f]/.test(team.shortName)) {
          return null;
        }

        return {
          name: team.officialName || team.shortName,
          shortName: team.shortName,
          city: cleanCell(cells.eq(cityIndex).text()),
          stadium: cleanCell(cells.eq(stadiumIndex).text())
        };
      })
      .get()
      .filter(Boolean)
  );
}

function extractTeamName($, cell) {
  const links = cell.find("a").filter((_, link) => {
    const text = cleanCell($(link).text());
    const href = $(link).attr("href") ?? "";
    return text && href.includes("/wiki/") && !href.includes("File:") && !href.includes("Archivo:");
  });

  const mainLink = links.first();
  const shortName = cleanTeamName(mainLink.length > 0 ? mainLink.text() : cell.text());
  const title = cleanTeamName(mainLink.attr("title"));
  const officialName = isUsefulOfficialName(title, shortName) ? title : shortName;

  return {
    officialName,
    shortName
  };
}

function isUsefulOfficialName(title, shortName) {
  if (!title || !shortName) {
    return false;
  }

  const normalizedTitle = normalizeName(title);
  const normalizedShortName = normalizeName(shortName);

  if (normalizedTitle === normalizedShortName) {
    return true;
  }

  if (normalizedTitle.includes("season") || normalizedTitle.includes("league")) {
    return false;
  }

  return normalizedTitle.includes(normalizedShortName) || normalizedShortName.includes(normalizedTitle);
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

function toTeamRow(team, leagueId) {
  return {
    league_id: leagueId,
    name: team.name,
    short_name: team.shortName,
    city: team.city || null,
    stadium: team.stadium || null,
    founded_year: null,
    logo_url: null,
    description: null
  };
}

function isAlreadyCreated(row, existingTeams, hasAmbiguousShortName) {
  const rowKeys = nameKeys(row.name);

  const matchedByOfficialName = existingTeams.some((team) => {
    const existingKeys = nameKeys(team.name);
    return rowKeys.some((rowKey) => existingKeys.includes(rowKey));
  });

  if (matchedByOfficialName || hasAmbiguousShortName) {
    return matchedByOfficialName;
  }

  const rowShortKeys = nameKeys(row.short_name);

  return existingTeams.some((team) => {
    const existingKeys = nameKeys(team.name, team.short_name);
    return rowShortKeys.some((rowKey) => existingKeys.includes(rowKey));
  });
}

function countRowsByShortName(rows) {
  return rows.reduce((counts, row) => {
    const key = normalizeName(row.short_name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  }, new Map());
}

function uniqueTeams(teams) {
  const seen = new Set();

  return teams.filter((team) => {
    const key = normalizeName(team.name || team.shortName);

    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function nameKeys(...values) {
  return values
    .flatMap((value) => {
      const normalized = normalizeName(value);
      const withoutLegalSuffix = normalized
        .replace(
          /\b(association football club|football club|futbol club|futebol clube|club atletico|club atl\u00e9tico|a f c|f c|c f|a c|s c|c d|c a|fc|cf|ac|sc|cd|club)\b/g,
          ""
        )
        .replace(/\s+/g, " ")
        .trim();

      return [normalized, withoutLegalSuffix].filter(Boolean);
    })
    .filter((value, index, array) => array.indexOf(value) === index);
}

function findHeaderIndex(headers, names) {
  return headers.findIndex((header) => headerMatches(normalizeHeader(header), names));
}

function hasHeader(headers, names) {
  return headers.some((header) => headerMatches(header, names));
}

function headerMatches(header, names) {
  return names.some((name) => header === name || header.startsWith(`${name} `));
}

function cleanTeamName(value) {
  return cleanCell(value)
    .replace(/\s+\([^)]+\)$/g, "")
    .replace(/\bqualified\b.*$/i, "")
    .trim();
}

function cleanCell(value) {
  return String(value ?? "")
    .replace(/\[[^\]]*]/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHeader(value) {
  return cleanCell(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function normalizeName(value) {
  return cleanCell(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function source(countryCode, countryNames, leagueName, expectedTeams, wikipediaTitle, wikipediaLanguage = "en") {
  return {
    countryCode,
    countryNames,
    leagueName,
    expectedTeams,
    wikipediaTitle,
    wikipediaLanguage
  };
}

function toWikipediaUrl(title, language) {
  return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
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
