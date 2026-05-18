import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoBox } from "@/components/ui/LogoBox";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getTeamById } from "@/services/teams";

export const dynamic = "force-dynamic";

type TeamDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TeamDetailsPage({ params }: TeamDetailsPageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <PageHeader title="Detalhes do time" />
        <SetupNotice />
      </div>
    );
  }

  const { id } = await params;
  const team = await getTeamById(id);

  if (!team) {
    notFound();
  }

  const league = team.leagues;
  const country = league?.countries;
  const displayName = team.short_name || team.name;

  return (
    <div>
      <PageHeader
        title={displayName}
        description={`${league?.name ?? "Liga nao informada"}${country ? ` - ${country.name}` : ""}`}
      />
      <section className="grid gap-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[180px_1fr]">
        <LogoBox src={team.logo_url} label={displayName} size="xl" />
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{displayName}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm font-medium">
              {league ? (
                <Link
                  href={`/leagues/${league.id}`}
                  className="rounded-md bg-teal-50 px-3 py-1.5 text-teal-800 hover:bg-teal-100"
                >
                  {league.name}
                </Link>
              ) : (
                <span className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-600">Liga nao informada</span>
              )}
              <span className="rounded-md bg-slate-100 px-3 py-1.5 text-slate-700">
                {country?.name ?? "Pais nao informado"}
              </span>
            </div>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Info label="Cidade" value={team.city} />
            <Info label="Estadio" value={team.stadium} />
            <Info label="Fundacao" value={team.founded_year?.toString()} />
            <Info label="Nome oficial" value={team.name} />
          </dl>
          {team.description ? <p className="leading-7 text-slate-700">{team.description}</p> : null}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-950">{value || "Nao informado"}</dd>
    </div>
  );
}
