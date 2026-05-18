import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { LeagueWithCountry } from "@/types/database";
import { canDeleteLeagueFromCounts, type DeleteCheck } from "@/services/admin-rules";
import {
  buildPaginatedResult,
  emptyPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams
} from "@/services/pagination";

export type LeagueInput = {
  countryId: string;
  name: string;
  logoUrl?: string | null;
};

export type LeagueListParams = PaginationParams & {
  country?: string | null;
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

export async function getPaginatedLeagues(
  params: LeagueListParams = {}
): Promise<PaginatedResult<LeagueWithCountry>> {
  if (!isSupabaseConfigured()) {
    return emptyPaginatedResult(params);
  }

  const pagination = normalizePagination(params);
  const country = params.country?.trim();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("leagues")
    .select("*, countries(*)", { count: "exact" })
    .order("name")
    .range(pagination.from, pagination.to);

  if (pagination.search) {
    query = query.ilike("name", `%${escapeSupabaseLike(pagination.search)}%`);
  }

  if (country) {
    query = query.eq("country_id", country);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar ligas: ${error.message}`);
  }

  return buildPaginatedResult({
    data: (data ?? []) as LeagueWithCountry[],
    count,
    page: pagination.page,
    pageSize: pagination.pageSize
  });
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

function escapeSupabaseLike(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}
