import { redirect } from "next/navigation";
import { TeamForm } from "@/components/teams/TeamForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getLeagues } from "@/services/leagues";
import { createTeam } from "@/services/teams";
import type { FormState } from "@/types/forms";

export const dynamic = "force-dynamic";

async function createTeamAction(_: FormState, formData: FormData): Promise<FormState> {
  "use server";

  const foundedYearValue = String(formData.get("foundedYear") ?? "");
  const logo = formData.get("logo");
  let foundedYear: number | null = null;

  if (foundedYearValue) {
    const parsedFoundedYear = Number(foundedYearValue);

    if (
      !Number.isInteger(parsedFoundedYear) ||
      parsedFoundedYear < 1800 ||
      parsedFoundedYear > 2100
    ) {
      return {
        status: "error",
        message: "Informe um ano de fundacao valido entre 1800 e 2100."
      };
    }

    foundedYear = parsedFoundedYear;
  }

  try {
    await createTeam(
      {
        name: String(formData.get("name") ?? ""),
        shortName: String(formData.get("shortName") ?? ""),
        leagueId: String(formData.get("leagueId") ?? ""),
        city: String(formData.get("city") ?? ""),
        stadium: String(formData.get("stadium") ?? ""),
        foundedYear,
        description: String(formData.get("description") ?? "")
      },
      logo instanceof File ? logo : null
    );
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel cadastrar o time.")
    };
  }

  redirect("/teams?created=team");
}

export default async function NewTeamPage() {
  const leagues = await getLeagues();

  return (
    <div>
      <PageHeader title="Novo time" description="Cadastre um clube e envie a logo para o Supabase Storage." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <TeamForm leagues={leagues} action={createTeamAction} />
    </div>
  );
}
