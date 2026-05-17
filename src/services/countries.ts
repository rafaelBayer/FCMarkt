import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Country } from "@/types/database";

export type CountryInput = {
  name: string;
  code?: string | null;
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

export async function createCountry(input: CountryInput) {
  const name = input.name.trim();
  const code = input.code?.trim().toUpperCase() || null;

  if (!name) {
    throw new Error("Nome do pais e obrigatorio.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("countries").insert({ name, code });

  if (error) {
    throw new Error(`Erro ao cadastrar pais: ${error.message}`);
  }
}
