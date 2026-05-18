import { redirect } from "next/navigation";
import { TeamForm } from "@/components/teams/TeamForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getLeagues } from "@/services/leagues";
import { createTeam } from "@/services/teams";

export const dynamic = "force-dynamic";

async function createTeamAction(formData: FormData) {
  "use server";

  const foundedYearValue = String(formData.get("foundedYear") ?? "");
  const logo = formData.get("logo");

  await createTeam(
    {
      name: String(formData.get("name") ?? ""),
      shortName: String(formData.get("shortName") ?? ""),
      leagueId: String(formData.get("leagueId") ?? ""),
      city: String(formData.get("city") ?? ""),
      stadium: String(formData.get("stadium") ?? ""),
      foundedYear: foundedYearValue ? Number(foundedYearValue) : null,
      description: String(formData.get("description") ?? "")
    },
    logo instanceof File ? logo : null
  );

  redirect("/teams");
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
