import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl, SUPABASE_ENV_ERROR } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies directly. Middleware refreshes sessions.
        }
      }
    }
  });
};

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}
