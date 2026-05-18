import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LeagueWithCountry } from "@/types/database";
import { canDeleteLeagueFromCounts, type DeleteCheck } from "@/services/admin-rules";

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

export async function getLeagueById(id: string): Promise<LeagueWithCountry | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("leagues")
    .select("*, countries(*)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Erro ao buscar liga: ${error.message}`);
  }

  return data as LeagueWithCountry;
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

export async function updateLeague(id: string, input: LeagueInput) {
  const name = input.name.trim();
  const country_id = input.countryId;
  const logo_url = input.logoUrl?.trim() || null;

  if (!name || !country_id) {
    throw new Error("Nome da liga e pais sao obrigatorios.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("leagues").update({ country_id, name, logo_url }).eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar liga: ${error.message}`);
  }
}

export async function canDeleteLeague(id: string): Promise<DeleteCheck> {
  if (!isSupabaseConfigured()) {
    return canDeleteLeagueFromCounts({ teams: 0 });
  }

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("teams")
    .select("*", { count: "exact", head: true })
    .eq("league_id", id);

  if (error) {
    throw new Error(`Erro ao verificar times vinculados: ${error.message}`);
  }

  return canDeleteLeagueFromCounts({ teams: count ?? 0 });
}

export async function deleteLeague(id: string) {
  const check = await canDeleteLeague(id);

  if (!check.canDelete) {
    throw new Error(check.reason ?? "Liga nao pode ser excluida.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("leagues").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir liga: ${error.message}`);
  }
}
