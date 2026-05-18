import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Player, PlayerWithHistory } from "@/types/database";
import { canDeletePlayerFromCounts, type DeleteCheck } from "@/services/admin-rules";
import { getSquadMembershipsByPlayerId } from "@/services/squad-memberships";
import { getTransfersByPlayerId } from "@/services/transfers";
import {
  deriveCurrentTeamFromHistory,
  normalizePlayerInput,
  type PlayerInput
} from "@/services/phase2-rules";

export type { PlayerInput };

export async function getPlayers(): Promise<Player[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("players").select("*").order("name");

  if (error) {
    throw new Error(`Erro ao buscar jogadores: ${error.message}`);
  }

  return data ?? [];
}

export async function getPlayerById(id: string): Promise<Player | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("players").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Erro ao buscar jogador: ${error.message}`);
  }

  return data;
}

export async function getPlayerProfile(id: string): Promise<PlayerWithHistory | null> {
  const player = await getPlayerById(id);

  if (!player) {
    return null;
  }

  const [squadMemberships, transfers] = await Promise.all([
    getSquadMembershipsByPlayerId(id),
    getTransfersByPlayerId(id)
  ]);

  return {
    ...player,
    currentTeam: deriveCurrentTeamFromHistory({ squadMemberships, transfers }),
    squadMemberships,
    transfers
  };
}

export async function createPlayer(input: PlayerInput & Record<string, unknown>) {
  const row = normalizePlayerInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("players").insert(row);

  if (error) {
    throw new Error(`Erro ao cadastrar jogador: ${error.message}`);
  }
}

export async function updatePlayer(id: string, input: PlayerInput & Record<string, unknown>) {
  const row = normalizePlayerInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("players").update(row).eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar jogador: ${error.message}`);
  }
}

export async function canDeletePlayer(id: string): Promise<DeleteCheck> {
  if (!isSupabaseConfigured()) {
    return canDeletePlayerFromCounts({ squadMemberships: 0, transfers: 0 });
  }

  const supabase = await createSupabaseServerClient();
  const [squadMemberships, transfers] = await Promise.all([
    supabase
      .from("squad_memberships")
      .select("*", { count: "exact", head: true })
      .eq("player_id", id),
    supabase
      .from("transfers")
      .select("*", { count: "exact", head: true })
      .eq("player_id", id)
  ]);

  const firstError = squadMemberships.error ?? transfers.error;

  if (firstError) {
    throw new Error(`Erro ao verificar historico do jogador: ${firstError.message}`);
  }

  return canDeletePlayerFromCounts({
    squadMemberships: squadMemberships.count ?? 0,
    transfers: transfers.count ?? 0
  });
}

export async function deletePlayer(id: string) {
  const check = await canDeletePlayer(id);

  if (!check.canDelete) {
    throw new Error(check.reason ?? "Jogador nao pode ser excluido.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir jogador: ${error.message}`);
  }
}
