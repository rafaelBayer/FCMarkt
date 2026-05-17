import { SUPABASE_ENV_ERROR, isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export { SUPABASE_ENV_ERROR, isSupabaseConfigured };

export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  return createServerSupabaseClient();
}
