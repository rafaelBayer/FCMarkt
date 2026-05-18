import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REST_COUNTRIES_URL =
  "https://restcountries.com/v3.1/all?fields=name,cca2,flags";

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

const response = await fetch(REST_COUNTRIES_URL);

if (!response.ok) {
  throw new Error(`REST Countries respondeu ${response.status}: ${response.statusText}`);
}

const countries = await response.json();
const rows = countries
  .map((country) => ({
    name: country.name?.common?.trim(),
    code: country.cca2?.trim().toUpperCase(),
    flag_url: country.flags?.svg ?? country.flags?.png ?? null
  }))
  .filter((country) => country.name && country.code)
  .sort((a, b) => a.name.localeCompare(b.name));

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const { error } = await supabase
  .from("countries")
  .upsert(rows, { onConflict: "code" });

if (error) {
  throw new Error(`Erro ao cadastrar paises no Supabase: ${error.message}`);
}

console.log(`Seed concluido: ${rows.length} paises cadastrados/atualizados.`);

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
