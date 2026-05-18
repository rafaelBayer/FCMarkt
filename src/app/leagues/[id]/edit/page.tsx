import { notFound, redirect } from "next/navigation";
import { LeagueForm } from "@/components/leagues/LeagueForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCountries } from "@/services/countries";
import { getLeagueById, updateLeague } from "@/services/leagues";
import type { FormState } from "@/types/forms";

type EditLeaguePageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateLeagueAction(id: string, _: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await updateLeague(id, {
      name: String(formData.get("name") ?? ""),
      countryId: String(formData.get("countryId") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel atualizar a liga.")
    };
  }

  redirect("/leagues?updated=league");
}

export default async function EditLeaguePage({ params }: EditLeaguePageProps) {
  const { id } = await params;
  const [league, countries] = await Promise.all([getLeagueById(id), getCountries()]);

  if (!league) {
    notFound();
  }

  return (
    <div>
      <PageHeader title="Editar liga" description="Ajuste dados basicos da competicao." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <LeagueForm
        countries={countries}
        action={updateLeagueAction.bind(null, id)}
        initialValues={league}
        submitLabel="Atualizar liga"
      />
    </div>
  );
}
