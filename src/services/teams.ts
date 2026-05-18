import { randomUUID } from "crypto";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { TeamWithLeague } from "@/types/database";

const TEAM_LOGOS_BUCKET = "team-logos";

export type TeamInput = {
  leagueId: string;
  name: string;
  shortName?: string | null;
  city?: string | null;
  stadium?: string | null;
  foundedYear?: number | null;
  description?: string | null;
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
  const logo_url = logo && logo.size > 0 ? await uploadTeamLogo(logo) : null;

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
