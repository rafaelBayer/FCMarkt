import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { TransferWithRelations } from "@/types/database";
import {
  normalizeTransferInput,
  sortTransfersByDateDesc,
  TRANSFER_TYPES,
  type TransferInput,
  type TransferType
} from "@/services/phase2-rules";

export type { TransferInput, TransferType };
export { TRANSFER_TYPES };

const TRANSFER_SELECT =
  "*, players(*), seasons(*), from_team:teams!transfers_from_team_id_fkey(*), to_team:teams!transfers_to_team_id_fkey(*)";

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
