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

export async function createTransfer(input: TransferInput) {
  const row = normalizeTransferInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("transfers").insert(row);

  if (error) {
    throw new Error(`Erro ao cadastrar transferencia: ${error.message}`);
  }
}
