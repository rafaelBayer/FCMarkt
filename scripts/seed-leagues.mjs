import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { extname, resolve } from "node:path";

const LEAGUE_LOGOS_BUCKET = "league-logos";
const LEAGUE_LOGOS_DIR = resolve(process.cwd(), "assets", "league-logos");

const LEAGUES = [
  {
    country: { name: "England", code: "ENG", flagUrl: "https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg" },
    countryAliases: ["England"],
    name: "Premier League",
    logoSlug: "premier-league"
  },
  {
    country: { name: "Spain", code: "ES" },
    countryAliases: ["Spain"],
    name: "La Liga",
    logoSlug: "la-liga"
  },
  {
    country: { name: "Germany", code: "DE" },
    countryAliases: ["Germany"],
    name: "Bundesliga",
    logoSlug: "bundesliga"
  },
  {
    country: { name: "Italy", code: "IT" },
    countryAliases: ["Italy"],
    name: "Serie A",
    logoSlug: "serie-a"
  },
  {
    country: { name: "France", code: "FR" },
    countryAliases: ["France"],
    name: "Ligue 1",
    logoSlug: "ligue-1"
  },
  {
    country: { name: "Portugal", code: "PT" },
    countryAliases: ["Portugal"],
    name: "Liga Portugal",
    logoSlug: "liga-portugal"
  },
  {
    country: { name: "Netherlands", code: "NL" },
    countryAliases: ["Netherlands"],
    name: "Eredivisie",
    logoSlug: "eredivisie"
  },
  {
    country: { name: "Belgium", code: "BE" },
    countryAliases: ["Belgium"],
    name: "Belgian Pro League",
    logoSlug: "belgian-pro-league"
  },
  {
    country: { name: "Denmark", code: "DK" },
    countryAliases: ["Denmark"],
    name: "Danish Superliga",
    logoSlug: "danish-superliga"
  },
  {
    country: { name: "Scotland", code: "SCO", flagUrl: "https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg" },
    countryAliases: ["Scotland"],
    name: "Scottish Premiership",
    logoSlug: "scottish-premiership"
  },
  {
    country: { name: "Saudi Arabia", code: "SA" },
    countryAliases: ["Saudi Arabia"],
    name: "Saudi Pro League",
    logoSlug: "saudi-pro-league"
  },
  {
    country: { name: "United States", code: "US" },
    countryAliases: ["United States", "United States of America"],
    name: "Major League Soccer",
    logoSlug: "major-league-soccer"
  },
  {
    country: { name: "Mexico", code: "MX" },
    countryAliases: ["Mexico"],
    name: "Liga MX",
    logoSlug: "liga-mx"
  },
  {
    country: { name: "Brazil", code: "BR" },
    countryAliases: ["Brazil"],
    name: "Campeonato Brasileiro Série A",
    logoSlug: "campeonato-brasileiro-serie-a"
  },
  {
    country: { name: "Argentina", code: "AR" },
    countryAliases: ["Argentina"],
    name: "Liga Profesional de Fútbol",
    logoSlug: "liga-profesional-de-futbol"
  },
  {
    country: { name: "Uruguay", code: "UY" },
    countryAliases: ["Uruguay"],
    name: "Liga AUF Uruguaya",
    logoSlug: "liga-auf-uruguaya"
  },
  {
    country: { name: "Paraguay", code: "PY" },
    countryAliases: ["Paraguay"],
    name: "División Profesional",
    logoSlug: "division-profesional-paraguay"
  },
  {
    country: { name: "Chile", code: "CL" },
    countryAliases: ["Chile"],
    name: "Liga de Primera",
    logoSlug: "liga-de-primera-chile"
  },
  {
    country: { name: "Colombia", code: "CO" },
    countryAliases: ["Colombia"],
    name: "Categoría Primera A",
    logoSlug: "categoria-primera-a"
  },
  {
    country: { name: "Peru", code: "PE" },
    countryAliases: ["Peru"],
    name: "Liga 1",
    logoSlug: "liga-1-peru"
  },
  {
    country: { name: "Ecuador", code: "EC" },
    countryAliases: ["Ecuador"],
    name: "LigaPro Serie A",
    logoSlug: "ligapro-serie-a"
  },
  {
    country: { name: "Bolivia", code: "BO" },
    countryAliases: ["Bolivia"],
    name: "División Profesional",
    logoSlug: "division-profesional-bolivia"
  },
  {
    country: { name: "Venezuela", code: "VE" },
    countryAliases: ["Venezuela"],
    name: "Liga FUTVE",
    logoSlug: "liga-futve"
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

const countries = await loadCountries();
const rows = [];

for (const league of LEAGUES) {
  const country = await findOrCreateCountry(league, countries);
  const logoUrl = await uploadLeagueLogoIfPresent(league.logoSlug);

  rows.push({
    country_id: country.id,
    name: league.name,
    logo_url: logoUrl
  });
}

const { error } = await supabase.from("leagues").upsert(rows, {
  onConflict: "country_id,name"
});

if (error) {
  throw new Error(`Erro ao cadastrar ligas no Supabase: ${error.message}`);
}

console.log(`Seed concluido: ${rows.length} ligas cadastradas/atualizadas.`);

async function loadCountries() {
  const { data, error } = await supabase.from("countries").select("id,name,code,flag_url");

  if (error) {
    throw new Error(`Erro ao buscar paises: ${error.message}`);
  }

  return data ?? [];
}

async function findOrCreateCountry(league, countries) {
  const expectedCode = league.country.code.toUpperCase();
  const aliases = new Set(
    [league.country.name, expectedCode, ...league.countryAliases].map(normalize)
  );

  const existing = countries.find((country) => {
    return aliases.has(normalize(country.name)) || aliases.has(normalize(country.code));
  });

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("countries")
    .upsert(
      {
        name: league.country.name,
        code: expectedCode,
        flag_url: league.country.flagUrl ?? null
      },
      { onConflict: "code" }
    )
    .select("id,name,code,flag_url")
    .single();

  if (error) {
    throw new Error(`Erro ao criar pais ${league.country.name}: ${error.message}`);
  }

  countries.push(data);
  return data;
}

async function uploadLeagueLogoIfPresent(slug) {
  const filePath = await findLogoFile(slug);

  if (!filePath) {
    return null;
  }

  const fileBuffer = readFileSync(filePath);
  const storagePath = `${slug}${extname(filePath).toLowerCase()}`;
  const { error } = await supabase.storage
    .from(LEAGUE_LOGOS_BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: getContentType(filePath),
      upsert: true
    });

  if (error) {
    throw new Error(`Erro ao enviar logo ${storagePath}: ${error.message}`);
  }

  const { data } = supabase.storage.from(LEAGUE_LOGOS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function findLogoFile(slug) {
  if (!existsSync(LEAGUE_LOGOS_DIR)) {
    return null;
  }

  const files = await readdir(LEAGUE_LOGOS_DIR);
  const fileName = files.find((file) => {
    const lower = file.toLowerCase();
    return lower === `${slug}.svg` || lower === `${slug}.png` || lower === `${slug}.webp`;
  });

  return fileName ? resolve(LEAGUE_LOGOS_DIR, fileName) : null;
}

function getContentType(filePath) {
  const extension = extname(filePath).toLowerCase();

  if (extension === ".svg") {
    return "image/svg+xml";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/png";
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
