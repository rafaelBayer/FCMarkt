import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Country } from "@/types/database";
import { canDeleteCountryFromCounts, type DeleteCheck } from "@/services/admin-rules";
import {
  buildPaginatedResult,
  emptyPaginatedResult,
  normalizePagination,
  type PaginatedResult,
  type PaginationParams
} from "@/services/pagination";

export type CountryInput = {
  name: string;
  code?: string | null;
  flagUrl?: string | null;
};

export async function getCountries(): Promise<Country[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("countries").select("*").order("name");

  if (error) {
    throw new Error(`Erro ao buscar paises: ${error.message}`);
  }

  return data ?? [];
}

export async function getPaginatedCountries(
  params: PaginationParams = {}
): Promise<PaginatedResult<Country>> {
  if (!isSupabaseConfigured()) {
    return emptyPaginatedResult(params);
  }

  const pagination = normalizePagination(params);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("countries")
    .select("*", { count: "exact" })
    .order("name")
    .range(pagination.from, pagination.to);

  if (pagination.search) {
    const search = escapeSupabaseLike(pagination.search);
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar paises: ${error.message}`);
  }

  return buildPaginatedResult({
    data: data ?? [],
    count,
    page: pagination.page,
    pageSize: pagination.pageSize
  });
}

export async function getCountryById(id: string): Promise<Country | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("countries").select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Erro ao buscar pais: ${error.message}`);
  }

  return data;
}

export async function createCountry(input: CountryInput) {
  const name = input.name.trim();
  const code = input.code?.trim().toUpperCase() || null;
  const flag_url = input.flagUrl?.trim() || null;

  if (!name) {
    throw new Error("Nome do pais e obrigatorio.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("countries").insert({ name, code, flag_url });

  if (error) {
    throw new Error(`Erro ao cadastrar pais: ${error.message}`);
  }
}

export async function updateCountry(id: string, input: CountryInput) {
  const name = input.name.trim();
  const code = input.code?.trim().toUpperCase() || null;
  const flag_url = input.flagUrl?.trim() || null;

  if (!name) {
    throw new Error("Nome do pais e obrigatorio.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("countries").update({ name, code, flag_url }).eq("id", id);

  if (error) {
    throw new Error(`Erro ao atualizar pais: ${error.message}`);
  }
}

export async function canDeleteCountry(id: string): Promise<DeleteCheck> {
  if (!isSupabaseConfigured()) {
    return canDeleteCountryFromCounts({ leagues: 0 });
  }

  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("leagues")
    .select("*", { count: "exact", head: true })
    .eq("country_id", id);

  if (error) {
    throw new Error(`Erro ao verificar ligas vinculadas: ${error.message}`);
  }

  return canDeleteCountryFromCounts({ leagues: count ?? 0 });
}

export async function deleteCountry(id: string) {
  const check = await canDeleteCountry(id);

  if (!check.canDelete) {
    throw new Error(check.reason ?? "Pais nao pode ser excluido.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("countries").delete().eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir pais: ${error.message}`);
  }
}

function escapeSupabaseLike(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}
