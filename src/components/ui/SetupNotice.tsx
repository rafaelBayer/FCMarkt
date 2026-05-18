import { SUPABASE_ENV_ERROR } from "@/lib/supabase/server";

export function SetupNotice() {
  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <strong className="font-semibold">Supabase pendente:</strong> {SUPABASE_ENV_ERROR}
    </div>
  );
}
