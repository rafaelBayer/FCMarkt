import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getLeagues } from "@/services/leagues";

export const dynamic = "force-dynamic";

export default async function LeaguesPage() {
  const leagues = await getLeagues();

  return (
    <div>
      <PageHeader
        title="Ligas"
        description="Organize competicoes e vincule cada uma ao seu pais."
        action={{ href: "/leagues/new", label: "Nova liga" }}
      />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      {leagues.length === 0 ? (
        <EmptyState title="Nenhuma liga cadastrada" description="Crie uma liga depois de cadastrar um pais." />
      ) : (
        <div className="grid gap-3">
          {leagues.map((league) => (
            <div
              key={league.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <h2 className="font-semibold text-slate-950">{league.name}</h2>
                <p className="text-sm text-slate-600">
                  {league.countries?.name ?? "Pais nao informado"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
