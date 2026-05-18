import { redirect } from "next/navigation";
import { LeagueForm } from "@/components/leagues/LeagueForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { getErrorMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCountries } from "@/services/countries";
import { createLeague } from "@/services/leagues";
import type { FormState } from "@/types/forms";

export const dynamic = "force-dynamic";

async function createLeagueAction(_: FormState, formData: FormData): Promise<FormState> {
  "use server";

  try {
    await createLeague({
      name: String(formData.get("name") ?? ""),
      countryId: String(formData.get("countryId") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? "")
    });
  } catch (error) {
    return {
      status: "error",
      message: getErrorMessage(error, "Nao foi possivel cadastrar a liga.")
    };
  }

  redirect("/leagues?created=league");
}

export default async function NewLeaguePage() {
  const countries = await getCountries();

  return (
    <div>
      <PageHeader title="Nova liga" description="Vincule uma liga a um pais ja cadastrado." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <LeagueForm countries={countries} action={createLeagueAction} />
    </div>
  );
}
