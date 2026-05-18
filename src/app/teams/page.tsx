import { TeamCard } from "@/components/teams/TeamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getTeams } from "@/services/teams";

export const dynamic = "force-dynamic";

type TeamsPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams;
  const teams = await getTeams();

  return (
    <div>
      <PageHeader
        title="Times"
        description="Lista de clubes cadastrados com liga, pais e logo."
        action={{ href: "/teams/new", label: "Novo time" }}
      />
      {params?.created === "team" ? (
        <StatusMessage tone="success">Time cadastrado com sucesso.</StatusMessage>
      ) : null}
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      {teams.length === 0 ? (
        <EmptyState
          title="Nenhum time cadastrado"
          description="Cadastre ligas e crie seu primeiro time para popular o catalogo."
          action={{ href: "/teams/new", label: "Criar time" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
