import { redirect } from "next/navigation";
import { CountryForm } from "@/components/countries/CountryForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createCountry } from "@/services/countries";

async function createCountryAction(formData: FormData) {
  "use server";

  await createCountry({
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? "")
  });

  redirect("/countries");
}

export default function NewCountryPage() {
  return (
    <div>
      <PageHeader title="Novo pais" description="Adicione um pais para vincular ligas." />
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <CountryForm action={createCountryAction} />
    </div>
  );
}
