import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getSeasons } from "@/services/seasons";

export const dynamic = "force-dynamic";

type SeasonsPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

export default async function SeasonsPage({ searchParams }: SeasonsPageProps) {
  const params = await searchParams;
  const seasons = await getSeasons();

  return (
    <div>
      <PageHeader
        title="Temporadas"
        description="Organize os anos do seu modo carreira para elencos e transferencias manuais."
        action={{ href: "/seasons/new", label: "Nova temporada" }}
      />
      {params?.created === "season" ? (
        <StatusMessage tone="success">Temporada cadastrada com sucesso.</StatusMessage>
      ) : null}
      {!isSupabaseConfigured() ? <SetupNotice /> : null}

      {seasons.length === 0 ? (
        <EmptyState
          title="Nenhuma temporada cadastrada"
          description="Crie uma temporada para registrar elencos e transferencias do save."
          action={{ href: "/seasons/new", label: "Criar temporada" }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {seasons.map((season) => (
            <div key={season.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                Temporada
              </p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">{season.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {season.start_year} ate {season.end_year}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
