import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabaseUrl, SUPABASE_ENV_ERROR } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export const createClient = () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
};
