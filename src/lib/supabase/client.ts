import { SUPABASE_ENV_ERROR, isSupabaseConfigured } from "./server";
import { createClient } from "@/utils/supabase/client";

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  return createClient();
}
