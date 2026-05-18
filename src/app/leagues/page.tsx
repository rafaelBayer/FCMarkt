import Link from "next/link";
import { ActionLink } from "@/components/ui/ActionLink";
import { DeleteButton } from "@/components/ui/DeleteButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LogoBox } from "@/components/ui/LogoBox";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { assertConfirmed } from "@/services/admin-rules";
import { getErrorMessage } from "@/lib/errors";
import { redirectWithMessage } from "@/lib/action-redirects";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { deleteLeague, getLeagues } from "@/services/leagues";

export const dynamic = "force-dynamic";

type LeaguesPageProps = {
  searchParams?: Promise<{
    created?: string;
    updated?: string;
    deleted?: string;
    error?: string;
  }>;
};

async function deleteLeagueAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  let errorMessage: string | null = null;

  try {
    assertConfirmed(formData.get("confirmed") === "1", "liga");
    await deleteLeague(id);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Nao foi possivel excluir a liga.");
  }

  if (errorMessage) {
    redirectWithMessage("/leagues", "error", errorMessage);
  }

  redirectWithMessage("/leagues", "deleted", "Liga excluida com sucesso.");
}

export default async function LeaguesPage({ searchParams }: LeaguesPageProps) {
  const params = await searchParams;
  const leagues = await getLeagues();

  return (
    <div>
      <PageHeader
        title="Ligas"
        description="Organize competicoes e vincule cada uma ao seu pais."
        action={{ href: "/leagues/new", label: "Nova liga" }}
      />
      {params?.created === "league" ? (
        <StatusMessage tone="success">Liga cadastrada com sucesso.</StatusMessage>
      ) : null}
      {params?.updated === "league" ? (
        <StatusMessage tone="success">Liga atualizada com sucesso.</StatusMessage>
      ) : null}
      {params?.deleted ? <StatusMessage tone="success">{params.deleted}</StatusMessage> : null}
      {params?.error ? <StatusMessage tone="error">{params.error}</StatusMessage> : null}
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      {leagues.length === 0 ? (
        <EmptyState
          title="Nenhuma liga cadastrada"
          description="Crie uma liga depois de cadastrar pelo menos um pais."
          action={{ href: "/leagues/new", label: "Criar liga" }}
        />
      ) : (
        <div className="grid gap-3">
          {leagues.map((league) => (
            <div
              key={league.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            >
              <Link href={`/leagues/${league.id}`} className="flex min-w-0 items-center gap-3">
                <LogoBox src={league.logo_url} label={league.name} size="md" />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-slate-950">{league.name}</h2>
                  <p className="text-sm text-slate-600">
                    {league.countries?.name ?? "Pais nao informado"}
                  </p>
                </div>
              </Link>
              <div className="flex shrink-0 flex-wrap gap-2">
                <ActionLink href={`/leagues/${league.id}`}>Ver times</ActionLink>
                <ActionLink href={`/leagues/${league.id}/edit`}>Editar</ActionLink>
                <DeleteButton
                  id={league.id}
                  action={deleteLeagueAction}
                  confirmMessage="Excluir esta liga? Esta acao so sera permitida se nao houver times vinculados."
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
