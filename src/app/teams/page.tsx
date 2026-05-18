import { TeamCard } from "@/components/teams/TeamCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { assertConfirmed } from "@/services/admin-rules";
import { getErrorMessage } from "@/lib/errors";
import { redirectWithMessage } from "@/lib/action-redirects";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteTeam, getTeams } from "@/services/teams";

export const dynamic = "force-dynamic";

type TeamsPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
};

async function deleteTeamAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "time");
    await deleteTeam(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir o time.");
  }

  if (errorMessage) {
    redirectWithMessage("/teams", "error", errorMessage);
  }

  redirectWithMessage("/teams", "deleted", "Time excluido com sucesso.");
}

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
      {params?.updated === "team" ? (
        <StatusMessage tone="success">Time atualizado com sucesso.</StatusMessage>
      ) : null}
      {params?.deleted ? <StatusMessage tone="success">{params.deleted}</StatusMessage> : null}
      {params?.error ? <StatusMessage tone="error">{params.error}</StatusMessage> : null}
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
            <TeamCard key={team.id} team={team} deleteAction={deleteTeamAction} />
          ))}
        </div>
      )}
    </div>
  );
}
