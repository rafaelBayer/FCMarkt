import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Player, PlayerWithHistory } from "@/types/database";
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
