import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { SquadMembershipWithRelations } from "@/types/database";
import {
  filterSquadMembershipsBySeason,
  normalizeSquadMembershipInput,
  type SquadMembershipInput
} from "@/services/phase2-rules";

export type { SquadMembershipInput };

const SQUAD_MEMBERSHIP_SELECT = "*, players(*), teams(*), seasons(*)";

export async function getSquadMembershipsByTeamId(
  teamId: string,
  seasonId?: string | null
): Promise<SquadMembershipWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("squad_memberships")
    .select(SQUAD_MEMBERSHIP_SELECT)
    .eq("team_id", teamId)
    .order("shirt_number", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (seasonId) {
    query = query.eq("season_id", seasonId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar elenco do time: ${error.message}`);
  }

  return filterSquadMembershipsBySeason(
    (data ?? []) as SquadMembershipWithRelations[],
    seasonId
  );
}

export async function getSquadMembershipsByPlayerId(
  playerId: string
): Promise<SquadMembershipWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("squad_memberships")
    .select(SQUAD_MEMBERSHIP_SELECT)
    .eq("player_id", playerId)
    .order("joined_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar historico de elenco do jogador: ${error.message}`);
  }

  return (data ?? []) as SquadMembershipWithRelations[];
}

export async function createSquadMembership(input: SquadMembershipInput) {
  const row = normalizeSquadMembershipInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("squad_memberships").insert(row);

  if (error) {
    throw new Error(`Erro ao cadastrar vinculo de elenco: ${error.message}`);
  }
}

export async function updateSquadMembership(id: string, input: SquadMembershipInput) {
  const row = normalizeSquadMembershipInput(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("squad_memberships").update(row).eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar vinculo de elenco: ${error.message}`);
  }
}

export async function deleteSquadMembership(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("squad_memberships").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir vinculo de elenco: ${error.message}`);
  }
}
