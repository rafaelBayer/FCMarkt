import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { TransferWithRelations } from "@/types/database";
import {
  normalizeTransferInput,
  sortTransfersByDateDesc,
  TRANSFER_TYPES,
  type TransferInput,
  type TransferType
} from "@/services/phase2-rules";
import {
  buildPaginatedResult,
  emptyPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams
} from "@/services/pagination";

export type { TransferInput, TransferType };
export { TRANSFER_TYPES };

const TRANSFER_SELECT =
  "*, players(*), seasons(*), from_team:teams!transfers_from_team_id_fkey(*), to_team:teams!transfers_to_team_id_fkey(*)";
const TRANSFER_SEARCH_SELECT =
  "*, players!inner(*), seasons(*), from_team:teams!transfers_from_team_id_fkey(*), to_team:teams!transfers_to_team_id_fkey(*)";

export type TransferListParams = PaginationParams & {
  season?: string | null;
  team?: string | null;
};

export async function getTransfers(): Promise<TransferWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transfers")
    .select(TRANSFER_SELECT)
    .order("transfer_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar transferencias: ${error.message}`);
  }

  return sortTransfersByDateDesc((data ?? []) as TransferWithRelations[]);
}

export async function getPaginatedTransfers(
  params: TransferListParams = {}
): Promise<PaginatedResult<TransferWithRelations>> {
  if (!isSupabaseConfigured()) {
    return emptyPaginatedResult(params);
  }

  const pagination = normalizePagination(params);
  const season = params.season?.trim();
  const team = params.team?.trim();
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("transfers")
    .select(pagination.search ? TRANSFER_SEARCH_SELECT : TRANSFER_SELECT, { count: "exact" })
    .order("transfer_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(pagination.from, pagination.to);

  if (pagination.search) {
    query = query.ilike("players.name", `%${escapeSupabaseLike(pagination.search)}%`);
  }

  if (season) {
    query = query.eq("season_id", season);
  }

  if (team) {
    query = query.or(`from_team_id.eq.${team},to_team_id.eq.${team}`);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar transferencias: ${error.message}`);
  }

  return buildPaginatedResult({
    data: sortTransfersByDateDesc((data ?? []) as TransferWithRelations[]),
    count,
    page: pagination.page,
    pageSize: pagination.pageSize
  });
}

export async function getTransfersByPlayerId(playerId: string): Promise<TransferWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transfers")
    .select(TRANSFER_SELECT)
    .eq("player_id", playerId)
    .order("transfer_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar transferencias do jogador: ${error.message}`);
  }

  return sortTransfersByDateDesc((data ?? []) as TransferWithRelations[]);
}

export async function getTransferById(id: string): Promise<TransferWithRelations | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transfers")
    .select(TRANSFER_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Erro ao buscar transferencia: ${error.message}`);
  }

  return data as TransferWithRelations;
}

export async function createTransfer(input: TransferInput) {
  const row = normalizeTransferInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("transfers").insert(row);

  if (error) {
    throw new Error(`Erro ao cadastrar transferencia: ${error.message}`);
  }
}

export async function updateTransfer(id: string, input: TransferInput) {
  const row = normalizeTransferInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("transfers").update(row).eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar transferencia: ${error.message}`);
  }
}

export async function deleteTransfer(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("transfers").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir transferencia: ${error.message}`);
  }
}

function escapeSupabaseLike(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}
