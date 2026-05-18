import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublishableKey, getSupabaseUrl, SUPABASE_ENV_ERROR } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

export const createClient = (request: NextRequest) => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(SUPABASE_ENV_ERROR);
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      }
    }
  });

  return { supabase, response: () => supabaseResponse };
};

export async function updateSession(request: NextRequest) {
  const { supabase, response } = createClient(request);
  await supabase.auth.getUser();
  return response();
}
