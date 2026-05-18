import { notFound, redirect } from "next/navigation";
import { TeamForm } from "@/components/teams/TeamForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getLeagues } from "@/services/leagues";
import { getTeamById, updateTeam } from "@/services/teams";
import type { FormState } from "@/types/forms";

type EditTeamPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateTeamAction(id: string, _: FormState, formData: FormData): Promise<FormState> {
  "use server";

  const foundedYearValue = String(formData.get("foundedYear") ?? "");
  const logo = formData.get("logo");

  try {
    await updateTeam(
      id,
      {
        name: String(formData.get("name") ?? ""),
        shortName: String(formData.get("shortName") ?? ""),
        leagueId: String(formData.get("leagueId") ?? ""),
        city: String(formData.get("city") ?? ""),
        stadium: String(formData.get("stadium") ?? ""),
        foundedYear: foundedYearValue ? Number(foundedYearValue) : null,
        logoUrl: String(formData.get("logoUrl") ?? ""),
        description: String(formData.get("description") ?? "")
      },
      logo instanceof File ? logo : null
    );
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel atualizar o time.")
    };
  }

  redirect("/teams?updated=team");
}

export default async function EditTeamPage({ params }: EditTeamPageProps) {
  const { id } = await params;
  const [team, leagues] = await Promise.all([getTeamById(id), getLeagues()]);

  if (!team) {
    notFound();
  }

  return (
    <div>
      <PageHeader title="Editar time" description="Ajuste dados basicos sem alterar historico." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <TeamForm
        leagues={leagues}
        action={updateTeamAction.bind(null, id)}
        initialValues={team}
        submitLabel="Atualizar time"
      />
    </div>
  );
}
