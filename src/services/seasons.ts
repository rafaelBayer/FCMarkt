import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Season } from "@/types/database";
import { canDeleteSeasonFromCounts, type DeleteCheck } from "@/services/admin-rules";
import { normalizeSeasonInput, type SeasonInput } from "@/services/phase2-rules";
import {
  buildPaginatedResult,
  emptyPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams
} from "@/services/pagination";

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

export async function getPaginatedSeasons(
  params: PaginationParams = {}
): Promise<PaginatedResult<Season>> {
  if (!isSupabaseConfigured()) {
    return emptyPaginatedResult(params);
  }

  const pagination = normalizePagination(params);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("seasons")
    .select("*", { count: "exact" })
    .order("start_year", { ascending: false })
    .order("name")
    .range(pagination.from, pagination.to);

  if (pagination.search) {
    query = query.ilike("name", `%${escapeSupabaseLike(pagination.search)}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar temporadas: ${error.message}`);
  }

  return buildPaginatedResult({
    data: data ?? [],
    count,
    page: pagination.page,
    pageSize: pagination.pageSize
  });
}

export async function createSeason(input: SeasonInput) {
  const row = normalizeSeasonInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("seasons").insert(row);

  if (error) {
    throw new Error(`Erro ao cadastrar temporada: ${error.message}`);
  }
}

export async function getSeasonById(id: string): Promise<Season | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("seasons").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Erro ao buscar temporada: ${error.message}`);
  }

  return data;
}

export async function updateSeason(id: string, input: SeasonInput) {
  const row = normalizeSeasonInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("seasons").update(row).eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar temporada: ${error.message}`);
  }
}

export async function canDeleteSeason(id: string): Promise<DeleteCheck> {
  if (!isSupabaseConfigured()) {
    return canDeleteSeasonFromCounts({ squadMemberships: 0, transfers: 0 });
  }

  const supabase = await createSupabaseServerClient();
  const [squadMemberships, transfers] = await Promise.all([
    supabase
      .from("squad_memberships")
      .select("*", { count: "exact", head: true })
      .eq("season_id", id),
    supabase
      .from("transfers")
      .select("*", { count: "exact", head: true })
      .eq("season_id", id)
  ]);

  const firstError = squadMemberships.error ?? transfers.error;

  if (firstError) {
    throw new Error(`Erro ao verificar uso da temporada: ${firstError.message}`);
  }

  return canDeleteSeasonFromCounts({
    squadMemberships: squadMemberships.count ?? 0,
    transfers: transfers.count ?? 0
  });
}

export async function deleteSeason(id: string) {
  const check = await canDeleteSeason(id);

  if (!check.canDelete) {
    throw new Error(check.reason ?? "Temporada nao pode ser excluida.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("seasons").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir temporada: ${error.message}`);
  }
}

function escapeSupabaseLike(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}
