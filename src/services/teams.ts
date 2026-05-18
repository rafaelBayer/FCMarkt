import { randomUUID } from "crypto";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { TeamWithLeague } from "@/types/database";
import { canDeleteTeamFromCounts, type DeleteCheck } from "@/services/admin-rules";

const TEAM_LOGOS_BUCKET = "team-logos";

export type TeamInput = {
  leagueId: string;
  name: string;
  shortName?: string | null;
  city?: string | null;
  stadium?: string | null;
  foundedYear?: number | null;
  description?: string | null;
  logoUrl?: string | null;
};

export async function getTeams(): Promise<TeamWithLeague[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*, leagues(*, countries(*))")
    .order("name");

  if (error) {
    throw new Error(`Erro ao buscar times: ${error.message}`);
  }

  return (data ?? []) as TeamWithLeague[];
}

export async function getTeamById(id: string): Promise<TeamWithLeague | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*, leagues(*, countries(*))")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Erro ao buscar time: ${error.message}`);
  }

  return data as TeamWithLeague;
}

export async function getTeamsByLeagueId(leagueId: string): Promise<TeamWithLeague[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("teams")
    .select("*, leagues(*, countries(*))")
    .eq("league_id", leagueId)
    .order("short_name", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar times da liga: ${error.message}`);
  }

  return (data ?? []) as TeamWithLeague[];
}

export async function createTeam(input: TeamInput, logo?: File | null) {
  const name = input.name.trim();
  const league_id = input.leagueId;

  if (!name || !league_id) {
    throw new Error("Nome do time e liga sao obrigatorios.");
  }

  const supabase = await createSupabaseServerClient();
  const logo_url = logo && logo.size > 0 ? await uploadTeamLogo(logo) : input.logoUrl?.trim() || null;

  const { error } = await supabase.from("teams").insert({
    league_id,
    name,
    short_name: input.shortName?.trim() || null,
    city: input.city?.trim() || null,
    stadium: input.stadium?.trim() || null,
    founded_year: input.foundedYear ?? null,
    logo_url,
    description: input.description?.trim() || null
  });

  if (error) {
    throw new Error(`Erro ao cadastrar time: ${error.message}`);
  }
}

export async function updateTeam(id: string, input: TeamInput, logo?: File | null) {
  const name = input.name.trim();
  const league_id = input.leagueId;

  if (!name || !league_id) {
    throw new Error("Nome do time e liga sao obrigatorios.");
  }

  const logo_url = logo && logo.size > 0 ? await uploadTeamLogo(logo) : input.logoUrl?.trim() || null;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("teams")
    .update({
      league_id,
      name,
      short_name: input.shortName?.trim() || null,
      city: input.city?.trim() || null,
      stadium: input.stadium?.trim() || null,
      founded_year: input.foundedYear ?? null,
      logo_url,
      description: input.description?.trim() || null
    })
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar time: ${error.message}`);
  }
}

export async function canDeleteTeam(id: string): Promise<DeleteCheck> {
  if (!isSupabaseConfigured()) {
    return canDeleteTeamFromCounts({ squadMemberships: 0, transfersFrom: 0, transfersTo: 0 });
  }

  const supabase = await createSupabaseServerClient();
  const [squadMemberships, transfersFrom, transfersTo] = await Promise.all([
    supabase
      .from("squad_memberships")
      .select("*", { count: "exact", head: true })
      .eq("team_id", id),
    supabase
      .from("transfers")
      .select("*", { count: "exact", head: true })
      .eq("from_team_id", id),
    supabase
      .from("transfers")
      .select("*", { count: "exact", head: true })
      .eq("to_team_id", id)
  ]);

  const firstError = squadMemberships.error ?? transfersFrom.error ?? transfersTo.error;

  if (firstError) {
    throw new Error(`Erro ao verificar historico do time: ${firstError.message}`);
  }

  return canDeleteTeamFromCounts({
    squadMemberships: squadMemberships.count ?? 0,
    transfersFrom: transfersFrom.count ?? 0,
    transfersTo: transfersTo.count ?? 0
  });
}

export async function deleteTeam(id: string) {
  const check = await canDeleteTeam(id);

  if (!check.canDelete) {
    throw new Error(check.reason ?? "Time nao pode ser excluido.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir time: ${error.message}`);
  }
}

export async function getDuplicateTeamsByLeague() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const teams = await getTeams();
  const groups = new Map<string, TeamWithLeague[]>();

  for (const team of teams) {
    const key = `${team.league_id}:${team.name.trim().toLowerCase()}`;
    groups.set(key, [...(groups.get(key) ?? []), team]);
  }

  return [...groups.values()].filter((group) => group.length > 1);
}

async function uploadTeamLogo(file: File) {
  const supabase = await createSupabaseServerClient();
  const extension = getSafeExtension(file.name);
  const path = `${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(TEAM_LOGOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false
  });

  if (error) {
    throw new Error(`Erro ao enviar logo: ${error.message}`);
  }

  const { data } = supabase.storage.from(TEAM_LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function getSafeExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension || "png";
}
