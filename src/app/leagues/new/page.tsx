import { redirect } from "next/navigation";
import { LeagueForm } from "@/components/leagues/LeagueForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCountries } from "@/services/countries";
import { createLeague } from "@/services/leagues";

export const dynamic = "force-dynamic";

async function createLeagueAction(formData: FormData) {
  "use server";

  await createLeague({
    name: String(formData.get("name") ?? ""),
    countryId: String(formData.get("countryId") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? "")
  });

  redirect("/leagues");
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
