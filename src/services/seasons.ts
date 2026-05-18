import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Season } from "@/types/database";
import { normalizeSeasonInput, type SeasonInput } from "@/services/phase2-rules";

export type { SeasonInput };

export async function getSeasons(): Promise<Season[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("seasons")
    .select("*")
    .order("start_year", { ascending: false })
    .order("name");

  if (error) {
    throw new Error(`Erro ao buscar temporadas: ${error.message}`);
  }

  return data ?? [];
}

export async function createSeason(input: SeasonInput) {
  const row = normalizeSeasonInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("seasons").insert(row);

  if (error) {
    throw new Error(`Erro ao cadastrar temporada: ${error.message}`);
  }
}
