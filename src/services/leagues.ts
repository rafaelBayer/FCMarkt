import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LeagueWithCountry } from "@/types/database";

export type LeagueInput = {
  countryId: string;
  name: string;
  logoUrl?: string | null;
};

export async function getLeagues(): Promise<LeagueWithCountry[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leagues")
    .select("*, countries(*)")
    .order("name");

  if (error) {
    throw new Error(`Erro ao buscar ligas: ${error.message}`);
  }

  return (data ?? []) as LeagueWithCountry[];
}

export async function createLeague(input: LeagueInput) {
  const name = input.name.trim();
  const country_id = input.countryId;
  const logo_url = input.logoUrl?.trim() || null;

  if (!name || !country_id) {
    throw new Error("Nome da liga e pais sao obrigatorios.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("leagues").insert({ country_id, name, logo_url });

  if (error) {
    throw new Error(`Erro ao cadastrar liga: ${error.message}`);
  }
}
