import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const THE_SPORTS_DB_API_KEY = process.env.THE_SPORTS_DB_API_KEY ?? "123";
const THE_SPORTS_DB_BASE_URL = `https://www.thesportsdb.com/api/v1/json/${THE_SPORTS_DB_API_KEY}`;
const REQUEST_DELAY_MS = 2300;

const LEAGUE_SOURCES = [
  {
    countryCode: "ENG",
    countryNames: ["England"],
    leagueName: "Premier League",
    theSportsDbLeagues: ["English Premier League", "English_Premier_League"]
  },
  {
    countryCode: "ES",
    countryNames: ["Spain"],
    leagueName: "La Liga",
    theSportsDbLeagues: ["Spanish La Liga", "Spanish_La_Liga", "La Liga"]
  },
  {
    countryCode: "DE",
    countryNames: ["Germany"],
    leagueName: "Bundesliga",
    theSportsDbLeagues: ["German Bundesliga", "German_Bundesliga", "Bundesliga"]
  },
  {
    countryCode: "IT",
    countryNames: ["Italy"],
    leagueName: "Serie A",
    theSportsDbLeagues: ["Italian Serie A", "Italian_Serie_A", "Serie A"]
  },
  {
    countryCode: "FR",
    countryNames: ["France"],
    leagueName: "Ligue 1",
    theSportsDbLeagues: ["French Ligue 1", "French_Ligue_1", "Ligue 1"]
  },
  {
    countryCode: "PT",
    countryNames: ["Portugal"],
    leagueName: "Liga Portugal",
    theSportsDbLeagues: ["Portuguese Primeira Liga", "Portuguese_Primeira_Liga", "Primeira Liga"]
  },
  {
    countryCode: "NL",
    countryNames: ["Netherlands"],
    leagueName: "Eredivisie",
    theSportsDbLeagues: ["Dutch Eredivisie", "Dutch_Eredivisie", "Eredivisie"]
  },
  {
    countryCode: "BE",
    countryNames: ["Belgium"],
    leagueName: "Belgian Pro League",
    theSportsDbLeagues: ["Belgian Pro League", "Belgian_Pro_League", "Jupiler Pro League"]
  },
  {
    countryCode: "DK",
    countryNames: ["Denmark"],
    leagueName: "Danish Superliga",
    theSportsDbLeagues: ["Danish Superliga", "Danish_Superliga", "Superliga"]
  },
  {
    countryCode: "SCO",
    countryNames: ["Scotland"],
    leagueName: "Scottish Premiership",
    theSportsDbLeagues: ["Scottish Premiership", "Scottish_Premiership"]
  },
  {
    countryCode: "SA",
    countryNames: ["Saudi Arabia"],
    leagueName: "Saudi Pro League",
    theSportsDbLeagues: ["Saudi Pro League", "Saudi_Pro_League"]
  },
  {
    countryCode: "US",
    countryNames: ["United States", "United States of America"],
    leagueName: "Major League Soccer",
    theSportsDbLeagues: ["American Major League Soccer", "American_Major_League_Soccer", "Major League Soccer"]
  },
  {
    countryCode: "MX",
    countryNames: ["Mexico"],
    leagueName: "Liga MX",
    theSportsDbLeagues: ["Mexican Liga MX", "Mexican_Liga_MX", "Liga MX"]
  },
  {
    countryCode: "BR",
    countryNames: ["Brazil"],
    leagueName: "Campeonato Brasileiro Série A",
    theSportsDbLeagues: ["Brazilian Serie A", "Brazilian_Serie_A", "Campeonato Brasileiro Serie A"]
  },
  {
    countryCode: "AR",
    countryNames: ["Argentina"],
    leagueName: "Liga Profesional de Fútbol",
    theSportsDbLeagues: ["Argentinian Primera Division", "Argentinian_Primera_Division", "Liga Profesional de Futbol"]
  },
  {
    countryCode: "UY",
    countryNames: ["Uruguay"],
    leagueName: "Liga AUF Uruguaya",
    theSportsDbLeagues: ["Uruguayan Primera Division", "Uruguayan_Primera_Division", "Liga AUF Uruguaya"]
  },
  {
    countryCode: "PY",
    countryNames: ["Paraguay"],
    leagueName: "División Profesional",
    theSportsDbLeagues: ["Paraguayan Primera Division", "Paraguayan_Primera_Division", "Paraguayan Division Profesional"]
  },
  {
    countryCode: "CL",
    countryNames: ["Chile"],
    leagueName: "Liga de Primera",
    theSportsDbLeagues: ["Chilean Primera Division", "Chilean_Primera_Division", "Liga de Primera"]
  },
  {
    countryCode: "CO",
    countryNames: ["Colombia"],
    leagueName: "Categoría Primera A",
    theSportsDbLeagues: ["Colombian Categoria Primera A", "Colombian_Categoria_Primera_A", "Categoria Primera A"]
  },
  {
    countryCode: "PE",
    countryNames: ["Peru"],
    leagueName: "Liga 1",
    theSportsDbLeagues: ["Peruvian Primera Division", "Peruvian_Primera_Division", "Liga 1 Peru"]
  },
  {
    countryCode: "EC",
    countryNames: ["Ecuador"],
    leagueName: "LigaPro Serie A",
    theSportsDbLeagues: ["Ecuadorian Serie A", "Ecuadorian_Serie_A", "LigaPro Serie A"]
  },
  {
    countryCode: "BO",
    countryNames: ["Bolivia"],
    leagueName: "División Profesional",
    theSportsDbLeagues: ["Bolivian Primera Division", "Bolivian_Primera_Division", "Bolivian Division Profesional"]
  },
  {
    countryCode: "VE",
    countryNames: ["Venezuela"],
    leagueName: "Liga FUTVE",
    theSportsDbLeagues: ["Venezuelan Primera Division", "Venezuelan_Primera_Division", "Liga FUTVE"]
  }
];

loadEnvFile(".env.local");
loadEnvFile(".env");

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
const summary = {
  createdOrUpdated: 0,
  skippedLeagues: 0,
  emptySources: []
};

for (const source of LEAGUE_SOURCES) {
  const league = findLeague(source, leagues);

  if (!league) {
    summary.skippedLeagues += 1;
    console.warn(`Liga nao encontrada no Supabase: ${source.countryCode} - ${source.leagueName}`);
    continue;
  }

  const providerResult = await fetchTeamsFromTheSportsDb(source);

  if (providerResult.teams.length === 0) {
    summary.emptySources.push(`${source.leagueName} (${source.countryCode})`);
    console.warn(`Nenhum time encontrado na fonte para ${source.leagueName}.`);
    continue;
  }

  const rows = providerResult.teams.map((team) => toTeamRow(team, league.id));
  const { error } = await supabase.from("teams").upsert(rows, {
    onConflict: "league_id,name"
  });

  if (error) {
    throw new Error(`Erro ao cadastrar times de ${source.leagueName}: ${error.message}`);
  }

  summary.createdOrUpdated += rows.length;
  console.log(`${source.leagueName}: ${rows.length} times via ${providerResult.providerLeague}.`);
}

console.log(`Seed concluido: ${summary.createdOrUpdated} times cadastrados/atualizados.`);

if (summary.skippedLeagues > 0) {
  console.log(`Ligas nao encontradas no banco: ${summary.skippedLeagues}. Rode npm run seed:leagues primeiro.`);
}

if (summary.emptySources.length > 0) {
  console.log("Sem retorno da fonte para:");
  summary.emptySources.forEach((league) => console.log(`- ${league}`));
}

async function loadLeagues() {
  const { data, error } = await supabase.from("leagues").select("id,name,countries(name,code)");

  if (error) {
    throw new Error(`Erro ao buscar ligas: ${error.message}`);
  }

  return data ?? [];
}

function findLeague(source, leagues) {
  const sourceLeagueName = normalize(source.leagueName);
  const countryCodes = new Set([normalize(source.countryCode)]);
  const countryNames = new Set(source.countryNames.map(normalize));

  return leagues.find((league) => {
    const leagueCountry = Array.isArray(league.countries) ? league.countries[0] : league.countries;
    const sameLeague = normalize(league.name) === sourceLeagueName;
    const sameCountry =
      countryCodes.has(normalize(leagueCountry?.code)) || countryNames.has(normalize(leagueCountry?.name));

    return sameLeague && sameCountry;
  });
}

async function fetchTeamsFromTheSportsDb(source) {
  for (const providerLeague of source.theSportsDbLeagues) {
    const teams = await fetchTheSportsDbLeagueTeams(providerLeague);

    if (teams.length > 0) {
      return { providerLeague, teams };
    }

    await delay(REQUEST_DELAY_MS);
  }

  return { providerLeague: null, teams: [] };
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

function toTeamRow(team, leagueId) {
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
    const normalized = normalize(alternate);
    return (
      normalized.includes(normalize(commonName)) &&
      /\b(fc|cf|ac|sc|cd|club|football club|futbol club|futebol clube)\b/i.test(alternate) &&
      alternate.length >= commonName.length
    );
  });

  return fullName || commonName;
}

function toYear(value) {
  const year = Number.parseInt(value, 10);
  return Number.isFinite(year) ? year : null;
}

function clean(value) {
  return String(value ?? "").trim();
}

function normalize(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
